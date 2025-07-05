import { TGetDurationFromS3VideoURLParams, TGetDurationFromS3VideoURLResponse, TGenerateFPSFromS3VideoURLAndSpecificDurationParams, TGenerateFPSFromS3VideoURLAndSpecificDurationResponse, TGenerateFPSFromS3VideoURLAndStartTimeParams, TGenerateFPSFromS3VideoURLAndStartTimeResponse } from "./TVideoManager";

export interface IVideoManager {
    getDurationFromS3VideoURL(
        params: TGetDurationFromS3VideoURLParams
    ): Promise<TGetDurationFromS3VideoURLResponse>;
    generateFPSFromS3VideoURLAndSpecificDuration(
        params: TGenerateFPSFromS3VideoURLAndSpecificDurationParams
    ): Promise<TGenerateFPSFromS3VideoURLAndSpecificDurationResponse>;
    generateFPSFromS3VideoURLAndStartTime(
        params: TGenerateFPSFromS3VideoURLAndStartTimeParams
    ): Promise<TGenerateFPSFromS3VideoURLAndStartTimeResponse>;
}