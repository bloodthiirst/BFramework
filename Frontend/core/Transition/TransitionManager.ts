import type { RoutingDiffData, RoutingDiffNode } from "../Utils/Injector";

export class TransitionContext
{
    from: string = '';
    to: string = '';
    diffNode: RoutingDiffData[] = []
}

export interface IRouteTransition
{
    CanTrasition(from: string, to: string): boolean;
    DoTransitionAsync(ctx: TransitionContext): Promise<void>;
}

export class TransitionManager
{
    routeTransitions: IRouteTransition[] = [];

    TryGetTransition(from: string, to: string): IRouteTransition | null
    {
        for (let r of this.routeTransitions)
        {
            if (r.CanTrasition(from, to))
                return r;
        }

        return null;
    }
}