jest.mock("util", () => {
    const original = jest.requireActual("util");
    return {
      ...original,
      promisify: (fn: any) => fn, // aqui a função real será retornada, a gente controla ela no teste
    };
  });
  
  jest.mock("child_process", () => ({
    exec: jest.fn(), // mockamos exec aqui
  }));
  
  jest.mock("fs/promises", () => ({
    mkdir: jest.fn(),
  }));
  
  import { VideoManager } from "./VideoManager";
  import { exec } from "child_process";
  import * as fs from "fs/promises";
  
  describe("VideoManager", () => {
    let videoManager: VideoManager;
    let execMock: jest.Mock;
    let mkdirMock: jest.Mock;
  
    beforeEach(() => {
      execMock = jest.mocked(exec) as jest.Mock;
      mkdirMock = fs.mkdir as jest.Mock;
      videoManager = new VideoManager();
      jest.clearAllMocks();
    });
  
    describe("getDurationFromS3VideoURL", () => {
      it("should return the duration of the video", async () => {
        const s3VideoURL = "http://example.com/video.mp4";
        const duration = 120.5;
        const stdout = JSON.stringify({ format: { duration: duration.toString() } });
  
        execMock.mockResolvedValue({ stdout, stderr: "" });
  
        const result = await videoManager.getDurationFromS3VideoURL({ s3VideoURL });
  
        expect(result).toBe(duration);
        expect(execMock).toHaveBeenCalledWith(
          `ffprobe -v error -show_entries format=duration -of json "${s3VideoURL}"`
        );
      });
  
      it("should throw an error if ffprobe returns stderr", async () => {
        const s3VideoURL = "http://example.com/video.mp4";
        execMock.mockResolvedValue({ stdout: "", stderr: "some error" });
  
        await expect(videoManager.getDurationFromS3VideoURL({ s3VideoURL })).rejects.toThrow(
          "Error to execute fprobe command: some error"
        );
      });
  
      it("should throw an error if duration is not found", async () => {
        const s3VideoURL = "http://example.com/video.mp4";
        execMock.mockResolvedValue({ stdout: JSON.stringify({ format: {} }), stderr: "" });
  
        await expect(videoManager.getDurationFromS3VideoURL({ s3VideoURL })).rejects.toThrow(
          "Duração não encontrada no ffprobe output"
        );
      });
    });
  
    describe("generateFPSFromS3VideoURLAndSpecificDuration", () => {
      it("should generate FPS successfully", async () => {
        const params = {
          s3VideoURL: "http://example.com/video.mp4",
          startTime: 10,
          duration: 5,
          fileName: "test-video",
        };
        const expectedDir = "/tmp/video";
  
        execMock.mockResolvedValue({ stdout: "", stderr: "" });
        mkdirMock.mockResolvedValue(undefined);
  
        const result = await videoManager.generateFPSFromS3VideoURLAndSpecificDuration(params);
  
        expect(mkdirMock).toHaveBeenCalledWith(expectedDir, { recursive: true });
        expect(execMock).toHaveBeenCalledWith(expect.stringContaining("ffmpeg"));
        expect(result).toEqual({ imagesDir: expectedDir });
      });
    });
  
    describe("generateFPSFromS3VideoURLAndStartTime", () => {
      it("should generate FPS successfully", async () => {
        const params = {
          s3VideoURL: "http://example.com/video.mp4",
          startTime: 10,
          fileName: "test-video",
        };
        const expectedDir = "/tmp/video";
  
        execMock.mockResolvedValue({ stdout: "", stderr: "" });
        mkdirMock.mockResolvedValue(undefined);
  
        const result = await videoManager.generateFPSFromS3VideoURLAndStartTime(params);
  
        expect(mkdirMock).toHaveBeenCalledWith(expectedDir, { recursive: true });
        expect(execMock).toHaveBeenCalledWith(expect.stringContaining("ffmpeg"));
        expect(result).toEqual({ imagesDir: expectedDir });
      });
    });
  });
  