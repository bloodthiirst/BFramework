import { EntryPoint } from "../EntryPoint";
import type { IRouteTransition } from "./TransitionManager";

export class RouteTransitionDecorator
{
    static Transition()
    {
        return (ctor: any) =>
        {
            let classObj = new ctor() as IRouteTransition;
            EntryPoint.Get().transitionManager.routeTransitions.push(classObj);
        };
    }
}
