import { CreateVideoEventsUseCase } from "../usecase/create-video-events/CreateVideoEventsUseCase";
import { ICreateVideoEventsUseCase } from "../usecase/create-video-events/ICreateVideoEventsUseCase";
import { IController } from "./controller";
import { HandlerResponse } from "./router";

type TProcessS3NotificationsController = {
    Message: string;
}

export class ProcessS3NotificationsController implements IController<TProcessS3NotificationsController> {
    constructor(
        private readonly createVideoEventsUseCase: ICreateVideoEventsUseCase = new CreateVideoEventsUseCase()
    ) {}

    async execute(request: TProcessS3NotificationsController): Promise<HandlerResponse> {
        const body = JSON.parse(request.Message);
        await this.createVideoEventsUseCase.execute({
            bucket: body.Records[0].s3.bucket.name,
            key: body.Records[0].s3.object.key,
        });
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "S3 notification processed successfully",
            }),
        };
    }
}