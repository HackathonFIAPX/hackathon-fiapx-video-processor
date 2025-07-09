import { CreateVideoFpsUseCase } from './CreateVideoFpsUseCase';
import { Logger } from '../../infra/utils/logger';
import { IS3Handler } from '../../infra/aws/s3/IS3Handler';
import { IVideoManager } from '../../infra/video-manager/IVideoManager';
import { IZipper } from '../../infra/zipper/IZipper';
import { envS3 } from '../../config/s3';
import { EFileType } from '../../infra/aws/s3/TS3Handler';

jest.mock('../../infra/utils/logger');

const mockGeneratePresignedURL = jest.fn();
const mockGenerateFPS = jest.fn();
const mockZipFolder = jest.fn();
const mockUploadZip = jest.fn();

const mockVideoManager: IVideoManager = {
    getDurationFromS3VideoURL: jest.fn(),
    generateFPSFromS3VideoURLAndSpecificDuration: mockGenerateFPS,
    generateFPSFromS3VideoURLAndStartTime: mockGenerateFPS,    
};

const mockS3Handler: IS3Handler = {
    generatePresignedURL: mockGeneratePresignedURL,
    uploadImage: jest.fn(),
    uploadImages: jest.fn(),
    uploadZip: mockUploadZip,
};

const mockZipper: IZipper = {
  zipFolder: mockZipFolder,
};

const mockInput = {
  bucket: 'bucket',
  key: 'video.mp4',
  duration: 60,
  startTime: 0,
  eventIndex: 1,
  totalEvents: 1,
};

