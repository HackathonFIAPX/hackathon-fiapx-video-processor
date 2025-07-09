import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { readFileSync } from 'fs';
import { S3Handler } from './S3Handler';
import { EFileType, EImageType } from './TS3Handler';
import { Logger } from '../../utils/logger';

let mockS3Send: jest.Mock;

jest.mock('@aws-sdk/client-s3', () => ({
    ...jest.requireActual('@aws-sdk/client-s3'),
    S3Client: jest.fn().mockImplementation(() => ({
        send: (...args: any[]) => mockS3Send(...args),
    })),
}));

jest.mock('../../utils/logger');
jest.mock('@aws-sdk/s3-request-presigner');
jest.mock('fs', () => ({
    ...jest.requireActual('fs'),
    readFileSync: jest.fn(),
}));

mockS3Send = jest.fn();

describe('S3Handler', () => {
    let s3Handler: S3Handler;
    const mockedGetSignedUrl = getSignedUrl as jest.Mock;
    const mockedReadFileSync = readFileSync as jest.Mock;
    const mockedLoggerInfo = jest.spyOn(Logger, 'info');

    beforeEach(() => {
        jest.clearAllMocks();
        mockS3Send.mockClear();
        s3Handler = new S3Handler();
    });

    describe('generatePresignedURL', () => {
        it('should generate a presigned URL and log the action', async () => {
            const params = { bucket: 'test-bucket', key: 'test-key' };
            const expectedUrl = 'https://s3.amazonaws.com/test-bucket/test-key?presigned-url';
            mockedGetSignedUrl.mockResolvedValue(expectedUrl);

            const result = await s3Handler.generatePresignedURL(params);

            expect(result).toBe(expectedUrl);
            expect(mockedGetSignedUrl).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), { expiresIn: 900 });
            expect(mockedLoggerInfo).toHaveBeenCalledWith("S3Handler", "Generating presigned URL", { bucket: params.bucket, key: params.key });
        });
    });

    describe('uploadImage', () => {
        it('should upload an image to S3 and log the actions', async () => {
            const params = {
                bucket: 'test-bucket',
                outputKey: 'image.jpg',
                filePath: '/tmp/image.jpg',
                imageType: EImageType.JPEG,
            };
            const fileContent = Buffer.from('image data');
            mockedReadFileSync.mockReturnValue(fileContent);
            mockS3Send.mockResolvedValue({});

            await s3Handler.uploadImage(params);

            expect(mockedReadFileSync).toHaveBeenCalledWith(params.filePath);
            expect(mockS3Send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
            expect(mockedLoggerInfo).toHaveBeenCalledTimes(2);
        });
    });

    describe('uploadImages', () => {
        it('should upload multiple images by calling uploadImage for each file', async () => {
            const params = {
                bucket: 'test-bucket',
                outputKey: 'gallery',
                filesPath: ['/tmp/img1.jpg', '/tmp/img2.png'],
                imageType: EImageType.JPEG,
            };

            const uploadImageSpy = jest.spyOn(s3Handler, 'uploadImage').mockResolvedValue(undefined);

            await s3Handler.uploadImages(params);

            expect(uploadImageSpy).toHaveBeenCalledTimes(2);
            expect(uploadImageSpy).toHaveBeenCalledWith({
                bucket: params.bucket,
                outputKey: 'gallery/img1.jpg',
                filePath: '/tmp/img1.jpg',
                imageType: params.imageType,
            });
            expect(uploadImageSpy).toHaveBeenCalledWith({
                bucket: params.bucket,
                outputKey: 'gallery/img2.png',
                filePath: '/tmp/img2.png',
                imageType: params.imageType,
            });
            expect(mockedLoggerInfo).toHaveBeenCalledWith("S3Handler", "All images uploaded successfully", expect.any(Object));
            uploadImageSpy.mockRestore();
        });
    });

    describe('getFileName', () => {
        it('should extract filename from a given path', () => {
            const path = '/directory/subdirectory/file.txt';
            const fileName = (s3Handler as any).getFileName(path);
            expect(fileName).toBe('file.txt');
        });

        it('should return the string itself if it has no slashes', () => {
            const path = 'file.txt';
            const fileName = (s3Handler as any).getFileName(path);
            expect(fileName).toBe('file.txt');
        });
    });

    describe('uploadZip', () => {
        it('should upload a zip file to S3 and log the actions', async () => {
            const params = {
                bucket: 'test-bucket',
                outputKey: 'archives',
                zipFilePath: '/tmp/archive.zip',
                fileType: EFileType.ZIP,
                fileName: 'archive.zip',
            };
            const fileContent = Buffer.from('zip data');
            mockedReadFileSync.mockReturnValue(fileContent);
            mockS3Send.mockResolvedValue({});

            await s3Handler.uploadZip(params);

            expect(mockedReadFileSync).toHaveBeenCalledWith(params.zipFilePath);
            expect(mockS3Send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
            expect(mockedLoggerInfo).toHaveBeenCalledTimes(2);
        });
    });
});