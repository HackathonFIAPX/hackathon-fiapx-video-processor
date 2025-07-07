import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs"
import { envAWS } from "../../../config/aws"
import { envSQS } from "../../../config/sqs"
import { Logger } from "../../utils/logger"

const sqsClient = new SQSClient({
    region: envAWS.region,
    credentials: {
        accessKeyId: envAWS.accessKeyId,
        secretAccessKey: envAWS.secretAccessKey,
        sessionToken: envAWS.sessionToken,
    }
})

export enum ESQSMessageType {
    GENERATE_FPS = 'video.processor.generate.fps',
}

export type TSQSMessage = {
    type: ESQSMessageType
    data: any
}

export class SQSHandler {
    public static sendMessage = async (request: TSQSMessage) => {
        try {
            Logger.info("SQSHandler", "Sending message to SQS", { request })
            await sqsClient.send(new SendMessageCommand({
                QueueUrl: envSQS.videoProcessorId,
                MessageBody: JSON.stringify(request),
            }))
        } catch (error) {
            Logger.error(`Error sending message to SQS: ${error}`)
            throw new Error('Failed to send message to SQS')
        }
    }
} 