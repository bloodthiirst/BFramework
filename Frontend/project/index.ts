import { Home } from "./templates/home/Home";
import { HomePage } from "./templates/homepage/HomePage";
import { PageFooter } from "./templates/page-footer/PageFooter";
import { PageHeader } from "./templates/page-header/PageHeader";
import { Blogs } from "./templates/blogs/Blogs";

import { EntryPoint } from "../core/EntryPoint";
import { DefaultRouteHandler } from "../core/Router/DefaultRouteHandler";

// route transitions
await import("../core/Transition/FadeRouteTransition");

// components
await import("./templates/BasicComponents/Foreach/Foreach");
await import("./templates/subpage/Subpage");
await import("./templates/subitem/SubItem");
await import("./templates/home/Home");
await import("./templates/homepage/HomePage");
await import("./templates/page-header/PageHeader");
await import("./templates/page-footer/PageFooter");
await import("./templates/blogs/Blogs");

// init state and url
EntryPoint.Get().baseURL = "https://localhost:7101";
EntryPoint.Get().apiURL = "https://localhost:7146";

// init templates from the components in the project
await EntryPoint.Get().templateManager.InitializeAsync();

// setup routing
// todo : look into chaining multiple handlers for the same route
// ex : Add("/" , "router-entry", HomePage).Then("home-router-entry" , InsideHomePage)
// that way we can route insde HomePage after it's done
EntryPoint.Get().routeManager
    .Add(new DefaultRouteHandler("/", {
        outletId: "router-entry",
        component: new HomePage(),
        children: [
            {
                component: new Home(),
                outletId: "home-router",
                children: []
            }
        ]
    }))
    .Add(new DefaultRouteHandler("/blogs", {
        outletId: "router-entry",
        component: new HomePage(),
        children: [
            {
                component: new Blogs(),
                outletId: "home-router",
                children: []
            }
        ]
    }));

await EntryPoint.Get().routeManager.InitializeAsync();

export { };
