import type { IComponent } from "../../../core/Component/IComponent";
import { ComponentDecorator } from "../../../core/Component/ComponentDecorator";
import type { BakedComponent } from "../../../core/Router/DefaultRouteHandler";
import type { RoutingContext } from "../../../core/Transition/FadeRouteTransition";
import type { WeatherForecast } from "../../models/WeatherForecast";

@ComponentDecorator.Component("weather-card" , "templates/weather-card/weather-card")
export class WeatherCard implements IComponent
{
    data: WeatherForecast;
    
    constructor(data : WeatherForecast) {
        this.data = data;     
    }

    OnAttach(data: BakedComponent, ctx: RoutingContext): void
    {
        console.log("Attached !");

        data.containerElement!.querySelector('[name="date"]')!.innerHTML = this.data.date.toString();
        data.containerElement!.querySelector('[name="temperature"]')!.innerHTML = this.data.temperatureC.toString();
        data.containerElement!.querySelector('[name="summary"]')!.innerHTML = this.data.summary!;
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