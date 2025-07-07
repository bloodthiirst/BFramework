import type { IComponent } from "../Component/IComponent";
import type { BakedComponent } from "../Router/DefaultRouteHandler";
import { Injector } from "./Injector";

export class Utils
{
    public static Remove(parent: BakedComponent, toRemove: BakedComponent) : void
    {
        let idx = parent.subComponents.indexOf(toRemove);
        parent.subComponents.splice(idx, 1);
        toRemove.componentInstance!.OnDeattach(toRemove, { fromRoute: "", toRoute: "" });
        toRemove.containerElement?.remove();
    }

    public static Add(parent: BakedComponent, container : HTMLElement, toAdd: IComponent) : BakedComponent
    {
        let cardHtml = Injector.CreateComponent(toAdd);

        let baked: BakedComponent = {
            componentInstance: toAdd,
            containerElement: cardHtml,
            subComponents: [],
            innterHtml: cardHtml.innerText,
            attributes: new Map<string, string>()
        };

        parent.subComponents.push(baked);

        container.appendChild(cardHtml);
        baked.componentInstance?.OnAttach(baked, { fromRoute : "" , toRoute : "" } );       
    
        return baked;
    }
}