import { CreateVideoFpsController, TCreateVideoFpsController } from "./CreateVideoFPS.controller";
import { CreateVideoFpsUseCase } from "../usecase/create-video-fps/CreateVideoFpsUseCase";
import { Logger } from "../infra/utils/logger";

jest.mock("../usecase/create-video-fps/CreateVideoFpsUseCase");
jest.mock("../infra/utils/logger");

describe("CreateVideoFpsController", () => {
    let controller: CreateVideoFpsController;
    let mockCreateVideoFpsUseCase: jest.Mocked<CreateVideoFpsUseCase>;

    beforeEach(() => {
        mockCreateVideoFpsUseCase = new CreateVideoFpsUseCase() as jest.Mocked<CreateVideoFpsUseCase>;
        controller = new CreateVideoFpsController(mockCreateVideoFpsUseCase);
        jest.clearAllMocks();
    });

    it("should be defined", () => {
        expect(controller).toBeDefined();
    });

    it("should execute the use case and return a 200 response", async () => {
        const input: TCreateVideoFpsController = {
            bucket: "test-bucket",
            key: "test-key",
            startTime: 0,
            duration: 10,
            eventIndex: 0,
            totalEvents: 1,
        };
        mockCreateVideoFpsUseCase.execute.mockResolvedValue(undefined);

        const response = await controller.execute(input);

        expect(mockCreateVideoFpsUseCase.execute).toHaveBeenCalledWith(input);
        expect(Logger.info).toHaveBeenCalledWith("CreateVideoFpsController", "Executing create video FPS", { input });
        expect(Logger.info).toHaveBeenCalledWith("CreateVideoFpsController", "Video FPS created successfully", { result: undefined });
        expect(response).toEqual({
            statusCode: 200,
            body: undefined,
        });
    });

    it("should handle errors from the use case", async () => {
        const input: TCreateVideoFpsController = {
            bucket: "test-bucket",
            key: "test-key",
            startTime: 0,
            duration: 10,
            eventIndex: 0,
            totalEvents: 1,
        };
        const error = new Error("Use case error");

        mockCreateVideoFpsUseCase.execute.mockRejectedValue(error);

        await expect(controller.execute(input)).rejects.toThrow(error);
        expect(Logger.info).toHaveBeenCalledWith("CreateVideoFpsController", "Executing create video FPS", { input });
        expect(Logger.info).not.toHaveBeenCalledWith("CreateVideoFpsController", "Video FPS created successfully", expect.any(Object));
    });
});
