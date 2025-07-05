import winston from "winston";
import { Logger } from "./logger";

jest.mock("winston", () => {
  const infoMock = jest.fn();
  const errorMock = jest.fn();

  const loggerMock = {
    info: infoMock,
    error: errorMock,
  };

  return {
    createLogger: jest.fn(() => loggerMock),
    format: {
      json: jest.fn(),
      simple: jest.fn(),
    },
    transports: {
      Console: jest.fn(),
    },
    loggerMock,
  };
});

describe("Logger", () => {
  const loggerInstance = (winston.createLogger as jest.Mock).mock.results[0].value;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("info", () => {
    it("when info is called should call winston.info with correct arguments", () => {
      Logger.info("TestTitle", "TestMessage", { foo: "bar" });

      expect(loggerInstance.info).toHaveBeenCalledWith({
        title: "TestTitle",
        message: "TestMessage",
        data: { foo: "bar" },
      });
    });

    it("when info is called with only title should not fail", () => {
      Logger.info("OnlyTitle");

      expect(loggerInstance.info).toHaveBeenCalledWith({
        title: "OnlyTitle",
        message: undefined,
        data: undefined,
      });
    });
  });

  describe("error", () => {
    it("when error is called should call winston.error with correct arguments", () => {
      Logger.error("ErrorTitle", "ErrorMessage", { error: "details" });

      expect(loggerInstance.error).toHaveBeenCalledWith({
        title: "ErrorTitle",
        message: "ErrorMessage",
        data: { error: "details" },
      });
    });

    it("when error is called with only title should not fail", () => {
      Logger.error("OnlyErrorTitle");

      expect(loggerInstance.error).toHaveBeenCalledWith({
        title: "OnlyErrorTitle",
        message: undefined,
        data: undefined,
      });
    });
  });
});
