import { ComponentData } from "./ComponentData";
import { ComponentDecorator } from "./ComponentDecorator";

/**
 * Manager class containing all the components of the project
 * The components are added on page load during the initialization of the site through the use of {@link ComponentDecorator}
 */
export class ComponentManager
{
    /**
     * Array of all the components in the project
     */
    Components: ComponentData[] = [];

    /**
     * Add a component
     * @param data Component to add
     */
    Add(data: ComponentData): void
    {
        this.Components.push(data);
    }
}
