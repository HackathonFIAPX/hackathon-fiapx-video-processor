import archiver from 'archiver';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../utils/logger';

export class Zipper {
    private TMP_DIR = "/tmp/zipper";

    constructor() {
        if (!fs.existsSync(this.TMP_DIR)) {
            fs.mkdirSync(this.TMP_DIR, { recursive: true });
        }
    }

    public async zipFolder(folderName: string, expectedFileName: string): Promise<string> {
        const inputFolderPath = path.resolve(folderName);

        if (!fs.existsSync(inputFolderPath)) {
            throw new Error(`The specified file "${folderName}" dont exists.`);
        }
        if (!fs.statSync(inputFolderPath).isDirectory()) {
            throw new Error(`"${folderName}" isnt a valid directory.`);
        }

        const outputZipName = `${expectedFileName}.zip`;
        const outputZipPath = path.resolve(this.TMP_DIR,outputZipName);

        const output = fs.createWriteStream(outputZipPath);

        const archive = archiver('zip', {
            zlib: { level: 9 }
        });

        return new Promise<string>((resolve, reject) => {
            output.on('close', () => {
                Logger.info(`ZIP file created: ${archive.pointer()} bytes. Name: ${outputZipPath}`);
                resolve(outputZipPath);
            });

            archive.on('warning', (err) => {
                if (err.code === 'ENOENT') {
                    Logger.error(`Warning to ZIP: ${err.message}`);
                } else {
                    reject(err);
                }
            });

            archive.on('error', (err) => {
                reject(err);
            });

            archive.pipe(output);
            archive.directory(inputFolderPath, false);
            archive.finalize();
        });
    }
}