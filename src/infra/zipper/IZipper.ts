export interface IZipper {
    zipFolder(folderName: string, expectedFileName: string): Promise<string>;
}