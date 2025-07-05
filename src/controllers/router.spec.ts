import { Router } from "./router";
import { Logger } from "../infra/utils/logger";

jest.mock("../infra/utils/logger");

describe("Router", () => {
  let router: Router;

  beforeEach(() => {
    router = new Router();
    jest.clearAllMocks();
  });

  it("when use is called should register the route and handler", () => {
    const route = "someRoute";
    const handler = jest.fn();

    router.use(route, handler);

    // Internally, routesAndHandlers[route] should be handler
    // We test it by calling execute and see if handler is called
    return router.execute(route, {}).then(() => {
      expect(handler).toHaveBeenCalled();
    });
  });

  it("when execute is called with a registered route should call the corresponding handler and return its response", async () => {
    const route = "myRoute";
    const response = { statusCode: 200, body: "ok" };
    const handler = jest.fn().mockResolvedValue(response);

    router.use(route, handler);

    const result = await router.execute(route, { some: "body" });

    expect(handler).toHaveBeenCalledWith({ some: "body" });
    expect(result).toEqual(response);
  });

  it("when execute is called with an unregistered route should log error and return 404 response", async () => {
    const unregisteredRoute = "noRoute";

    const result = await router.execute(unregisteredRoute, {});

    expect(Logger.error).toHaveBeenCalledWith("Router.execute", `Method not found for route: ${unregisteredRoute}`);
    expect(result.statusCode).toBe(404);
    expect(typeof result.body).toBe("string");
    const bodyParsed = JSON.parse(result.body);
    expect(bodyParsed.message).toBe("Method not found");
  });
});
