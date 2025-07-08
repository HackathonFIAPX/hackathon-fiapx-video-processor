import { promisify } from "util";
import { IVideoManager } from "./IVideoManager";
import { TGetDurationFromS3VideoURLParams, TGetDurationFromS3VideoURLResponse, TGenerateFPSFromS3VideoURLAndSpecificDurationParams, TGenerateFPSFromS3VideoURLAndSpecificDurationResponse, TGenerateFPSFromS3VideoURLAndStartTimeParams, TGenerateFPSFromS3VideoURLAndStartTimeResponse } from "./TVideoManager";
import { exec } from "child_process";
import { Logger } from "../utils/logger";
import * as fs from "fs/promises";
import path from "path";

const execPromise = promisify(exec);

export class VideoManager implements IVideoManager {
    private TMP_DIR = "/tmp/video";

    async getDurationFromS3VideoURL(
        params: TGetDurationFromS3VideoURLParams
    ): Promise<TGetDurationFromS3VideoURLResponse> {
        const { s3VideoURL } = params;

        const cmd = `ffprobe -v error -show_entries format=duration -of json "${s3VideoURL}"`;
        Logger.info("VideoManager", "Executing ffprobe command", { cmd, s3VideoURL });
        const { stdout, stderr } = await execPromise(cmd);

        if (stderr) {
            Logger.error("VideoManager", "Error executing ffprobe command", { s3VideoURL, error: stderr });
            throw new Error(`Error to execute fprobe command: ${stderr}`);
        }
        const info = JSON.parse(stdout);
        if (!info.format || !info.format.duration) {
            Logger.error("VideoManager", "Duration not found in the ffprobe output", { s3VideoURL });
            throw new Error("Duração não encontrada no ffprobe output");
        }
        return parseFloat(info.format.duration);
    }

    async generateFPSFromS3VideoURLAndSpecificDuration(
        params: TGenerateFPSFromS3VideoURLAndSpecificDurationParams
    ): Promise<TGenerateFPSFromS3VideoURLAndSpecificDurationResponse> {
        const { s3VideoURL, startTime, duration, fileName } = params;

        await fs.mkdir(this.TMP_DIR, { recursive: true });
        const outputPath = path.join(this.TMP_DIR, `${fileName}-frame-%05d.jpg`);
        Logger.info("VideoManager", "Vars", { s3VideoURL, startTime, duration, fileName, outputPath });

        // FFmpeg command to extract frames:
        // -ss: Start time in seconds
        // -i: Input file (the presigned S3 URL)
        // -t: Duration of the segment to process
        // -r: Output frame rate (5 fps)
        // -q:v: Quality of the output video (2 is good for JPG, // 1-31, lower is better)
        // The output will be a series of JPG images named like `fileName-%03d.jpg` in the `/tmp` directory.
        const cmd = `ffmpeg -y -i "${s3VideoURL}" -ss ${startTime} -t ${duration} -r 2 -q:v 2 ${outputPath} </dev/null`;
        Logger.info("VideoManager", "Executing ffmpeg command", { cmd });

        return execPromise(cmd)
            .then(() => {
                Logger.info("VideoManager", "ffmpeg command executed successfully", { fileName });
                return { imagesDir: this.TMP_DIR };
            })
            .catch((error) => {
                Logger.error("VideoManager", "Error executing ffmpeg command", { error });
                throw new Error(`Error to execute ffmpeg command: ${error.message}`);
            });
    }

    async generateFPSFromS3VideoURLAndStartTime(
        params: TGenerateFPSFromS3VideoURLAndStartTimeParams
    ): Promise<TGenerateFPSFromS3VideoURLAndStartTimeResponse> {
        const { s3VideoURL, startTime, fileName } = params;

        await fs.mkdir(this.TMP_DIR, { recursive: true });
        const outputPath = path.join(this.TMP_DIR, `${fileName}-frame-%05d.jpg`);
        Logger.info("VideoManager", "Vars", { s3VideoURL, startTime, fileName, outputPath });

        // FFmpeg command to extract frames:
        // -ss: Start time in seconds
        // -i: Input file (the presigned S3 URL)
        // -t: Duration of the segment to process
        // -r: Output frame rate (5 fps)
        // -q:v: Quality of the output video (2 is good for JPG, // 1-31, lower is better)
        // The output will be a series of JPG images named like `fileName-%03d.jpg` in the `/tmp` directory.
        const cmd = `ffmpeg -y -i "${s3VideoURL}" -ss ${startTime} -r 5 -q:v 2 ${outputPath} </dev/null`;
        Logger.info("VideoManager", "Executing ffmpeg command", { cmd });

        return execPromise(cmd)
            .then(() => {
                Logger.info("VideoManager", "ffmpeg command executed successfully", { fileName });
                return { imagesDir: this.TMP_DIR };
            })
            .catch((error) => {
                Logger.error("VideoManager", "Error executing ffmpeg command", { error });
                throw new Error(`Error to execute ffmpeg command: ${error.message}`);
            });
    }
}