import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { TGetPresignedUrlParams, TGetPresignedUrlResponse } from "./TS3Handler";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { IS3Handler } from "./IS3Handler";
import { envAWS } from "../../../config/aws";
import { Logger } from "../../utils/logger";

const s3Client = new S3Client({
    region: envAWS.region,
});

export class S3Handler implements IS3Handler {
    async generatePresignedURL(params: TGetPresignedUrlParams): Promise<TGetPresignedUrlResponse> {
        const { bucket, key } = params;
        const command = new GetObjectCommand({ Bucket: bucket, Key: key });
        Logger.info("S3Handler", "Generating presigned URL", { bucket, key });
        return getSignedUrl(s3Client, command, { expiresIn: 500 });
    }
}