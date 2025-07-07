import { EntryPoint } from "../EntryPoint";
import type { TransitionContext } from "../Transition/TransitionManager";
import { Effects } from "../Utils/Effects";
import { RoutingDiffNode, Injector, RoutingDiffData } from "../Utils/Injector";
import type { BakedRouterView } from "./DefaultRouteHandler";
import type { IRouteHandler } from "./IRouteHandler";

/**
 * Class responsible for intercepting the navigation events and handling them in the way that we want
 */
export class RouteManager
{
    private routeHandlers: IRouteHandler[] = [];

    /**
     * Router node representing the page that is currently showing
     */
    public currentRouterView: BakedRouterView | null = null;

    /**
     * Current routing path
     */
    private currentRoute: string = '';

    /**
     * Given the route , return the correct router that will handle the page transition/navigation
     * @param route string representing the route
     * @returns the correct router or null
     */
    private GetHandler(route: string): IRouteHandler | null
    {
        for (let r of this.routeHandlers)
        {
            if (r.CanHandle(route))
            {
                return r;
            }
        }

        return null;
    }

    /**
     * Initialize the event listeners inorder to intercept the navigation events
     */
    async InitializeAsync(): Promise<void>
    {
        // register the navigation event
        window.navigation.addEventListener("navigate", this.HandleNavigationEventAsync);

        let route: string = window.location.href.substring(EntryPoint.Get().baseURL.length);

        await this.NavigateAsync(route);
    }

    Add(handler: IRouteHandler): RouteManager
    {
        this.routeHandlers.push(handler);
        return this;
    }

    async HandleNavigationEventAsync(e: NavigateEvent)
    {
        console.log(e);

        if (!e.destination.url.startsWith(EntryPoint.Get().baseURL))
        {
            return;
        }

        if (e.navigationType == "reload")
        {
            return;
        }

        // Exit early if this navigation shouldn't be intercepted,
        // e.g. if the navigation is cross-origin, or a download request
        if (!e.canIntercept)
        {
            return;
        }

        let newRoute = e.destination.url.substring(EntryPoint.Get().baseURL.length);
        let routerManager = EntryPoint.Get().routeManager;

        e.intercept({
            handler : async () =>
            {
                await routerManager.NavigateAsync(newRoute);
            }
        });
    }

    async NavigateAsync(to: string) : Promise<void>
    {
        let routerManager = EntryPoint.Get().routeManager;

        let oldRoute: string = routerManager.currentRoute;
        let oldNode: BakedRouterView | null = routerManager.currentRouterView!;

        let newRoute = to
        let newHandler = routerManager.GetHandler(newRoute);

        if (newHandler == null)
        {
            throw new Error(`Can't find handler for ${newRoute}`);
        }

        let newNode: BakedRouterView = newHandler!.HandleRoute(newRoute);

        let diffData : RoutingDiffNode = Injector.DiffViews(oldNode, newNode);
        let flatData : RoutingDiffData[] = Injector.FlattenDiffViews(diffData);

        let routeTransition = EntryPoint.Get().transitionManager.TryGetTransition(oldRoute, newRoute);

        if (routeTransition == null)
        {
            throw new Error(`Couldn't find transition from ${oldRoute} to ${newRoute}`);
        }

        let ctx: TransitionContext = {
            from: oldRoute,
            to: newRoute,
            diffNode: flatData
        };

        await routeTransition!.DoTransitionAsync(ctx);
    }
}

