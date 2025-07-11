import { envS3 } from "../../config/s3";
import { IS3Handler } from "../../infra/aws/s3/IS3Handler";
import { S3Handler } from "../../infra/aws/s3/S3Handler";
import { EFileType, EImageType } from "../../infra/aws/s3/TS3Handler";
import { EventTrackerRepository } from "../../infra/persistence/dynamodb/repositories/EventTrackerRepository";
import { Logger } from "../../infra/utils/logger";
import { IVideoManager } from "../../infra/video-manager/IVideoManager";
import { VideoManager } from "../../infra/video-manager/VideoManager";
import { IZipper } from "../../infra/zipper/IZipper";
import { Zipper } from "../../infra/zipper/Zipper";
import { ICreateVideoFpsUseCase } from "./ICreateVideoFpsUseCase";
import { TCreateVideoFpsUseCaseInput, TCreateVideoFpsUseCaseOutput } from "./TCreateVideoFpsUseCase";

export class CreateVideoFpsUseCase implements ICreateVideoFpsUseCase {
    constructor(
        private readonly videoManager: IVideoManager = new VideoManager(),
        private readonly s3Handler: IS3Handler = new S3Handler(),
        private readonly zipper: IZipper = new Zipper()
    ) {}

    async execute(input: TCreateVideoFpsUseCaseInput): Promise<TCreateVideoFpsUseCaseOutput> {
        const { bucket, key, eventIndex, startTime } = input;
        Logger.info(`CreateVideoFpsUseCase IDX: ${eventIndex}`, "Executing create video FPS", { input });

        const videoUrl = await this.s3Handler.generatePresignedURL({ bucket, key });
        const dirWithImages = await this.generateFPS(input, videoUrl);
        Logger.info(`CreateVideoFpsUseCase IDX: ${eventIndex}`, "FPS images generated", { dirWithImages });
        
        const systemFile = await this.zipper.zipFolder(dirWithImages, `idx-${eventIndex}-start-${startTime}-now-${Date.now()}`);

        await this.uploadZippedFileToS3(systemFile, input);
        await this.updateEventTracker(input)
    }

    private async generateFPS(input: TCreateVideoFpsUseCaseInput, s3VideoURL: string): Promise<string> {
        const { startTime, duration, eventIndex } = input;
        const fileName = `user-info-test-${Date.now()}`;

        Logger.info(`CreateVideoFpsUseCase IDX: ${eventIndex}`, "Generating FPS from S3 video URL", {
            s3VideoURL,
            startTime,
            duration,
            fileName,
        });

        Logger.info(`CreateVideoFpsUseCase IDX: ${eventIndex}`, "Generating FPS with specific duration");
        const result = await this.videoManager.generateFPSFromS3VideoURLAndSpecificDuration({
            s3VideoURL,
            duration,
            startTime,
            fileName,
        });

        Logger.info(`CreateVideoFpsUseCase IDX: ${eventIndex}`, "FPS generated successfully", { imagesDir: result.imagesDir });
        return result.imagesDir;
    }

    private async uploadZippedFileToS3(zipFilePath: string, input: TCreateVideoFpsUseCaseInput): Promise<void> {
        const { eventIndex, startTime, clientId, videoId } = input;
        const outputKey = `${clientId}/${videoId}`;
        Logger.info(`CreateVideoFpsUseCase IDX: ${eventIndex}`, "Uploading zipped file to S3", { zipFilePath, outputKey });

        await this.s3Handler.uploadZip({
            bucket: envS3.fpsBucketName,
            outputKey,
            fileType: EFileType.ZIP,
            zipFilePath,
            fileName: `idx-${eventIndex}-start-${startTime}-now-${Date.now()}.zip`,
        });

        Logger.info(`CreateVideoFpsUseCase IDX: ${eventIndex}`, "Zipped file uploaded successfully", { outputKey });
    }

    private async updateEventTracker(input: TCreateVideoFpsUseCaseInput): Promise<void> {
        const { clientId, videoId } = input;
        try {
            const eventTrackerRepository = new EventTrackerRepository();
            await eventTrackerRepository.plusEventCount(clientId, videoId);
            Logger.info("CreateVideoFpsUseCase", "Event tracker count updated", input);
        } catch (error) {
            Logger.error("CreateVideoFpsUseCase", "Error update tracker count", {
                error: (error as Error).message,
                stack: (error as Error).stack
            });
        }
    }
}