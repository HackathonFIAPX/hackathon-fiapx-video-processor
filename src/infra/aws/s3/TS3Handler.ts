export type TGetPresignedUrlParams = {
    bucket: string;
    key: string;
};

export type TGetPresignedUrlResponse = string;

export enum EImageType {
    JPEG    = "image/jpeg",
}

export enum EFileType {
    ZIP     = "application/zip",
}

export type TUploadImageParams = {
    bucket: string;
    outputKey: string;
    filePath: string;
    imageType: EImageType;
};

export type TUploadImageResponse = void;

export type TUploadImageSParams = {
    bucket: string;
    outputKey: string;
    filesPath: string[];
    imageType: EImageType;
};

export type TUploadImagesResponse = void;

export type TUploadZipParams = {
    bucket: string;
    outputKey: string;
    zipFilePath: string;
    fileType: EFileType;
    fileName: string;
}

export type TUploadZipResponse = void;