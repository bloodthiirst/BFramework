import { ComponentDecorator } from "../../../../core/Component/ComponentDecorator";
import type { IComponent } from "../../../../core/Component/IComponent";
import type { BakedComponent } from "../../../../core/Router/DefaultRouteHandler";
import type { RoutingContext } from "../../../../core/Transition/FadeRouteTransition";

@ComponentDecorator.Component("foreach")
export class Foreach implements IComponent
{
    OnAttach(data : BakedComponent, ctx: RoutingContext): void {
        console.log("Attached !");

        let start = 0;

        if (data.attributes.has("start")) {
            start = Number.parseInt(data.attributes.get("start") as string, 10);
        }

        let length = Number.parseInt(data.attributes.get("length") as string, 10);
        let direction = start < length ? +1 : -1;
        let old: string = '';

        for (let i = start; i < length; i += direction) {

            old += `<!-- Element ${i} -->\n`;
            old += data.innterHtml.replaceAll("{i}", i.toString());
            old += "\n";
        }

        let casted: HTMLElement = data.containerElement as HTMLElement;
        casted.innerHTML = old;
    }

    OnRefresh(data: BakedComponent, ctx: RoutingContext): void
    {
        console.log("Refresh !");
    }

    OnDeattach(data: BakedComponent, ctx: RoutingContext): void
    {
        console.log("Dettached !");
    }
}