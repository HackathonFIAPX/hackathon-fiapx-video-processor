import { CreateVideoEventsUseCase } from './CreateVideoEventsUseCase';
import { SQSHandler, ESQSMessageType } from '../../infra/aws/sqs/SQSHandler';
import { Logger } from '../../infra/utils/logger';
import { IVideoManager } from '../../infra/video-manager/IVideoManager';
import { IS3Handler } from '../../infra/aws/s3/IS3Handler';

jest.mock('../../infra/aws/sqs/SQSHandler');
jest.mock('../../infra/utils/logger');

const mockGeneratePresignedURL = jest.fn();
const mockGetDuration = jest.fn();

const createUseCase = () => {
  const videoManager: IVideoManager = {
    getDurationFromS3VideoURL: mockGetDuration,
    generateFPSFromS3VideoURLAndSpecificDuration: jest.fn(),
    generateFPSFromS3VideoURLAndStartTime: jest.fn(),
  };

  const s3Handler: IS3Handler = {
    generatePresignedURL: mockGeneratePresignedURL,
    uploadImage: jest.fn(),
    uploadImages: jest.fn(),
    uploadZip: jest.fn(),
  };

  return new CreateVideoEventsUseCase(videoManager, s3Handler);
};

describe('when executing CreateVideoEventsUseCase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should decode key, generate URL, calculate duration, and send events for long videos', async () => {
    const clientId = '123456';
    const videoId = 'my_video';
    const decodedKey = `temp_video/${clientId}/${videoId}.mp4`;

    const input = {
      bucket: 'test-bucket',
      key: decodedKey,
    };

    const videoUrl = 'https://signed-url.com/video.mp4';
    const videoDuration = 125; // 3 eventos: 60s + 60s + 5s

    mockGeneratePresignedURL.mockResolvedValue(videoUrl);
    mockGetDuration.mockResolvedValue(videoDuration);

    const mockSendMessage = jest.spyOn(SQSHandler, 'sendMessage').mockResolvedValue();

    const useCase = createUseCase();

    await useCase.execute(input);

    // Verifica presigned URL
    expect(mockGeneratePresignedURL).toHaveBeenCalledWith({
      bucket: input.bucket,
      key: decodedKey,
    });

    // Verifica duração
    expect(mockGetDuration).toHaveBeenCalledWith({
      s3VideoURL: videoUrl,
    });

    // Verifica número de eventos
    expect(mockSendMessage).toHaveBeenCalledTimes(3);

    // Verifica conteúdo de cada evento enviado
    expect(mockSendMessage).toHaveBeenNthCalledWith(1, {
      data: {
        bucket: input.bucket,
        key: input.key,
        startTime: 0,
        duration: 60,
        eventIndex: 1,
        totalEvents: 3,
        clientId: clientId,
        videoId: videoId,
      },
      type: ESQSMessageType.GENERATE_FPS,
    });

    expect(mockSendMessage).toHaveBeenNthCalledWith(2, {
      data: {
        bucket: input.bucket,
        key: input.key,
        startTime: 60,
        duration: 60,
        eventIndex: 2,
        totalEvents: 3,
        clientId: clientId,
        videoId: videoId,
      },
      type: ESQSMessageType.GENERATE_FPS,
    });

    expect(mockSendMessage).toHaveBeenNthCalledWith(3, {
      data: {
        bucket: input.bucket,
        key: input.key,
        startTime: 120,
        duration: 5,
        eventIndex: 3,
        totalEvents: 3,
        clientId: clientId,
        videoId: videoId,
      },
      type: ESQSMessageType.GENERATE_FPS,
    });

    // Verifica logs
    expect(Logger.info).toHaveBeenCalledWith('CreateVideoEvents', 'Processing video events', {
      bucket: input.bucket,
      key: input.key,
    });

    expect(Logger.info).toHaveBeenCalledWith('CreateVideoEvents', 'Decoded S3 key', {
      decodedKey,
    });

    expect(Logger.info).toHaveBeenCalledWith('CreateVideoEvents', 'Generated presigned URL for video', {
      videoUrl,
    });

    expect(Logger.info).toHaveBeenCalledWith('CreateVideoEvents', 'Video duration retrieved', {
      videoDuration,
    });

    expect(Logger.info).toHaveBeenCalledWith('CreateVideoEvents', 'Creating video event', expect.any(Object));
    expect(Logger.info).toHaveBeenCalledWith('CreateVideoEvents', 'Sending video event', expect.any(Object));
  });

  it('should send a single event for videos shorter than 60 seconds', async () => {
    const clientId = 'client-short';
    const videoId = 'short_video';
    const decodedKey = `temp_video/${clientId}/${videoId}.mp4`;

    const input = {
      bucket: 'test-bucket',
      key: decodedKey,
    };

    const videoUrl = 'https://signed-url.com/short_video.mp4';
    const videoDuration = 30; // 1 evento

    mockGeneratePresignedURL.mockResolvedValue(videoUrl);
    mockGetDuration.mockResolvedValue(videoDuration);

    const mockSendMessage = jest.spyOn(SQSHandler, 'sendMessage').mockResolvedValue();

    const useCase = createUseCase();

    await useCase.execute(input);

    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith({
      data: {
        bucket: input.bucket,
        key: input.key,
        startTime: 0,
        duration: 30,
        eventIndex: 1,
        totalEvents: 1,
        clientId: clientId,
        videoId: videoId,
      },
      type: ESQSMessageType.GENERATE_FPS,
    });
  });

  it('should handle float durations and keys with special characters', async () => {
    const clientIdWithPlus = 'client+id';
    const videoIdWithPlus = 'my+video.mp4';
    const key = `temp_video/${clientIdWithPlus}/${videoIdWithPlus}`;
    const decodedKey = 'temp_video/client id/my video.mp4';
    const expectedClientId = 'client id';
    const expectedVideoId = 'my video';

    const input = {
      bucket: 'test-bucket',
      key: key,
    };

    const videoUrl = 'https://signed-url.com/video.mp4';
    const videoDuration = 65.8; // 2 eventos: 60s + 5.8s (truncado para 5s)

    mockGeneratePresignedURL.mockResolvedValue(videoUrl);
    mockGetDuration.mockResolvedValue(videoDuration);

    const mockSendMessage = jest.spyOn(SQSHandler, 'sendMessage').mockResolvedValue();

    const useCase = createUseCase();

    await useCase.execute(input);

    expect(mockGeneratePresignedURL).toHaveBeenCalledWith({
      bucket: input.bucket,
      key: decodedKey,
    });

    expect(mockSendMessage).toHaveBeenCalledTimes(2);

    expect(mockSendMessage).toHaveBeenNthCalledWith(1, {
      data: {
        bucket: input.bucket,
        key: input.key,
        startTime: 0,
        duration: 60,
        eventIndex: 1,
        totalEvents: 2,
        clientId: expectedClientId,
        videoId: expectedVideoId,
      },
      type: ESQSMessageType.GENERATE_FPS,
    });

    expect(mockSendMessage).toHaveBeenNthCalledWith(2, {
      data: {
        bucket: input.bucket,
        key: input.key,
        startTime: 60,
        duration: 5, // Math.trunc(5.8)
        eventIndex: 2,
        totalEvents: 2,
        clientId: expectedClientId,
        videoId: expectedVideoId,
      },
      type: ESQSMessageType.GENERATE_FPS,
    });
  });

  it('when initialized without dependencies should still work', () => {
    const useCaseWithoutDeps = new CreateVideoEventsUseCase();
    expect(useCaseWithoutDeps).toBeInstanceOf(CreateVideoEventsUseCase);
  });
});
