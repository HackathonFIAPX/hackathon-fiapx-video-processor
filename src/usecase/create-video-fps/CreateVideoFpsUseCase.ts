import { envS3 } from "../../config/s3";
import { IS3Handler } from "../../infra/aws/s3/IS3Handler";
import { S3Handler } from "../../infra/aws/s3/S3Handler";
import { EFileType, EImageType } from "../../infra/aws/s3/TS3Handler";
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
        const { bucket, key, eventIndex } = input;
        if(eventIndex == 3) {
            Logger.info("CreateVideoFpsUseCase", "Executing create video FPS", { input });

            const videoUrl = await this.s3Handler.generatePresignedURL({ bucket, key });
            const dirWithImages = await this.generateFPS(input, videoUrl);
            Logger.info("CreateVideoFpsUseCase", "FPS images generated", { dirWithImages });
            const systemFile = await this.zipper.zipFolder(dirWithImages, `user-info-test-${Date.now()}`);

            await this.uploadZippedFileToS3(systemFile);
        }
    }

    private async generateFPS(input: TCreateVideoFpsUseCaseInput, s3VideoURL: string): Promise<string> {
        const { startTime, duration } = input;
        const fileName = `user-info-test-${Date.now()}`;

        Logger.info("CreateVideoFpsUseCase", "Generating FPS from S3 video URL", {
            s3VideoURL,
            startTime,
            duration,
            fileName,
        });
        if (input.eventIndex === input.totalEvents) {
            Logger.info("CreateVideoFpsUseCase", "Generating FPS with start time")
            const result = await this.videoManager.generateFPSFromS3VideoURLAndStartTime({
                s3VideoURL,
                startTime,
                fileName,
            });
            
            Logger.info("CreateVideoFpsUseCase", "FPS generated successfully", { imagesDir: result.imagesDir });
            return result.imagesDir;
        }

        Logger.info("CreateVideoFpsUseCase", "Generating FPS with specific duration");
        const result = await this.videoManager.generateFPSFromS3VideoURLAndSpecificDuration({
            s3VideoURL,
            duration,
            startTime,
            fileName,
        });

        Logger.info("CreateVideoFpsUseCase", "FPS generated successfully", { imagesDir: result.imagesDir });
        return result.imagesDir;
    }

    private async uploadZippedFileToS3(zipFilePath: string): Promise<void> {
        const outputKey = `user_info/test`;
        Logger.info("CreateVideoFpsUseCase", "Uploading zipped file to S3", { zipFilePath, outputKey });

        await this.s3Handler.uploadZip({
            bucket: envS3.fpsBucketName,
            outputKey,
            fileType: EFileType.ZIP,
            zipFilePath,
            fileName: `user-info-test-${Date.now()}.zip`,
        });

        Logger.info("CreateVideoFpsUseCase", "Zipped file uploaded successfully", { outputKey });
    }
}