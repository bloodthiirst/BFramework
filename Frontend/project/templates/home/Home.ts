import type { IComponent } from "../../../core/Component/IComponent";
import { ComponentDecorator } from "../../../core/Component/ComponentDecorator";
import { BakedComponent } from "../../../core/Router/DefaultRouteHandler";
import type { RoutingContext } from "../../../core/Transition/FadeRouteTransition";
import type { WeatherForecast } from "../../models/WeatherForecast";
import { Effects } from "../../../core/Utils/Effects";
import { EntryPoint } from "../../../core/EntryPoint";
import { Injector } from "../../../core/Utils/Injector";
import { WeatherCard } from "../weather-card/WeatherCard";
import { Utils } from "../../../core/Utils/Utils";
import { WeatherServices } from "../../services/WeatherServices";

@ComponentDecorator.Component("home" , "templates/home/home")
export class Home implements IComponent
{
    requestRepeater: Promise<void> | null = null

    private async RequestAsync(data: BakedComponent): Promise<void>
    {
        let container : HTMLElement = data.containerElement?.getElementsByClassName("temp-container")[ 0 ] as (HTMLElement);
        console.assert(container != null);
        
        let weather = await new WeatherServices().GetWeather();
        
        data.subComponents
            .filter(c => c.componentInstance instanceof WeatherCard)
            .forEach(c => Utils.Remove(data, c));
        
        weather
            .map(w => new WeatherCard(w))
            .forEach(w => Utils.Add(data, container, w));

        await Effects.Delay(1000);

        if (this.requestRepeater == null)
        {
            return;
        }

        await this.RequestAsync(data);
    }
    
    OnAttach(data: BakedComponent, ctx: RoutingContext): void
    {
        console.log("Attached !");
        this.requestRepeater = this.RequestAsync(data);
    }

    OnRefresh(data: BakedComponent, ctx: RoutingContext): void
    {
        console.log("Refresh !");
    }

    OnDeattach(data: BakedComponent, ctx: RoutingContext): void
    {
        console.log("Dettached !");

        this.requestRepeater = null;
    }
}