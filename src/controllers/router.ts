import { Logger } from "../infra/utils/logger";

export type HandlerResponse = {
    statusCode: number;
    body: any;
}

type RouteAndHandler = {
    [key: string]: (body: any) => Promise<HandlerResponse>;
}

export class Router {
    private routesAndHandlers: RouteAndHandler = {}

    public use(route: string, handler: (body: any) => Promise<HandlerResponse>) {
        this.routesAndHandlers[route] = handler;
    }

    public async execute(route: string, body: any): Promise<HandlerResponse> {
        const handler = this.routesAndHandlers[route]
        if (!handler) {
            Logger.error('Router.execute', `Method not found for route: ${route}`);
            return {
                statusCode: 404,
                body: JSON.stringify({
                    message: 'Method not found',
                }),
            };
        }
        return await handler(body);
    }
}