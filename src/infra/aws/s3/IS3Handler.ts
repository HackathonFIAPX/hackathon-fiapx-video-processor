import { TGetPresignedUrlParams, TGetPresignedUrlResponse } from "./TS3Handler";

export interface IS3Handler {
    generatePresignedURL(params: TGetPresignedUrlParams): Promise<TGetPresignedUrlResponse>
}