import { IS3Handler } from "../../infra/aws/s3/IS3Handler";
import { S3Handler } from "../../infra/aws/s3/S3Handler";
import { ESQSMessageType, SQSHandler } from "../../infra/aws/sqs/SQSHandler";
import { Logger } from "../../infra/utils/logger";
import { IVideoManager } from "../../infra/video-manager/IVideoManager";
import { VideoManager } from "../../infra/video-manager/VideoManager";
import { ICreateVideoEventsUseCase } from "./ICreateVideoEventsUseCase";
import { TCreateVideoEventsUseCaseInput, TCreateVideoEventsUseCaseOutput } from "./TCreateVideoEventsUseCase";

export class CreateVideoEventsUseCase implements ICreateVideoEventsUseCase {
    constructor(
        private readonly videoManager: IVideoManager = new VideoManager(),
        private readonly s3Handler: IS3Handler = new S3Handler()
    ) {}

    async execute({
        bucket,
        key
    }: TCreateVideoEventsUseCaseInput): Promise<TCreateVideoEventsUseCaseOutput> {
        Logger.info("CreateVideoEvents", "Processing video events", { bucket, key });
        
        const decodedKey = decodeURIComponent(key.replace(/\+/g, " "));
        Logger.info("CreateVideoEvents", "Decoded S3 key", { decodedKey });

        const videoUrl = await this.s3Handler.generatePresignedURL({ bucket, key: decodedKey});
        Logger.info("CreateVideoEvents", "Generated presigned URL for video", { videoUrl });

        const videoDuration = await this.videoManager.getDurationFromS3VideoURL({ s3VideoURL: videoUrl});
        Logger.info("CreateVideoEvents", "Video duration retrieved", { videoDuration });

        const oneSecoundQtt = 60
        const qttOfEventsToSend = Math.ceil(videoDuration / oneSecoundQtt);
        const [_, clientId, videoId] = decodedKey.split("/");

        for (let i = 0; i < qttOfEventsToSend; i++) {
          const eventIndex = i + 1; // Começa do 1 para facilitar a leitura
          const lastEvent = qttOfEventsToSend - 1;
          const duration = i != lastEvent ?
            oneSecoundQtt :
            videoDuration - (lastEvent * oneSecoundQtt);

          const eventData = {
            bucket,
            key,
            startTime: i * oneSecoundQtt,
            duration: Math.trunc(duration),
            eventIndex: eventIndex,
            totalEvents: qttOfEventsToSend,
            clientId,
            videoId: videoId.replace('.mp4', '')
          };

          Logger.info("CreateVideoEvents", "Creating video event", eventData);
          await SQSHandler.sendMessage({
            data: eventData,
            type: ESQSMessageType.GENERATE_FPS 
          })
          Logger.info("CreateVideoEvents", "Sending video event", eventData);
        }
        
    }
}