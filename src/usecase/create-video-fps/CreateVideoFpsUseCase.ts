import { envS3 } from "../../config/s3";
import { IS3Handler } from "../../infra/aws/s3/IS3Handler";
import { S3Handler } from "../../infra/aws/s3/S3Handler";
import { EImageType } from "../../infra/aws/s3/TS3Handler";
import { Logger } from "../../infra/utils/logger";
import { IVideoManager } from "../../infra/video-manager/IVideoManager";
import { VideoManager } from "../../infra/video-manager/VideoManager";
import { ICreateVideoFpsUseCase } from "./ICreateVideoFpsUseCase";
import { TCreateVideoFpsUseCaseInput, TCreateVideoFpsUseCaseOutput } from "./TCreateVideoFpsUseCase";
import * as fs from "fs/promises";

export class CreateVideoFpsUseCase implements ICreateVideoFpsUseCase {
    constructor(
        private readonly videoManager: IVideoManager = new VideoManager(),
        private readonly s3Handler: IS3Handler = new S3Handler()
    ) {}

    async execute(input: TCreateVideoFpsUseCaseInput): Promise<TCreateVideoFpsUseCaseOutput> {
        const { bucket, key } = input;
        Logger.info("CreateVideoFpsUseCase", "Executing create video FPS", { input });

        const videoUrl = await this.s3Handler.generatePresignedURL({ bucket, key });
        const dirWithImages = await this.generateFPS(input, videoUrl);

        await this.uploadImagesToS3(dirWithImages);
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

    private async uploadImagesToS3(imagesDir: string): Promise<void> {
        const generatedFiles = await fs.readdir(imagesDir);
        const imageFiles = generatedFiles.filter(file => file.endsWith('.jpg') || file.endsWith('.png'));

        const filesPath = imageFiles.map(file => `${imagesDir}/${file}`)

        await this.s3Handler.uploadImages({
            bucket: envS3.fpsBucketName,
            outputKey: `user_info/test`,
            filesPath,
            imageType: EImageType.JPEG,
        })
    }
}