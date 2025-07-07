import { EntryPoint } from "../EntryPoint";
import { ComponentData } from "./ComponentData";

/**
 * Decorator used to be added on top of Component classes
 */
export class ComponentDecorator
{
    /**
     *  Decorator used to be added on top of the declaration of the "Component" classes
     * @param elementName The HTML tag type that will be used to represent the component     
     * @param templatePath The path to the HTML content for the component
     * @returns 
     */
    static Component(elementName: string, templatePath: string = '')
    {
        return (ctor: Function) =>
        {
            let data: ComponentData = {
                path: templatePath,
                elementName: elementName,
                classDeclaration: ctor,
            };

            EntryPoint.Get().componentManager.Add(data);
        };
    }
}
