import { SQSHandler, ESQSMessageType, TSQSMessage } from './SQSHandler';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { Logger } from '../../utils/logger';
import { envSQS } from '../../../config/sqs';

let mockSQSSend: jest.Mock;

jest.mock('@aws-sdk/client-sqs', () => {
    const originalModule = jest.requireActual('@aws-sdk/client-sqs');
    return {
        __esModule: true,
        ...originalModule,
        SQSClient: jest.fn().mockImplementation(() => ({
            send: (...args: any[]) => mockSQSSend(...args),
        })),
    };
});

jest.mock('../../utils/logger');

mockSQSSend = jest.fn();

describe('SQSHandler', () => {
    const mockedLoggerInfo = jest.spyOn(Logger, 'info');
    const mockedLoggerError = jest.spyOn(Logger, 'error');

    beforeEach(() => {
        jest.clearAllMocks();
        mockSQSSend.mockClear();
    });

    describe('sendMessage', () => {
        it('should send a message to SQS successfully and log the action', async () => {
            const message: TSQSMessage = {
                type: ESQSMessageType.GENERATE_FPS,
                data: { videoId: 'test-video-id' },
            };
            mockSQSSend.mockResolvedValue({});

            await SQSHandler.sendMessage(message);

            expect(mockedLoggerInfo).toHaveBeenCalledWith("SQSHandler", "Sending message to SQS", { request: message });
            expect(mockSQSSend).toHaveBeenCalledTimes(1);
            
            const sentCommand = mockSQSSend.mock.calls[0][0];
            expect(sentCommand).toBeInstanceOf(SendMessageCommand);
            expect(sentCommand.input.QueueUrl).toBe(envSQS.videoProcessorId);
            expect(sentCommand.input.MessageBody).toBe(JSON.stringify(message));

            expect(mockedLoggerError).not.toHaveBeenCalled();
        });

        it('should log and throw an error if sending the message to SQS fails', async () => {
            const message: TSQSMessage = {
                type: ESQSMessageType.GENERATE_FPS,
                data: { videoId: 'test-video-id' },
            };
            const originalError = new Error('SQS connection failed');
            mockSQSSend.mockRejectedValue(originalError);

            await expect(SQSHandler.sendMessage(message)).rejects.toThrow('Failed to send message to SQS');

            expect(mockedLoggerInfo).toHaveBeenCalledWith("SQSHandler", "Sending message to SQS", { request: message });
            expect(mockedLoggerError).toHaveBeenCalledWith(`Error sending message to SQS: ${originalError}`);
        });
    });
});
