import type { IComponent } from "../Component/IComponent";
import { EntryPoint } from "../EntryPoint";
import type { TemplateInstance } from "../Templates/TemplareInstance";
import { Injector } from "../Utils/Injector";
import type { IRouteHandler } from "./IRouteHandler";
import { RouteManager } from "./RouteManager";

export class BakedComponent
{
    componentInstance: IComponent | null = null;

    /**
     * The container element containing all the HTML of the component
     * 
     * Contains all the subcomponent HTML along with a non-component related elements
     */
    containerElement: HTMLElement | null = null;

    /**
     * Contains the list of sub components present in the HTML
     */
    subComponents: BakedComponent[] = [];

    /**
     * HTML existing inside the component before the injection step
     */
    innterHtml: string = '';

    /**
     * Attributes that were added to the component's custom HTML element
     */
    attributes: Map<string, string> = new Map<string, string>();
}


/**
 * Class used for the {@link RouteManager} describe how a part of the page should be rendered
 */
export class RouterView
{
    /**
     * Component used to populate the router view
     * 
     * NOTE : this instance is only used for type comparison , the content of this object is discarded
     */
    component: IComponent | null = null;

    /**
     * ID of the div that will contain the component
     */
    outletId: string = '';

    /**
     * Child router views
     */
    children: RouterView[] = [];
}

/**
 * Contains the result of router handlers
 */
export class BakedRouterView
{
    sourceRouterView: RouterView | null = null;
    bakedComponent: BakedComponent | null = null;
    parent: BakedRouterView | null = null;
    children: BakedRouterView[] = [];

    Find(filter: (n: BakedRouterView) => boolean, parent: BakedRouterView): { n: BakedRouterView | null, parent: BakedRouterView | null } | null
    {
        if (filter(this))
        {
            return { n: this, parent: parent };
        }

        for (let c of this.children)
        {
            let res = c.Find(filter , this);

            if (res != null)
            {
                return res;
            }
        }

        return null;
    }
}

/** Default router to use in cases where the page is static except for one "container" (element with id="router-entry") that needs to be dynamic
* 
* in the constructor , pass the type of the component to use to fill the "container" section
*/
export class DefaultRouteHandler implements IRouteHandler
{
    routePath: string = '';
    routeView: RouterView;

    /**
     * 
     * @param path route path that can be handled
     * @param node 
     */
    constructor(path: string, view: RouterView)
    {
        this.routePath = path;
        this.routeView = view;
    }

    CanHandle(route: string): boolean
    {
        return route == this.routePath;
    }

    HandleRoute(route: string): BakedRouterView
    {
        let rootNode = this.RecursiveRoute(route, this.routeView , null);

        return rootNode;
    }

    private RecursiveRoute(route: string, routerNode: RouterView , parent : BakedRouterView | null ): BakedRouterView
    {
        let prot = Object.getPrototypeOf(routerNode.component);
        
        // spanw the initial root root component instance and HTML element
        let cmp: IComponent = new prot.constructor();

        // get div containing NON-INJECTED html , basically just replacing the component by its HTML content
        let rootElem : HTMLElement = Injector.CreateComponent(cmp);

        // pass it to the injector to convert it to recursively inject its elements
        let subNodes = Injector.InjectElement(rootElem);

        // now that everything is correctly injected , create the render node
        let bakedComp: BakedComponent = {
            componentInstance: cmp,
            containerElement: rootElem,
            subComponents: subNodes,
            innterHtml: '',
            attributes : new Map<string,string>()
        };

        // now we prepare the rooting data
        let bakedRoute: BakedRouterView = new BakedRouterView;
        bakedRoute.children = [];
        bakedRoute.bakedComponent = bakedComp;
        bakedRoute.sourceRouterView = routerNode;
        bakedRoute.parent = parent;

        // we propagate the routing by finding the outlets in the children and calling the routing on them recursively
        for (let subRoute of routerNode.children)
        {
            let subItems = rootElem.getElementsByTagName('*');
            var arr = Array.from(subItems);

            let subOutletIndex = arr.findIndex(c => c && c.id == subRoute.outletId);
            console.assert(subOutletIndex != -1);

            let subOutlet = arr[ subOutletIndex ] as HTMLElement;

            let subRouteCmpNode = this.RecursiveRoute(route, subRoute, bakedRoute);

            subOutlet.appendChild(subRouteCmpNode.bakedComponent!.containerElement!);
            bakedRoute.children.push(subRouteCmpNode);
        }

        return bakedRoute;
    }

}
