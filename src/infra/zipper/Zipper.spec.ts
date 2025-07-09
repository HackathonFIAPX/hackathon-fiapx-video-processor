import { Zipper } from "./Zipper";
import * as fs from "fs";
import * as path from "path";
import archiver from "archiver";
import { Logger } from "../utils/logger";

jest.mock("fs", () => ({
    existsSync: jest.fn(),
    mkdirSync: jest.fn(),
    statSync: jest.fn(),
    createWriteStream: jest.fn(() => ({
        on: jest.fn(),
    })),
}));

jest.mock("path", () => ({
    resolve: jest.fn((...args) => args.join('/')),
}));

const mockArchiverInstance = {
    directory: jest.fn().mockReturnThis(),
    finalize: jest.fn().mockReturnThis(),
    pipe: jest.fn().mockReturnThis(),
    on: jest.fn(),
    pointer: 0,
};

jest.mock("archiver", () => {
    return jest.fn(() => mockArchiverInstance);
});

jest.mock("../utils/logger", () => ({
    Logger: {
        info: jest.fn(),
        error: jest.fn(),
    },
}));

describe("Zipper", () => {
    let zipper: Zipper;
    const mockFsExistsSync = fs.existsSync as jest.Mock;
    const mockFsMkdirSync = fs.mkdirSync as jest.Mock;
    const mockFsStatSync = fs.statSync as jest.Mock;
    const mockFsCreateWriteStream = fs.createWriteStream as jest.Mock;
    const mockPathResolve = path.resolve as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        mockPathResolve.mockImplementation((...args) => args.join('/'));
    });

    describe("constructor", () => {
        it("should create TMP_DIR if it does not exist", () => {
            mockFsExistsSync.mockReturnValue(false);
            zipper = new Zipper();
            expect(mockFsMkdirSync).toHaveBeenCalledWith("/tmp/zipper", { recursive: true });
        });

        it("should not create TMP_DIR if it already exists", () => {
            mockFsExistsSync.mockReturnValue(true);
            zipper = new Zipper();
            expect(mockFsMkdirSync).not.toHaveBeenCalled();
        });
    });

    describe("zipFolder", () => {
        beforeEach(() => {
            mockFsExistsSync.mockReturnValue(true);
            mockFsStatSync.mockReturnValue({ isDirectory: () => true });
            zipper = new Zipper();
        });

        it("should throw an error if the folder does not exist", async () => {
            mockFsExistsSync.mockReturnValue(false);
            await expect(zipper.zipFolder("non-existent-folder", "output")).rejects.toThrow(
                `The specified file "non-existent-folder" dont exists.`
            );
        });

        it("should throw an error if the path is not a directory", async () => {
            mockFsExistsSync.mockReturnValue(true);
            mockFsStatSync.mockReturnValue({ isDirectory: () => false });
            await expect(zipper.zipFolder("not-a-directory", "output")).rejects.toThrow(
                `"not-a-directory" isnt a valid directory.`
            );
        });

        it("should reject on archiver warning with non-ENOENT code", async () => {
            const folderName = "test-folder";
            const expectedFileName = "output-zip";

            const mockOutput = { on: jest.fn() };
            mockFsCreateWriteStream.mockReturnValue(mockOutput);

            const promise = zipper.zipFolder(folderName, expectedFileName);

            const error = new Error("Non-ENOENT warning");
            // Manually trigger the warning event with a non-ENOENT error
            mockArchiverInstance.on.mock.calls.find(call => call[0] === 'warning')[1](error);

            await expect(promise).rejects.toThrow(error);
        });

        it("should reject on archiver error", async () => {
            const folderName = "test-folder";
            const expectedFileName = "output-zip";

            const mockOutput = { on: jest.fn() };
            mockFsCreateWriteStream.mockReturnValue(mockOutput);

            const promise = zipper.zipFolder(folderName, expectedFileName);

            const error = new Error("Archiver error");
            // Manually trigger the error event
            mockArchiverInstance.on.mock.calls.find(call => call[0] === 'error')[1](error);

            await expect(promise).rejects.toThrow(error);
        });
    });
});