import { CreateVideoEventsUseCase } from './CreateVideoEventsUseCase';
import { SQSHandler, ESQSMessageType } from '../../infra/aws/sqs/SQSHandler';
import { Logger } from '../../infra/utils/logger';
import { IVideoManager } from '../../infra/video-manager/IVideoManager';
import { IS3Handler } from '../../infra/aws/s3/IS3Handler';

jest.mock('../../infra/aws/sqs/SQSHandler');
jest.mock('../../infra/utils/logger');

const mockGeneratePresignedURL = jest.fn();
const mockGetDuration = jest.fn();

const createUseCase = (duration: number) => {
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
  it('should decode key, generate URL, calculate duration, and send events', async () => {
    const input = {
      bucket: 'test-bucket',
      key: 'my+video%2Ffile.mp4',
    };

    const decodedKey = 'my video/file.mp4';
    const videoUrl = 'https://signed-url.com/video.mp4';
    const videoDuration = 125; // 2 eventos: 60s + 65s

    mockGeneratePresignedURL.mockResolvedValue(videoUrl);
    mockGetDuration.mockResolvedValue(videoDuration);

    const mockSendMessage = jest.spyOn(SQSHandler, 'sendMessage').mockResolvedValue();

    const useCase = createUseCase(videoDuration);

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
});
