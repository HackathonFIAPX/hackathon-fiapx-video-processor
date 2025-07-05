import { promisify } from "util";
import { IVideoManager } from "./IVideoManager";
import { TGetDurationFromS3VideoURLParams, TGetDurationFromS3VideoURLResponse } from "./TVideoManager";
import { exec } from "child_process";
import { Logger } from "../utils/logger";

const execPromise = promisify(exec);

export class VideoManager implements IVideoManager {
    async getDurationFromS3VideoURL(params: TGetDurationFromS3VideoURLParams): Promise<TGetDurationFromS3VideoURLResponse> {
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
}