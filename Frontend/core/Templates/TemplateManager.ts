import type { ComponentData } from "../Component/ComponentData";
import { EntryPoint } from "../EntryPoint";
import { TemplateInstance } from "./TemplareInstance";

/**
 * Contains all the templates imported in the project
 */
export class TemplateManager
{
  templates: TemplateInstance[] = [];

  Add(temp: TemplateInstance)
  {
    this.templates.push(temp);
  }

  /**
   * Scans all components in the project and matches them with their HTML content
   */
  async InitializeAsync(): Promise<void>
  {
    let components = EntryPoint.Get().componentManager.Components;
    let responses: (Promise<Response> | null)[] = new Array<(Promise<Response> | null)>(components.length);

    for (let i = 0; i < components.length; ++i)
    {
      let curr: ComponentData = components[ i ];

      if (curr.path == '')
      {
        responses[ i ] = null;
        continue;
      }

      let url = `${EntryPoint.Get().baseURL}/${curr.path}`;
      responses[ i ] = fetch(url);
    }

    await Promise.all(responses);

    for (let i = 0; i < responses.length; ++i)
    {
      let html = '';
      let res = responses[ i ];

      if (res != null)
      {
        let casted = res as Promise<Response>;
        html = await (await casted).text();
      }

      let curr: ComponentData = components[ i ];

      let instance = {
        htmlContent: html,
        tagName: curr.elementName,
        associatedClass: curr.classDeclaration.prototype
      };

      this.Add(instance);
    }
  }
}
