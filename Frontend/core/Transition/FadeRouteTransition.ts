import { EntryPoint } from "../EntryPoint";
import { BakedComponent, BakedRouterView } from "../Router/DefaultRouteHandler";
import { Effects } from "../Utils/Effects";
import { RouteTransitionDecorator } from "./RouteTransitionDecorator";
import type { IRouteTransition, TransitionContext } from "./TransitionManager";

export class RoutingContext
{
    fromRoute: string | null = null;
    toRoute: string = ''
}

@RouteTransitionDecorator.Transition()
export class FadeRouteTransition implements IRouteTransition
{
    someData: string = '';

    CanTrasition(from: string, to: string): boolean
    {
        return true;
    }

    BakedRouteViewCallRecursively(routeView: BakedRouterView, callback: (inputNode: BakedRouterView) => void): void
    {
        for (let child of routeView.children)
        {
            this.BakedRouteViewCallRecursively(child, callback);
        }

        callback(routeView);
    }

    BakedCmpCallRecursively(cmp: BakedComponent, callback: (inputNode: BakedComponent) => void): void
    {
        for (let child of cmp.subComponents)
        {
            this.BakedCmpCallRecursively(child, callback);
        }

        callback(cmp);
    }

    async DoTransitionAsync(ctx: TransitionContext): Promise<void>
    {
        let routerManager = EntryPoint.Get().routeManager;

        // in case this is an initial page load , find the root routerView
        if (routerManager.currentRouterView == null)
        {
            let firstLeaf: BakedRouterView = ctx.diffNode[ 0 ].newViews[ 0 ];

            while (firstLeaf.parent != null)
            {
                firstLeaf = firstLeaf.parent;
            }

            routerManager.currentRouterView = firstLeaf;
        }

        console.assert(routerManager.currentRouterView.parent == null);

        let routingCtx: RoutingContext =
        {
            fromRoute: ctx.from,
            toRoute: ctx.to
        };

        for (let wave of ctx.diffNode)
        {
            // attach/detach/refresh callbacks
            {
                wave.oldViews.forEach(i =>
                {
                    this.BakedRouteViewCallRecursively(i, (view) =>
                    {
                        let baked: BakedComponent | null = view.bakedComponent;

                        if (baked != null)
                        {
                            this.BakedCmpCallRecursively(baked!, c => c.componentInstance!.OnDeattach(c, routingCtx));
                        }
                    });
                });

                wave.refreshViews.forEach(i =>
                {
                    this.BakedRouteViewCallRecursively(i, (view) =>
                    {
                        let baked: BakedComponent | null = view.bakedComponent;

                        if (baked != null)
                        {
                            this.BakedCmpCallRecursively(baked!, c => c.componentInstance!.OnRefresh(c, routingCtx));
                        }
                    });
                });

                wave.newViews.forEach(i =>
                {
                    this.BakedRouteViewCallRecursively(i, (view) =>
                    {
                        let baked: BakedComponent | null = view.bakedComponent;

                        if (baked != null)
                        {
                            this.BakedCmpCallRecursively(baked!, c => c.componentInstance!.OnAttach(c, routingCtx));
                        }
                    });
                });

            };

            let removeRects: Map<HTMLElement, DOMRectInit> = new Map<HTMLElement, DOMRectInit>();
            let addRects: Map<HTMLElement, DOMRectInit> = new Map<HTMLElement, DOMRectInit>();

            // first is outlet parent , second is the html to remove
            let removeHTML: Map<HTMLElement, HTMLElement> = new Map<HTMLElement, HTMLElement>();

            // first is outlet parent , second is the html to add
            let addHTML: Map<HTMLElement, HTMLElement> = new Map<HTMLElement, HTMLElement>();

            for (let removeNode of wave.oldViews)
            {
                let outlet = document.getElementById(removeNode.sourceRouterView!.outletId!)!;

                let htmlToRemove = removeNode.bakedComponent!.containerElement!;
                let rootNode = routerManager.currentRouterView!;

                // find the oulet node in the tree
                let nodeToRemove = rootNode.Find((n) => n.sourceRouterView!.outletId == removeNode.sourceRouterView!.outletId!, rootNode);

                console.assert(nodeToRemove != null);

                // empty the node's content
                nodeToRemove!.n!.bakedComponent = null;
                nodeToRemove!.n!.children = [];

                let oldRect = htmlToRemove.getBoundingClientRect();

                let toRect: DOMRectInit = {
                    x: 0,
                    y: 0,
                    width: oldRect.width,
                    height: 0
                };

                removeRects.set(outlet, toRect);
                removeHTML.set(outlet, htmlToRemove);
            }

            for (let addNode of wave.newViews)
            {
                let outlet = document.getElementById(addNode.sourceRouterView!.outletId)!;

                let rootNode = routerManager.currentRouterView!;

                // find the oulet node in the tree
                let nodeToAddTo = rootNode.Find((n) => n.sourceRouterView!.outletId == addNode.sourceRouterView!.outletId!, rootNode);

                console.assert(nodeToAddTo != null);

                let indexToReplace = nodeToAddTo!.parent!.children.indexOf(nodeToAddTo!.n!);

                // add node to tree
                nodeToAddTo!.parent!.children[ indexToReplace ] = addNode;

                // TODO : validate that we only have one sub child
                let htmlToAdd = addNode.bakedComponent!.containerElement!;

                outlet.appendChild(htmlToAdd);

                addHTML.set(outlet, htmlToAdd);
                addRects.set(outlet, htmlToAdd.getBoundingClientRect());

                outlet.removeChild(htmlToAdd);
            }

            // remove resize animation
            let resizingPromise: (kv: [ HTMLElement, DOMRectInit ], durationMs: number) => Promise<void> = async (kv, duration) =>
            {
                let elem = kv[ 0 ];
                let fromRect = elem.getBoundingClientRect();
                let classes = elem.className;

                elem.className = '';
                elem.style.position = 'relative';

                let toRect = kv[ 1 ];

                elem.style.x = `${fromRect.x}px`;
                elem.style.y = `${fromRect.y}px`;
                elem.style.width = `${fromRect.width}px`;
                elem.style.height = `${fromRect.height}px`;

                console.log("start resize");

                await Effects.Resize(elem, fromRect, toRect, duration);

                console.log("end resize");

                elem.className = classes;

                elem.style.removeProperty("position");
                elem.style.removeProperty("x");
                elem.style.removeProperty("y");
                elem.style.removeProperty("width");
                elem.style.removeProperty("height");

                elem.removeAttribute("style");
            }


            const fadeDuration = 500;
            const resizeDuration = 200;

            // fadeout old elements
            let fadeoutArray = Array.from(removeHTML).map(kv => Effects.Fade(kv[ 0 ], 1, 0, fadeDuration));
            await Promise.all(fadeoutArray);

            // size down outlet
            // attemp resizing the outlets that are only removed and not added
            let sizeDownArray = Array.from(removeRects).filter(kv => !addRects.has(kv[ 0 ])).map(kv => resizingPromise(kv, resizeDuration));
            //let sizeDownArray = Array.from(removeRects).map(kv => resizingPromise(kv));
            await Promise.all(sizeDownArray);

            // hide new elements
            Array.from(addRects).forEach(kv => kv[ 0 ].style.opacity = '0');

            // size up outlet
            let sizeUpArray = Array.from(addRects).map(kv => resizingPromise(kv, resizeDuration));

            // remove old elements
            // NOTE : we remove after construction the "sizeUpArray" because we need calculate BEFORE the removal
            // because we need go from the "pre-removal" size to the desired size
            Array.from(removeHTML).forEach(kv => kv[ 0 ].removeChild(kv[ 1 ]));

            await Promise.all(sizeUpArray);

            // add new elements
            Array.from(addHTML).forEach(kv => kv[ 0 ].appendChild(kv[ 1 ]));

            // fadein new elements
            let fadeinArray = Array.from(addHTML).map(kv => Effects.Fade(kv[ 0 ], 0, 1, fadeDuration));
            await Promise.all(fadeinArray);
        }

        return;
    }
}
