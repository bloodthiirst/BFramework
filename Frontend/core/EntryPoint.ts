import { ComponentManager } from "./Component/ComponentManager";
import { RouteManager } from "./Router/RouteManager";
import { TemplateManager } from "./Templates/TemplateManager";
import { TransitionManager } from "./Transition/TransitionManager";

/**
 * Main entry point for the app
 * 
 * A singleton that contains all the necessary dependencies needed to manage the app
 * 
 * Use EntryPoint.Get() to access the instance
 */
export class EntryPoint
{
  static Instance: EntryPoint;

  static Get()
  {
    return this.Instance || (this.Instance = new this);
  }

  /**
  * The base URL to use for calls to the Web Server
  */
  baseURL: string = "";

  /**
  * The base URL to use for calls to the REST Api Server
  */
  apiURL: string = "";

  /**
   * Collection of the components present in the project
   * 
   * The components get registered automatically on import by using a special decorator
   */
  componentManager: ComponentManager = new ComponentManager;

  /**
   * Collections of templates present in the project
   * 
   * These templates are derived from the components and match every component with it "html" counter part
   */
  templateManager: TemplateManager = new TemplateManager;

  /**
   * Manager responsible for managing routing
   */
  routeManager: RouteManager = new RouteManager;

  /**
   * Manager responsible for providing the correct transition from one router to the next
   */
  transitionManager: TransitionManager = new TransitionManager;
}
