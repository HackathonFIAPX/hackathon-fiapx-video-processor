import { Context, SQSEvent } from 'aws-lambda';
import { ProcessS3NotificationsController } from './controllers/ProcessS3Notifications.controller';
import { CreateVideoFpsController } from './controllers/CreateVideoFPS.controller';
import { Logger } from './infra/utils/logger';
import { Router } from './controllers/router';
import { EVideoProcessorRoutes, VideoProcessor } from './video.processor';

jest.mock('./controllers/ProcessS3Notifications.controller');
jest.mock('./controllers/CreateVideoFPS.controller');
jest.mock('./infra/utils/logger');
jest.mock('./controllers/router');

const mockExecute = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (Router as jest.Mock).mockImplementation(() => ({
    use: jest.fn(),
    execute: mockExecute
  }));
});

const createSQSEvent = (body: any): SQSEvent => ({
  Records: [
    {
      body: JSON.stringify(body)
    }
  ]
}) as SQSEvent;

const mockContext = {} as Context;

describe('when route is NOTIFICATION', () => {
  it('should call ProcessS3NotificationsController and return response', async () => {
    const mockResponse = { success: true };
    mockExecute.mockResolvedValue(mockResponse);

    const body = {
      Type: EVideoProcessorRoutes.NOTIFICATION,
      body: 'test',
    };

    const event = createSQSEvent(body);

    const result = await VideoProcessor.handler(event, mockContext);

    expect(ProcessS3NotificationsController).toHaveBeenCalled();
    expect(CreateVideoFpsController).toHaveBeenCalled();
    expect(mockExecute).toHaveBeenCalledWith(body.Type, body);
    expect(Logger.info).toHaveBeenCalledWith('VideoProcessor.handler', 'start', event);
    expect(Logger.info).toHaveBeenCalledWith('VideoProcessor.handler', 'end', mockResponse);
    expect(result).toEqual(mockResponse);
  });
});

describe('when route is GENERATE_FPS', () => {
  it('should call CreateVideoFpsController and return response', async () => {
    const mockResponse = { framesGenerated: true };
    mockExecute.mockResolvedValue(mockResponse);

    const body = {
      Type: 'Other',
      type: EVideoProcessorRoutes.GENERATE_FPS,
      data: { videoId: '123' },
    };

    const event = createSQSEvent(body);

    const result = await VideoProcessor.handler(event, mockContext);

    expect(ProcessS3NotificationsController).toHaveBeenCalled();
    expect(CreateVideoFpsController).toHaveBeenCalled();
    expect(mockExecute).toHaveBeenCalledWith(body.type, body.data);
    expect(Logger.info).toHaveBeenCalledWith('VideoProcessor.handler', 'start', event);
    expect(Logger.info).toHaveBeenCalledWith('VideoProcessor.handler', 'end', mockResponse);
    expect(result).toEqual(mockResponse);
  });
});

describe('when an error is thrown during processing', () => {
  it('should log the error and rethrow with message', async () => {
    const body = {
      Type: EVideoProcessorRoutes.NOTIFICATION,
      body: 'invalid'
    };

    const event = createSQSEvent(body);

    const error = new Error('Unexpected failure');
    mockExecute.mockRejectedValue(error);

    await expect(VideoProcessor.handler(event, mockContext)).rejects.toThrow(
      `Error processing video: ${error.message}`
    );

    expect(Logger.error).toHaveBeenCalledWith('VideoProcessor.handler', 'error', error);
  });
});
