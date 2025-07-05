import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { TGetPresignedUrlParams, TGetPresignedUrlResponse, TUploadImageParams, TUploadImageResponse, TUploadImageSParams, TUploadImagesResponse } from "./TS3Handler";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { IS3Handler } from "./IS3Handler";
import { envAWS } from "../../../config/aws";
import { Logger } from "../../utils/logger";
import { readFileSync } from "fs";

const s3Client = new S3Client({
    region: envAWS.region,
});

export class S3Handler implements IS3Handler {
    async generatePresignedURL(params: TGetPresignedUrlParams): Promise<TGetPresignedUrlResponse> {
        const { bucket, key } = params;
        const command = new GetObjectCommand({ Bucket: bucket, Key: key });
        Logger.info("S3Handler", "Generating presigned URL", { bucket, key });
        return getSignedUrl(s3Client, command, { expiresIn: 300 });
    }

    async uploadImage(params: TUploadImageParams): Promise<TUploadImageResponse> {
        const { bucket, outputKey, filePath, imageType } = params;
        
        const key = `temp_fps/${outputKey}`
        Logger.info("S3Handler", "Uploading image to S3", {
            bucket,
            outputKey,
            key,
            filePath,
            imageType,
        });

        const fileContent = readFileSync(filePath);
        const command = new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: fileContent,
            ContentType: imageType,
        });

        await s3Client.send(command)
        Logger.info("S3Handler", "Uploading image to S3", {
            bucket,
            key,
            filePath,
            imageType,
        });
    }

    async uploadImages(params: TUploadImageSParams): Promise<TUploadImagesResponse> {
        const { bucket, outputKey, filesPath, imageType } = params;
        const uploadPromises = filesPath.map(filePath => this.uploadImage({
            bucket,
            outputKey,
            filePath,
            imageType,
        }));
        await Promise.all(uploadPromises);
        Logger.info("S3Handler", "All images uploaded successfully", {
            count: filesPath.length,
            images: filesPath.map(p => p).join(", "),
            bucket,
            outputKey,
            imageType,
        });
    }
}