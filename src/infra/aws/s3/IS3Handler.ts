import { TGetPresignedUrlParams, TGetPresignedUrlResponse, TUploadImageParams, TUploadImageResponse, TUploadImageSParams, TUploadZipParams } from "./TS3Handler";

export interface IS3Handler {
    generatePresignedURL(params: TGetPresignedUrlParams): Promise<TGetPresignedUrlResponse>;
    uploadImage(params: TUploadImageParams): Promise<TUploadImageResponse>;
    uploadImages(params: TUploadImageSParams): Promise<TUploadImageResponse>;
    uploadZip(params: TUploadZipParams): Promise<TUploadImageResponse>;
}