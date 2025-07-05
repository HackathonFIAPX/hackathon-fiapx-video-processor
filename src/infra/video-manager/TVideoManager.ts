export type TGetDurationFromS3VideoURLParams = {
    s3VideoURL: string;
};

export type TGetDurationFromS3VideoURLResponse = number;

export type TGenerateFPSFromS3VideoURLAndSpecificDurationParams = {
    s3VideoURL: string;
    startTime: number;  // seconds
    duration: number;   // seconds
    fileName: string;
};

export type TGenerateFPSFromS3VideoURLAndSpecificDurationResponse = {
    imagesDir: string;
};

export type TGenerateFPSFromS3VideoURLAndStartTimeParams = {
    s3VideoURL: string;
    startTime: number;  // seconds
    fileName: string;
};

export type TGenerateFPSFromS3VideoURLAndStartTimeResponse = {
    imagesDir: string;
};