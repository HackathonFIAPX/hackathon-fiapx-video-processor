export const envS3 = Object.freeze({
    fpsBucketName: process.env.S3_FPS_BUCKET_NAME as string,
    region: process.env.AWS_REGION as string,
});