import type { BakedRouterView, RouterView } from "./DefaultRouteHandler";

export interface IRouteHandler
{   
    CanHandle(route: string): boolean;

    HandleRoute(route: string): BakedRouterView;
}
