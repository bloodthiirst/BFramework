import type { BakedComponent } from "../Router/DefaultRouteHandler";
import type { RoutingContext } from "../Transition/FadeRouteTransition";

/**
 * Interface represent the common traits of a component instance
 */
export interface IComponent
{
    /**
     * Callback invoked by the injector during the process of scanning the HTML and replacing component tag by their templated content
     * 
     * Note that this callback is called **before** the recursive injection process deals with potential child components
     * 
     * Meaning that **if** this component has child sub-component , they wouldn't be available the moment this method is called
     * 
     * @param rootNode The root node of the HTML spawned from the template
     * @param attributes Dictionary of attributes that were put on the custom HTML tag before it got replaced by the injector
     * @param innerHtml HTML content of the custom HTML tag before it got replaced by the injector
     */
    OnAttach(data: BakedComponent, ctx: RoutingContext): void;

    OnRefresh(data: BakedComponent, ctx: RoutingContext): void;

    OnDeattach(data: BakedComponent, ctx: RoutingContext): void;
}
