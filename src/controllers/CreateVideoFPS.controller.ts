import { Logger } from "../infra/utils/logger";
import { CreateVideoFpsUseCase } from "../usecase/create-video-fps/CreateVideoFpsUseCase";
import { ICreateVideoFpsUseCase } from "../usecase/create-video-fps/ICreateVideoFpsUseCase";
import { IController } from "./controller";
import { HandlerResponse } from "./router";

export type TCreateVideoFpsController = {
    bucket: string,
    key: string,
    startTime: number,
    duration: number,
    eventIndex: number,
    totalEvents: number,
    clientId: string,
    videoId: string
}

export class CreateVideoFpsController implements IController<TCreateVideoFpsController> {
    constructor(
        private readonly createVideoFpsUseCase: ICreateVideoFpsUseCase = new CreateVideoFpsUseCase()
    ) {}

    async execute(input: TCreateVideoFpsController): Promise<HandlerResponse> {
        Logger.info("CreateVideoFpsController", "Executing create video FPS", { input });
        const result = await this.createVideoFpsUseCase.execute(input);

        Logger.info("CreateVideoFpsController", "Video FPS created successfully", { result });
        return {
            body: result,
            statusCode: 200,
        }
    }
}