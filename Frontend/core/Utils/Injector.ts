import type { IComponent } from "../Component/IComponent";
import { EntryPoint } from "../EntryPoint";
import type { BakedComponent, BakedRouterView, RouterView } from "../Router/DefaultRouteHandler";
import type { TemplateInstance } from "../Templates/TemplareInstance";

export class RoutingDiffNode
{
    data: RoutingDiffData = { newViews : [] , oldViews : [] , refreshViews : []};
    children: RoutingDiffNode[] = [];
}

export class RoutingDiffData
{
    refreshViews: BakedRouterView[] = [];
    oldViews: BakedRouterView[] = [];
    newViews: BakedRouterView[] = [];
}

export class Injector
{
    static CompareComponentType(a: IComponent, b: IComponent): boolean
    {
        let oldP = Object.getPrototypeOf(a);
        let newP = Object.getPrototypeOf(b);

        return oldP.constructor.name == newP.constructor.name;
    }

    private static FlattenDiffNodeRecursive(root: RoutingDiffNode, arr: RoutingDiffData[]): void
    {
        for (let c of root.children)
        {
            this.FlattenDiffNodeRecursive(c, arr);
        }
        
        for (let c of root.children)
        {
            arr.push(c.data);
        }
    }

    /**
     * Return the routing diff in a flat array representing the changes that need to be made
     * 
     * The order of the element goes from leaf changes first , and ending with changes needed for the root view
     */
    static FlattenDiffViews(root: RoutingDiffNode): RoutingDiffData[]
    {
        let arr: RoutingDiffData[] = [];

        this.FlattenDiffNodeRecursive(root, arr);
        arr.unshift(root.data);

        return arr.reverse();
    }

    private static DiffViewsRecursive(oldView: BakedRouterView | null, newView: BakedRouterView, diffData: RoutingDiffNode): void
    {
        // if it's an init page load coming from a "cleared" state , then just take the next content directly
        if (oldView == null)
        {
            diffData.data.newViews.push(newView);
            return;
        }

        let isSameComponentType: boolean = this.CompareComponentType(oldView.bakedComponent!.componentInstance!, newView.bakedComponent!.componentInstance!);

        // if the current nodes are of the same type
        // then keep the old one and add it to the "refresh" array
        if (isSameComponentType)
        {
            diffData.data.refreshViews.push(oldView);

            for (let so of oldView.children)
            {
                for (let sn of newView.children)
                {
                    let potentialNode: RoutingDiffNode = new RoutingDiffNode;
                    this.DiffViewsRecursive(so, sn, potentialNode);
                    
                    diffData.children.push(potentialNode);
                }
            }
        }
        else
        {
            diffData.data.newViews.push(newView);
            diffData.data.oldViews.push(oldView);
        }
    }

    /**
     * Given 2 {@link BakedRouterView} instances (old and new) , resolve the operations needed to go from the old to the new view
     * @param oldView Root {@link BakedRouterView} representing the old view , note that this can be null (for example where we first load the page , where there's no old view) 
     * 
     * @param newView 
     * @returns 
     */
    public static DiffViews(oldView: BakedRouterView | null, newView: BakedRouterView): RoutingDiffNode
    {
        let data: RoutingDiffNode = new RoutingDiffNode;

        this.DiffViewsRecursive(oldView, newView, data);

        return data;
    }

    /**
     * Create HTMLElement containing the template for the component
     * 
     * The HTMLElement returned is a root div without the injection step applied to it
     */
    static CreateComponent(cmp: IComponent): HTMLElement
    {       
        let prototype = Object.getPrototypeOf(cmp);
        let foundIndex = EntryPoint.Get().templateManager.templates.findIndex((t) => t.associatedClass.constructor.name == prototype.constructor.name);

        if (foundIndex == -1)
        {
            throw "Can't find template for" + prototype;
        }

        let temp: TemplateInstance = EntryPoint.Get().templateManager.templates[ foundIndex ];

        let nodes = Array.from(document.createRange().createContextualFragment(temp.htmlContent).childNodes).filter( n => n.nodeType == n.ELEMENT_NODE);
        
        let divName = `Root_${prototype.constructor.name}`;

        let container: HTMLElement | null = null
        if (nodes.length == 1)
        {
            container = nodes[ 0 ] as HTMLElement;
        }
        else
        {
            container = document.createElement('div');
         
            for (let i = 0; i < nodes.length; ++i)
            {
                container.appendChild(nodes[i] as HTMLElement);
            }
        }

        console.assert(container != null);

        container!.id = divName;

        return container!;
    }

    private static InjectComponentsRecursive(elem: HTMLElement, injectionData: BakedComponent[]): void
    {
        // note : this collection gets affected by the changes caused recursion
        // hence we need to keep a copy for each iteration
        let elemsQuery = elem.getElementsByTagName("*");
        let elems: HTMLElement[] = [];

        for (let i = 0; i < elemsQuery.length; ++i)
        {
            let curr = elemsQuery.item(i);

            if (curr == null)
                continue;

            elems.push(curr as HTMLElement);
        }

        let count: number = elems.length;

        for (let i = 0; i < count; ++i)
        {
            let inPageComponentElem: HTMLElement | null = elems[ i ];

            if (inPageComponentElem == null)
                continue;

            let foundIndex = EntryPoint.Get().templateManager.templates.findIndex((t) => inPageComponentElem && t.tagName == inPageComponentElem.localName);

            if (foundIndex == -1)
            {
                continue;
            }
            
            let cmpProptotype = EntryPoint.Get().componentManager.Components.find(c => c.elementName == inPageComponentElem.localName);
            
            if (cmpProptotype == null)
            {
                throw new Error(`Couldn't find component class for HTML element name ${inPageComponentElem.localName}`);
            }

            let ctor = cmpProptotype.classDeclaration.prototype.constructor;
            let cmp: IComponent = new ctor();

            let templateHtml = Injector.CreateComponent(cmp)
            let attrs: Map<string, string> = new Map<string, string>();

            for (let i = 0; i < inPageComponentElem.attributes.length; ++i)
            {
                let pair: Attr = inPageComponentElem.attributes.item(i)!;
                attrs.set(pair.name, pair.nodeValue as string);
            }

            let innerHtml = inPageComponentElem.innerHTML;
            inPageComponentElem.replaceWith(templateHtml);

            let data: BakedComponent = {
                componentInstance: cmp,
                containerElement: templateHtml,
                subComponents: [],
                innterHtml: innerHtml,
                attributes: attrs
            };

            injectionData.push(data);

            this.InjectComponentsRecursive(templateHtml as HTMLElement, data.subComponents);

            let commentStart = document.createComment(`Start Injecting ${ctor.name} component`);
            let commentEnd = document.createComment(`End Injecting ${ctor.name} component`);

            if (templateHtml.parentElement == null)
            {
                console.error("Element has no parent");
                continue;
            }

            // add comments
            templateHtml.parentNode!.insertBefore(commentStart, templateHtml);
            templateHtml.parentNode!.insertBefore(commentEnd, templateHtml.nextSibling);
        }
    }

    static InjectElement(elem: HTMLElement): BakedComponent[]
    {
        let injectionData: BakedComponent[] = [];

        this.InjectComponentsRecursive(elem, injectionData);

        return injectionData;
    }
}