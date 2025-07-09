import { ProcessS3NotificationsController } from "./ProcessS3Notifications.controller";
import { CreateVideoEventsUseCase } from "../usecase/create-video-events/CreateVideoEventsUseCase";

jest.mock("../usecase/create-video-events/CreateVideoEventsUseCase");

describe("ProcessS3NotificationsController", () => {
    let controller: ProcessS3NotificationsController;
    let mockCreateVideoEventsUseCase: jest.Mocked<CreateVideoEventsUseCase>;

    beforeEach(() => {
        mockCreateVideoEventsUseCase = new CreateVideoEventsUseCase() as jest.Mocked<CreateVideoEventsUseCase>;
        controller = new ProcessS3NotificationsController(mockCreateVideoEventsUseCase);
        jest.clearAllMocks();
    });

    it("should be defined", () => {
        expect(controller).toBeDefined();
    });

    it("should process S3 notification and return a 200 response", async () => {
        const request = {
            Message: JSON.stringify({
                Records: [
                    {
                        s3: {
                            bucket: { name: "test-bucket" },
                            object: { key: "test-key" },
                        },
                    },
                ],
            }),
        };

        mockCreateVideoEventsUseCase.execute.mockResolvedValue(undefined);

        const response = await controller.execute(request);

        expect(mockCreateVideoEventsUseCase.execute).toHaveBeenCalledWith({
            bucket: "test-bucket",
            key: "test-key",
        });
        expect(response).toEqual({
            statusCode: 200,
            body: JSON.stringify({
                message: "S3 notification processed successfully",
            }),
        });
    });

    it("should throw an error if Message is not valid JSON", async () => {
        const request = {
            Message: "invalid json",
        };

        await expect(controller.execute(request)).rejects.toThrow(SyntaxError);
    });

    it("should throw an error if S3 bucket or key information is missing", async () => {
        const request = {
            Message: JSON.stringify({
                Records: [
                    {
                        s3: {
                            bucket: {},
                            object: {},
                        },
                    },
                ],
            }),
        };

        mockCreateVideoEventsUseCase.execute.mockRejectedValue(new TypeError("Cannot read properties of undefined (reading 'name')"));

        await expect(controller.execute(request)).rejects.toThrow(TypeError);
    });

    it("should handle errors from the use case", async () => {
        const request = {
            Message: JSON.stringify({
                Records: [
                    {
                        s3: {
                            bucket: { name: "test-bucket" },
                            object: { key: "test-key" },
                        },
                    },
                ],
            }),
        };
        const error = new Error("Use case error");

        mockCreateVideoEventsUseCase.execute.mockRejectedValue(error);

        await expect(controller.execute(request)).rejects.toThrow(error);
    });

    it('when initialize without dependencies should still work', async () => {
        const controllerWithoutDependencies = new ProcessS3NotificationsController();
        const request = {
            Message: JSON.stringify({
                Records: [
                    {
                        s3: {
                            bucket: { name: "test-bucket" },
                            object: { key: "test-key" },
                        },
                    },
                ],
            }),
        };

        mockCreateVideoEventsUseCase.execute.mockResolvedValue(undefined);

        const response = await controllerWithoutDependencies.execute(request);
        expect(response).toEqual({
            statusCode: 200,
            body: JSON.stringify({
                message: "S3 notification processed successfully",
            }),
        });
    })
});
