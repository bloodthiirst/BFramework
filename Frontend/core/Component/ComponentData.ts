import { ComponentDecorator } from "./ComponentDecorator"

/**
 * Core class containg the info related to components
 * Instances of this class are created through the use of {@link ComponentDecorator}
 */
export class ComponentData
{
    /**
     * The HTML tag type that will be used to represent the component
     */
    elementName: string = "";

    /**
     * Object representing the class of the component
     */
    classDeclaration: any = {};

    /**
     * templatePath The path to the HTML content for the component
     */
    path: string = "";
}