describe('when executing CreateVideoFpsUseCase', () => {
  let useCase: CreateVideoFpsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CreateVideoFpsUseCase(mockVideoManager, mockS3Handler, mockZipper);
  });

  it('should generate FPS, zip the folder and upload to S3', async () => {
    const videoUrl = 'https://s3/video.mp4';
    const imagesDir = '/tmp/images';
    const zipPath = '/tmp/images.zip';

    mockGeneratePresignedURL.mockResolvedValue(videoUrl);
    mockGenerateFPS.mockResolvedValue({ imagesDir });
    mockZipFolder.mockResolvedValue(zipPath);
    mockUploadZip.mockResolvedValue(undefined);

    await useCase.execute(mockInput);

    expect(mockGeneratePresignedURL).toHaveBeenCalledWith({
      bucket: mockInput.bucket,
      key: mockInput.key,
    });

    expect(mockGenerateFPS).toHaveBeenCalledWith({
      s3VideoURL: videoUrl,
      duration: mockInput.duration,
      startTime: mockInput.startTime,
      fileName: expect.stringMatching(/^user-info-test-\d+$/),
    });

    expect(mockZipFolder).toHaveBeenCalledWith(
      imagesDir,
      expect.stringMatching(/^idx-1-start-0-now-\d+$/)
    );

    expect(mockUploadZip).toHaveBeenCalledWith({
      bucket: envS3.fpsBucketName,
      outputKey: 'user_info/test',
      fileType: EFileType.ZIP,
      zipFilePath: zipPath,
      fileName: expect.stringMatching(/^idx-1-start-0-now-\d+\.zip$/),
    });

    expect(Logger.info).toHaveBeenCalledWith(
      `CreateVideoFpsUseCase IDX: ${mockInput.eventIndex}`,
      'Executing create video FPS',
      { input: mockInput }
    );

    expect(Logger.info).toHaveBeenCalledWith(
      `CreateVideoFpsUseCase IDX: ${mockInput.eventIndex}`,
      'FPS images generated',
      { dirWithImages: imagesDir }
    );

    expect(Logger.info).toHaveBeenCalledWith(
      `CreateVideoFpsUseCase IDX: ${mockInput.eventIndex}`,
      'Uploading zipped file to S3',
      { zipFilePath: zipPath, outputKey: 'user_info/test' }
    );

    expect(Logger.info).toHaveBeenCalledWith(
      `CreateVideoFpsUseCase IDX: ${mockInput.eventIndex}`,
      'Zipped file uploaded successfully',
      { outputKey: 'user_info/test' }
    );
  });

  it('should throw an error if generatePresignedURL fails', async () => {
    const error = new Error('Presigned URL error');
    mockGeneratePresignedURL.mockRejectedValue(error);

    await expect(useCase.execute(mockInput)).rejects.toThrow(error);
    expect(Logger.info).toHaveBeenCalledWith(
      `CreateVideoFpsUseCase IDX: ${mockInput.eventIndex}`,
      'Executing create video FPS',
      { input: mockInput }
    );
    expect(Logger.info).not.toHaveBeenCalledWith(
      `CreateVideoFpsUseCase IDX: ${mockInput.eventIndex}`,
      'FPS images generated',
      expect.any(Object)
    );
  });

  it('should throw an error if generateFPS fails', async () => {
    const videoUrl = 'https://s3/video.mp4';
    const error = new Error('Generate FPS error');

    mockGeneratePresignedURL.mockResolvedValue(videoUrl);
    mockGenerateFPS.mockRejectedValue(error);

    await expect(useCase.execute(mockInput)).rejects.toThrow(error);
    expect(Logger.info).toHaveBeenCalledWith(
      `CreateVideoFpsUseCase IDX: ${mockInput.eventIndex}`,
      'Executing create video FPS',
      { input: mockInput }
    );
    expect(Logger.info).not.toHaveBeenCalledWith(
      `CreateVideoFpsUseCase IDX: ${mockInput.eventIndex}`,
      'FPS images generated',
      expect.any(Object)
    );
  });

  it('should throw an error if zipFolder fails', async () => {
    const videoUrl = 'https://s3/video.mp4';
    const imagesDir = '/tmp/images';
    const error = new Error('Zip folder error');

    mockGeneratePresignedURL.mockResolvedValue(videoUrl);
    mockGenerateFPS.mockResolvedValue({ imagesDir });
    mockZipFolder.mockRejectedValue(error);

    await expect(useCase.execute(mockInput)).rejects.toThrow(error);
    expect(Logger.info).toHaveBeenCalledWith(
      `CreateVideoFpsUseCase IDX: ${mockInput.eventIndex}`,
      'Executing create video FPS',
      { input: mockInput }
    );
    expect(Logger.info).toHaveBeenCalledWith(
      `CreateVideoFpsUseCase IDX: ${mockInput.eventIndex}`,
      'FPS images generated',
      { dirWithImages: imagesDir }
    );
    expect(Logger.info).not.toHaveBeenCalledWith(
      `CreateVideoFpsUseCase IDX: ${mockInput.eventIndex}`,
      'Uploading zipped file to S3',
      expect.any(Object)
    );
  });

  it('should throw an error if uploadZip fails', async () => {
    const videoUrl = 'https://s3/video.mp4';
    const imagesDir = '/tmp/images';
    const zipPath = '/tmp/images.zip';
    const error = new Error('Upload zip error');

    mockGeneratePresignedURL.mockResolvedValue(videoUrl);
    mockGenerateFPS.mockResolvedValue({ imagesDir });
    mockZipFolder.mockResolvedValue(zipPath);
    mockUploadZip.mockRejectedValue(error);

    await expect(useCase.execute(mockInput)).rejects.toThrow(error);
    expect(Logger.info).toHaveBeenCalledWith(
      `CreateVideoFpsUseCase IDX: ${mockInput.eventIndex}`,
      'Executing create video FPS',
      { input: mockInput }
    );
    expect(Logger.info).toHaveBeenCalledWith(
      `CreateVideoFpsUseCase IDX: ${mockInput.eventIndex}`,
      'FPS images generated',
      { dirWithImages: imagesDir }
    );
    expect(Logger.info).toHaveBeenCalledWith(
      `CreateVideoFpsUseCase IDX: ${mockInput.eventIndex}`,
      'Uploading zipped file to S3',
      { zipFilePath: zipPath, outputKey: 'user_info/test' }
    );
    expect(Logger.info).not.toHaveBeenCalledWith(
      `CreateVideoFpsUseCase IDX: ${mockInput.eventIndex}`,
      'Zipped file uploaded successfully',
      expect.any(Object)
    );
  });

  it('when initialized without dependencies should still work', () => {
    const useCaseWithoutDeps = new CreateVideoFpsUseCase();
    expect(useCaseWithoutDeps).toBeInstanceOf(CreateVideoFpsUseCase);
  });
});