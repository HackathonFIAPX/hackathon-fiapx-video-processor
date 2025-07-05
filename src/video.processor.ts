import { Context, SQSEvent } from "aws-lambda";
import { Router } from "./controllers/router";
import { Logger } from "./infra/utils/logger";
import { ProcessS3NotificationsController } from "./controllers/ProcessS3Notifications.controller";

export enum EVideoProcessorRoutes {
    NOTIFICATION = 'Notification',
    GENERATE_FPS = 'video.processor.generate.fps',
}

export class VideoProcessor {
    static async handler(event: SQSEvent, _: Context) {
        Logger.info('VideoProcessor.handler', 'start', event);
        
        const record = event.Records[0];
        const body = JSON.parse(record.body);
        const { Type, type, data } = body;

        const processS3NotificationsController = new ProcessS3NotificationsController()

        const router = new Router();
        router.use(EVideoProcessorRoutes.NOTIFICATION,processS3NotificationsController.execute.bind(processS3NotificationsController));

        let response;
        if (EVideoProcessorRoutes.NOTIFICATION == type) {
            response = await router.execute(Type, body);
        } else {
            response = await router.execute(type, data);
        }

        Logger.info('VideoProcessor.handler', 'end', response);

        return response;
    }
}