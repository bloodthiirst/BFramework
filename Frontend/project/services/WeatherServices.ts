import { EntryPoint } from "../../core/EntryPoint";
import type { WeatherForecast } from "../models/WeatherForecast";

export class WeatherServices
{
    public async GetWeather(): Promise<WeatherForecast[]>
    {
        let endpoint = EntryPoint.Get().apiURL;

        let res: Response = await fetch(new Request(`${endpoint}/WeatherForecast`));

        let weather: WeatherForecast[] = await res.json();

        return weather;
    }
}