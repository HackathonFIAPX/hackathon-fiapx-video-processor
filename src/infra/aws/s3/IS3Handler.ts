import { TGetPresignedUrlParams, TGetPresignedUrlResponse, TUploadImageParams, TUploadImageResponse, TUploadImageSParams } from "./TS3Handler";

export interface IS3Handler {
    generatePresignedURL(params: TGetPresignedUrlParams): Promise<TGetPresignedUrlResponse>;
    uploadImage(params: TUploadImageParams): Promise<TUploadImageResponse>;
    uploadImages(params: TUploadImageSParams): Promise<TUploadImageResponse>;
}