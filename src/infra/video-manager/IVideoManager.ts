import { TGetDurationFromS3VideoURLParams, TGetDurationFromS3VideoURLResponse } from "./TVideoManager";

export interface IVideoManager {
    getDurationFromS3VideoURL(params: TGetDurationFromS3VideoURLParams): Promise<TGetDurationFromS3VideoURLResponse>;
}