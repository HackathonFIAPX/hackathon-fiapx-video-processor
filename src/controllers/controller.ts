import { HandlerResponse } from "./router";

export interface IController<TypeRequest> {
    execute(request: TypeRequest): Promise<HandlerResponse>
}