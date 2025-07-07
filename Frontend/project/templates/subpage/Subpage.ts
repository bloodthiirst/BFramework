import { ComponentDecorator } from "../../../core/Component/ComponentDecorator";
import type { IComponent } from "../../../core/Component/IComponent";
import type { BakedComponent } from "../../../core/Router/DefaultRouteHandler";
import type { RoutingContext } from "../../../core/Transition/FadeRouteTransition";

@ComponentDecorator.Component("subpage" , "templates/subpage/subpage")
export class Subpage implements IComponent {

    OnAttach(data: BakedComponent, ctx: RoutingContext): void
    {
        console.log("Attached !");
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