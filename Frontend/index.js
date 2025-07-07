var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name] = () => newValue
    });
};
var __legacyDecorateClassTS = function(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
    r = Reflect.decorate(decorators, target, key, desc);
  else
    for (var i = decorators.length - 1;i >= 0; i--)
      if (d = decorators[i])
        r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __esm = (fn, res) => () => (fn && (res = fn(fn = 0)), res);

// ../../Frontend/core/Component/ComponentManager.ts
class ComponentManager {
  Components = [];
  Add(data) {
    this.Components.push(data);
  }
}
var init_ComponentManager = __esm(() => {
});

// ../../Frontend/core/Utils/Injector.ts
class RoutingDiffNode {
  data = { newViews: [], oldViews: [], refreshViews: [] };
  children = [];
}

class Injector {
  static CompareComponentType(a, b) {
    let oldP = Object.getPrototypeOf(a);
    let newP = Object.getPrototypeOf(b);
    return oldP.constructor.name == newP.constructor.name;
  }
  static FlattenDiffNodeRecursive(root, arr) {
    for (let c of root.children) {
      this.FlattenDiffNodeRecursive(c, arr);
    }
    for (let c of root.children) {
      arr.push(c.data);
    }
  }
  static FlattenDiffViews(root) {
    let arr = [];
    this.FlattenDiffNodeRecursive(root, arr);
    arr.unshift(root.data);
    return arr.reverse();
  }
  static DiffViewsRecursive(oldView, newView, diffData) {
    if (oldView == null) {
      diffData.data.newViews.push(newView);
      return;
    }
    let isSameComponentType = this.CompareComponentType(oldView.bakedComponent.componentInstance, newView.bakedComponent.componentInstance);
    if (isSameComponentType) {
      diffData.data.refreshViews.push(oldView);
      for (let so of oldView.children) {
        for (let sn of newView.children) {
          let potentialNode = new RoutingDiffNode;
          this.DiffViewsRecursive(so, sn, potentialNode);
          diffData.children.push(potentialNode);
        }
      }
    } else {
      diffData.data.newViews.push(newView);
      diffData.data.oldViews.push(oldView);
    }
  }
  static DiffViews(oldView, newView) {
    let data = new RoutingDiffNode;
    this.DiffViewsRecursive(oldView, newView, data);
    return data;
  }
  static CreateComponent(cmp) {
    let prototype = Object.getPrototypeOf(cmp);
    let foundIndex = EntryPoint2.Get().templateManager.templates.findIndex((t) => t.associatedClass.constructor.name == prototype.constructor.name);
    if (foundIndex == -1) {
      throw "Can't find template for" + prototype;
    }
    let temp = EntryPoint2.Get().templateManager.templates[foundIndex];
    let nodes = Array.from(document.createRange().createContextualFragment(temp.htmlContent).childNodes).filter((n) => n.nodeType == n.ELEMENT_NODE);
    let divName = `Root_${prototype.constructor.name}`;
    let container = null;
    if (nodes.length == 1) {
      container = nodes[0];
    } else {
      container = document.createElement("div");
      for (let i = 0;i < nodes.length; ++i) {
        container.appendChild(nodes[i]);
      }
    }
    console.assert(container != null);
    container.id = divName;
    return container;
  }
  static InjectComponentsRecursive(elem, injectionData) {
    let elemsQuery = elem.getElementsByTagName("*");
    let elems = [];
    for (let i = 0;i < elemsQuery.length; ++i) {
      let curr = elemsQuery.item(i);
      if (curr == null)
        continue;
      elems.push(curr);
    }
    let count = elems.length;
    for (let i = 0;i < count; ++i) {
      let inPageComponentElem = elems[i];
      if (inPageComponentElem == null)
        continue;
      let foundIndex = EntryPoint2.Get().templateManager.templates.findIndex((t) => inPageComponentElem && t.tagName == inPageComponentElem.localName);
      if (foundIndex == -1) {
        continue;
      }
      let cmpProptotype = EntryPoint2.Get().componentManager.Components.find((c) => c.elementName == inPageComponentElem.localName);
      if (cmpProptotype == null) {
        throw new Error(`Couldn't find component class for HTML element name ${inPageComponentElem.localName}`);
      }
      let ctor = cmpProptotype.classDeclaration.prototype.constructor;
      let cmp = new ctor;
      let templateHtml = Injector.CreateComponent(cmp);
      let attrs = new Map;
      for (let i2 = 0;i2 < inPageComponentElem.attributes.length; ++i2) {
        let pair = inPageComponentElem.attributes.item(i2);
        attrs.set(pair.name, pair.nodeValue);
      }
      let innerHtml = inPageComponentElem.innerHTML;
      inPageComponentElem.replaceWith(templateHtml);
      let data = {
        componentInstance: cmp,
        containerElement: templateHtml,
        subComponents: [],
        innterHtml: innerHtml,
        attributes: attrs
      };
      injectionData.push(data);
      this.InjectComponentsRecursive(templateHtml, data.subComponents);
      let commentStart = document.createComment(`Start Injecting ${ctor.name} component`);
      let commentEnd = document.createComment(`End Injecting ${ctor.name} component`);
      if (templateHtml.parentElement == null) {
        console.error("Element has no parent");
        continue;
      }
      templateHtml.parentNode.insertBefore(commentStart, templateHtml);
      templateHtml.parentNode.insertBefore(commentEnd, templateHtml.nextSibling);
    }
  }
  static InjectElement(elem) {
    let injectionData = [];
    this.InjectComponentsRecursive(elem, injectionData);
    return injectionData;
  }
}
var init_Injector = __esm(() => {
  init_EntryPoint();
});

// ../../Frontend/core/Router/RouteManager.ts
class RouteManager {
  routeHandlers = [];
  currentRouterView = null;
  currentRoute = "";
  GetHandler(route) {
    for (let r of this.routeHandlers) {
      if (r.CanHandle(route)) {
        return r;
      }
    }
    return null;
  }
  async InitializeAsync() {
    window.navigation.addEventListener("navigate", this.HandleNavigationEventAsync);
    let route = window.location.href.substring(EntryPoint2.Get().baseURL.length);
    await this.NavigateAsync(route);
  }
  Add(handler) {
    this.routeHandlers.push(handler);
    return this;
  }
  async HandleNavigationEventAsync(e) {
    console.log(e);
    if (!e.destination.url.startsWith(EntryPoint2.Get().baseURL)) {
      return;
    }
    if (e.navigationType == "reload") {
      return;
    }
    if (!e.canIntercept) {
      return;
    }
    let newRoute = e.destination.url.substring(EntryPoint2.Get().baseURL.length);
    let routerManager = EntryPoint2.Get().routeManager;
    e.intercept({
      handler: async () => {
        await routerManager.NavigateAsync(newRoute);
      }
    });
  }
  async NavigateAsync(to) {
    let routerManager = EntryPoint2.Get().routeManager;
    let oldRoute = routerManager.currentRoute;
    let oldNode = routerManager.currentRouterView;
    let newRoute = to;
    let newHandler = routerManager.GetHandler(newRoute);
    if (newHandler == null) {
      throw new Error(`Can't find handler for ${newRoute}`);
    }
    let newNode = newHandler.HandleRoute(newRoute);
    let diffData = Injector.DiffViews(oldNode, newNode);
    let flatData = Injector.FlattenDiffViews(diffData);
    let routeTransition = EntryPoint2.Get().transitionManager.TryGetTransition(oldRoute, newRoute);
    if (routeTransition == null) {
      throw new Error(`Couldn't find transition from ${oldRoute} to ${newRoute}`);
    }
    let ctx = {
      from: oldRoute,
      to: newRoute,
      diffNode: flatData
    };
    await routeTransition.DoTransitionAsync(ctx);
  }
}
var init_RouteManager = __esm(() => {
  init_EntryPoint();
  init_Injector();
});

// ../../Frontend/core/Templates/TemplateManager.ts
class TemplateManager {
  templates = [];
  Add(temp) {
    this.templates.push(temp);
  }
  async InitializeAsync() {
    let components = EntryPoint2.Get().componentManager.Components;
    let responses = new Array(components.length);
    for (let i = 0;i < components.length; ++i) {
      let curr = components[i];
      if (curr.path == "") {
        responses[i] = null;
        continue;
      }
      let url = `${EntryPoint2.Get().baseURL}/${curr.path}`;
      responses[i] = fetch(url);
    }
    await Promise.all(responses);
    for (let i = 0;i < responses.length; ++i) {
      let html = "";
      let res = responses[i];
      if (res != null) {
        let casted = res;
        html = await (await casted).text();
      }
      let curr = components[i];
      let instance = {
        htmlContent: html,
        tagName: curr.elementName,
        associatedClass: curr.classDeclaration.prototype
      };
      this.Add(instance);
    }
  }
}
var init_TemplateManager = __esm(() => {
  init_EntryPoint();
});

// ../../Frontend/core/Transition/TransitionManager.ts
class TransitionManager {
  routeTransitions = [];
  TryGetTransition(from, to) {
    for (let r of this.routeTransitions) {
      if (r.CanTrasition(from, to))
        return r;
    }
    return null;
  }
}
var init_TransitionManager = __esm(() => {
});

// ../../Frontend/core/EntryPoint.ts
class EntryPoint2 {
  static Instance;
  static Get() {
    return this.Instance || (this.Instance = new this);
  }
  baseURL = "";
  apiURL = "";
  componentManager = new ComponentManager;
  templateManager = new TemplateManager;
  routeManager = new RouteManager;
  transitionManager = new TransitionManager;
}
var init_EntryPoint = __esm(() => {
  init_ComponentManager();
  init_RouteManager();
  init_TemplateManager();
  init_TransitionManager();
});

// ../../Frontend/core/Component/ComponentDecorator.ts
class ComponentDecorator {
  static Component(elementName, templatePath = "") {
    return (ctor) => {
      let data = {
        path: templatePath,
        elementName,
        classDeclaration: ctor
      };
      EntryPoint2.Get().componentManager.Add(data);
    };
  }
}
var init_ComponentDecorator = __esm(() => {
  init_EntryPoint();
});

// ../../Frontend/core/Utils/Effects.ts
class Effects {
  static async Resize(elem, from, to, duration) {
    let promises = [];
    promises.push(Effects.Lerp(from.x, to.x, duration, undefined, (n) => elem.style.x = `${n}px`), undefined);
    promises.push(Effects.Lerp(from.y, to.y, duration, undefined, (n) => elem.style.y = `${n}px`), undefined);
    promises.push(Effects.Lerp(from.width, to.width, duration, undefined, (n) => elem.style.width = `${n}px`), undefined);
    promises.push(Effects.Lerp(from.height, to.height, duration, undefined, (n) => elem.style.height = `${n}px`), undefined);
    return new Promise(async (f) => {
      await Promise.all(promises);
      f();
    });
  }
  static async Fade(element, from, to, duration) {
    let onStart = (n) => {
      element.style.opacity = from.toString();
      element.style.pointerEvents = "none";
    };
    let onTick = (n) => {
      element.style.opacity = n.toString();
    };
    let onEnd = (n) => {
      if (to == 1) {
        element.style.removeProperty("opacity");
      }
      element.style.removeProperty("pointer-events");
    };
    return this.Lerp(from, to, duration, onStart, onTick, onEnd);
  }
  static async Lerp(from, to, duration, onStart, onTick, onEnd) {
    const frameRate = 16.666666666666668;
    const sign = Math.sign(to - from);
    const min = Math.min(to, from);
    const max = Math.max(to, from);
    const amp = max - min;
    var curr = from;
    var t = 0;
    onStart?.(curr);
    onTick?.(curr);
    var timer = setInterval(function() {
      if (Math.abs(curr - to) <= 0.01) {
        onTick?.(to);
        onEnd?.(curr);
        clearInterval(timer);
        return;
      }
      t += frameRate / duration;
      curr = from + t * amp * sign;
      curr = Math.min(curr, max);
      curr = Math.max(curr, min);
      onTick?.(curr);
    }, frameRate);
    return new Promise((f) => setTimeout(f, duration));
  }
  static Delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
var init_Effects = __esm(() => {
});

// ../../Frontend/project/templates/weather-card/WeatherCard.ts
class WeatherCard {
  data;
  constructor(data) {
    this.data = data;
  }
  OnAttach(data, ctx) {
    console.log("Attached !");
    data.containerElement.querySelector('[name="date"]').innerHTML = this.data.date.toString();
    data.containerElement.querySelector('[name="temperature"]').innerHTML = this.data.temperatureC.toString();
    data.containerElement.querySelector('[name="summary"]').innerHTML = this.data.summary;
  }
  OnRefresh(data, ctx) {
    console.log("Refresh !");
  }
  OnDeattach(data, ctx) {
    console.log("Dettached !");
  }
}
var init_WeatherCard = __esm(() => {
  init_ComponentDecorator();
  WeatherCard = __legacyDecorateClassTS([
    ComponentDecorator.Component("weather-card", "templates/weather-card/weather-card")
  ], WeatherCard);
});

// ../../Frontend/core/Utils/Utils.ts
class Utils {
  static Remove(parent, toRemove) {
    let idx = parent.subComponents.indexOf(toRemove);
    parent.subComponents.splice(idx, 1);
    toRemove.componentInstance.OnDeattach(toRemove, { fromRoute: "", toRoute: "" });
    toRemove.containerElement?.remove();
  }
  static Add(parent, container, toAdd) {
    let cardHtml = Injector.CreateComponent(toAdd);
    let baked = {
      componentInstance: toAdd,
      containerElement: cardHtml,
      subComponents: [],
      innterHtml: cardHtml.innerText,
      attributes: new Map
    };
    parent.subComponents.push(baked);
    container.appendChild(cardHtml);
    baked.componentInstance?.OnAttach(baked, { fromRoute: "", toRoute: "" });
    return baked;
  }
}
var init_Utils = __esm(() => {
  init_Injector();
});

// ../../Frontend/project/services/WeatherServices.ts
class WeatherServices {
  async GetWeather() {
    let endpoint = EntryPoint2.Get().apiURL;
    let res = await fetch(new Request(`${endpoint}/WeatherForecast`));
    let weather = await res.json();
    return weather;
  }
}
var init_WeatherServices = __esm(() => {
  init_EntryPoint();
});

// ../../Frontend/project/templates/home/Home.ts
var exports_Home = {};
__export(exports_Home, {
  Home: () => {
    {
      return Home;
    }
  }
});

class Home {
  requestRepeater = null;
  async RequestAsync(data) {
    let container = data.containerElement?.getElementsByClassName("temp-container")[0];
    console.assert(container != null);
    let weather = await new WeatherServices().GetWeather();
    data.subComponents.filter((c) => c.componentInstance instanceof WeatherCard).forEach((c) => Utils.Remove(data, c));
    weather.map((w) => new WeatherCard(w)).forEach((w) => Utils.Add(data, container, w));
    await Effects.Delay(1000);
    if (this.requestRepeater == null) {
      return;
    }
    await this.RequestAsync(data);
  }
  OnAttach(data, ctx) {
    console.log("Attached !");
    this.requestRepeater = this.RequestAsync(data);
  }
  OnRefresh(data, ctx) {
    console.log("Refresh !");
  }
  OnDeattach(data, ctx) {
    console.log("Dettached !");
    this.requestRepeater = null;
  }
}
var init_Home = __esm(() => {
  init_ComponentDecorator();
  init_Effects();
  init_WeatherCard();
  init_Utils();
  init_WeatherServices();
  Home = __legacyDecorateClassTS([
    ComponentDecorator.Component("home", "templates/home/home")
  ], Home);
});

// ../../Frontend/project/templates/homepage/HomePage.ts
var exports_HomePage = {};
__export(exports_HomePage, {
  HomePage: () => {
    {
      return HomePage;
    }
  }
});

class HomePage {
  OnAttach(data, ctx) {
    console.log("Attached !");
  }
  OnRefresh(data, ctx) {
    console.log("Refresh !");
  }
  OnDeattach(data, ctx) {
    console.log("Dettached !");
  }
}
var init_HomePage = __esm(() => {
  init_ComponentDecorator();
  HomePage = __legacyDecorateClassTS([
    ComponentDecorator.Component("homepage", "templates/homepage/homepage")
  ], HomePage);
});

// ../../Frontend/project/templates/blogs/Blogs.ts
var exports_Blogs = {};
__export(exports_Blogs, {
  Blogs: () => {
    {
      return Blogs;
    }
  }
});

class Blogs {
  OnAttach(data, ctx) {
    console.log("Attached !");
  }
  OnRefresh(data, ctx) {
    console.log("Refresh !");
  }
  OnDeattach(data, ctx) {
    console.log("Dettached !");
  }
}
var init_Blogs = __esm(() => {
  init_ComponentDecorator();
  Blogs = __legacyDecorateClassTS([
    ComponentDecorator.Component("blogs", "templates/blogs/blogs")
  ], Blogs);
});

// ../../Frontend/core/Transition/RouteTransitionDecorator.ts
class RouteTransitionDecorator {
  static Transition() {
    return (ctor) => {
      let classObj = new ctor;
      EntryPoint2.Get().transitionManager.routeTransitions.push(classObj);
    };
  }
}
var init_RouteTransitionDecorator = __esm(() => {
  init_EntryPoint();
});

// ../../Frontend/core/Transition/FadeRouteTransition.ts
var exports_FadeRouteTransition = {};
__export(exports_FadeRouteTransition, {
  RoutingContext: () => {
    {
      return RoutingContext;
    }
  },
  FadeRouteTransition: () => {
    {
      return FadeRouteTransition;
    }
  }
});

class RoutingContext {
  fromRoute = null;
  toRoute = "";
}

class FadeRouteTransition {
  someData = "";
  CanTrasition(from, to) {
    return true;
  }
  BakedRouteViewCallRecursively(routeView, callback) {
    for (let child of routeView.children) {
      this.BakedRouteViewCallRecursively(child, callback);
    }
    callback(routeView);
  }
  BakedCmpCallRecursively(cmp, callback) {
    for (let child of cmp.subComponents) {
      this.BakedCmpCallRecursively(child, callback);
    }
    callback(cmp);
  }
  async DoTransitionAsync(ctx) {
    let routerManager = EntryPoint2.Get().routeManager;
    if (routerManager.currentRouterView == null) {
      let firstLeaf = ctx.diffNode[0].newViews[0];
      while (firstLeaf.parent != null) {
        firstLeaf = firstLeaf.parent;
      }
      routerManager.currentRouterView = firstLeaf;
    }
    console.assert(routerManager.currentRouterView.parent == null);
    let routingCtx = {
      fromRoute: ctx.from,
      toRoute: ctx.to
    };
    for (let wave of ctx.diffNode) {
      {
        wave.oldViews.forEach((i) => {
          this.BakedRouteViewCallRecursively(i, (view) => {
            let baked = view.bakedComponent;
            if (baked != null) {
              this.BakedCmpCallRecursively(baked, (c) => c.componentInstance.OnDeattach(c, routingCtx));
            }
          });
        });
        wave.refreshViews.forEach((i) => {
          this.BakedRouteViewCallRecursively(i, (view) => {
            let baked = view.bakedComponent;
            if (baked != null) {
              this.BakedCmpCallRecursively(baked, (c) => c.componentInstance.OnRefresh(c, routingCtx));
            }
          });
        });
        wave.newViews.forEach((i) => {
          this.BakedRouteViewCallRecursively(i, (view) => {
            let baked = view.bakedComponent;
            if (baked != null) {
              this.BakedCmpCallRecursively(baked, (c) => c.componentInstance.OnAttach(c, routingCtx));
            }
          });
        });
      }
      let removeRects = new Map;
      let addRects = new Map;
      let removeHTML = new Map;
      let addHTML = new Map;
      for (let removeNode of wave.oldViews) {
        let outlet = document.getElementById(removeNode.sourceRouterView.outletId);
        let htmlToRemove = removeNode.bakedComponent.containerElement;
        let rootNode = routerManager.currentRouterView;
        let nodeToRemove = rootNode.Find((n) => n.sourceRouterView.outletId == removeNode.sourceRouterView.outletId, rootNode);
        console.assert(nodeToRemove != null);
        nodeToRemove.n.bakedComponent = null;
        nodeToRemove.n.children = [];
        let oldRect = htmlToRemove.getBoundingClientRect();
        let toRect = {
          x: 0,
          y: 0,
          width: oldRect.width,
          height: 0
        };
        removeRects.set(outlet, toRect);
        removeHTML.set(outlet, htmlToRemove);
      }
      for (let addNode of wave.newViews) {
        let outlet = document.getElementById(addNode.sourceRouterView.outletId);
        let rootNode = routerManager.currentRouterView;
        let nodeToAddTo = rootNode.Find((n) => n.sourceRouterView.outletId == addNode.sourceRouterView.outletId, rootNode);
        console.assert(nodeToAddTo != null);
        let indexToReplace = nodeToAddTo.parent.children.indexOf(nodeToAddTo.n);
        nodeToAddTo.parent.children[indexToReplace] = addNode;
        let htmlToAdd = addNode.bakedComponent.containerElement;
        outlet.appendChild(htmlToAdd);
        addHTML.set(outlet, htmlToAdd);
        addRects.set(outlet, htmlToAdd.getBoundingClientRect());
        outlet.removeChild(htmlToAdd);
      }
      let resizingPromise = async (kv, duration) => {
        let elem = kv[0];
        let fromRect = elem.getBoundingClientRect();
        let classes = elem.className;
        elem.className = "";
        elem.style.position = "relative";
        let toRect = kv[1];
        elem.style.x = `${fromRect.x}px`;
        elem.style.y = `${fromRect.y}px`;
        elem.style.width = `${fromRect.width}px`;
        elem.style.height = `${fromRect.height}px`;
        console.log("start resize");
        await Effects.Resize(elem, fromRect, toRect, duration);
        console.log("end resize");
        elem.className = classes;
        elem.style.removeProperty("position");
        elem.style.removeProperty("x");
        elem.style.removeProperty("y");
        elem.style.removeProperty("width");
        elem.style.removeProperty("height");
        elem.removeAttribute("style");
      };
      const fadeDuration = 500;
      const resizeDuration = 200;
      let fadeoutArray = Array.from(removeHTML).map((kv) => Effects.Fade(kv[0], 1, 0, fadeDuration));
      await Promise.all(fadeoutArray);
      let sizeDownArray = Array.from(removeRects).filter((kv) => !addRects.has(kv[0])).map((kv) => resizingPromise(kv, resizeDuration));
      await Promise.all(sizeDownArray);
      Array.from(addRects).forEach((kv) => kv[0].style.opacity = "0");
      let sizeUpArray = Array.from(addRects).map((kv) => resizingPromise(kv, resizeDuration));
      Array.from(removeHTML).forEach((kv) => kv[0].removeChild(kv[1]));
      await Promise.all(sizeUpArray);
      Array.from(addHTML).forEach((kv) => kv[0].appendChild(kv[1]));
      let fadeinArray = Array.from(addHTML).map((kv) => Effects.Fade(kv[0], 0, 1, fadeDuration));
      await Promise.all(fadeinArray);
    }
    return;
  }
}
var init_FadeRouteTransition = __esm(() => {
  init_EntryPoint();
  init_Effects();
  init_RouteTransitionDecorator();
  FadeRouteTransition = __legacyDecorateClassTS([
    RouteTransitionDecorator.Transition()
  ], FadeRouteTransition);
});

// ../../Frontend/project/templates/BasicComponents/Foreach/Foreach.ts
var exports_Foreach = {};
__export(exports_Foreach, {
  Foreach: () => {
    {
      return Foreach;
    }
  }
});

class Foreach {
  OnAttach(data, ctx) {
    console.log("Attached !");
    let start = 0;
    if (data.attributes.has("start")) {
      start = Number.parseInt(data.attributes.get("start"), 10);
    }
    let length = Number.parseInt(data.attributes.get("length"), 10);
    let direction = start < length ? 1 : -1;
    let old = "";
    for (let i = start;i < length; i += direction) {
      old += `<!-- Element ${i} -->\n`;
      old += data.innterHtml.replaceAll("{i}", i.toString());
      old += "\n";
    }
    let casted = data.containerElement;
    casted.innerHTML = old;
  }
  OnRefresh(data, ctx) {
    console.log("Refresh !");
  }
  OnDeattach(data, ctx) {
    console.log("Dettached !");
  }
}
var init_Foreach = __esm(() => {
  init_ComponentDecorator();
  Foreach = __legacyDecorateClassTS([
    ComponentDecorator.Component("foreach")
  ], Foreach);
});

// ../../Frontend/project/templates/subpage/Subpage.ts
var exports_Subpage = {};
__export(exports_Subpage, {
  Subpage: () => {
    {
      return Subpage;
    }
  }
});

class Subpage {
  OnAttach(data, ctx) {
    console.log("Attached !");
  }
  OnRefresh(data, ctx) {
    console.log("Refresh !");
  }
  OnDeattach(data, ctx) {
    console.log("Dettached !");
  }
}
var init_Subpage = __esm(() => {
  init_ComponentDecorator();
  Subpage = __legacyDecorateClassTS([
    ComponentDecorator.Component("subpage", "templates/subpage/subpage")
  ], Subpage);
});

// ../../Frontend/project/templates/subitem/SubItem.ts
var exports_SubItem = {};
__export(exports_SubItem, {
  SubItem: () => {
    {
      return SubItem;
    }
  }
});

class SubItem {
  OnAttach(data, ctx) {
    console.log("Attached !");
  }
  OnRefresh(data, ctx) {
    console.log("Refresh !");
  }
  OnDeattach(data, ctx) {
    console.log("Dettached !");
  }
}
var init_SubItem = __esm(() => {
  init_ComponentDecorator();
  SubItem = __legacyDecorateClassTS([
    ComponentDecorator.Component("sub-item", "templates/subitem/subitem")
  ], SubItem);
});

// ../../Frontend/project/templates/page-header/PageHeader.ts
var exports_PageHeader = {};
__export(exports_PageHeader, {
  PageHeader: () => {
    {
      return PageHeader;
    }
  }
});

class PageHeader {
  OnAttach(data, ctx) {
    console.log("Attached !");
  }
  OnRefresh(data, ctx) {
    console.log("Refresh !");
  }
  OnDeattach(data, ctx) {
    console.log("Dettached !");
  }
}
var init_PageHeader = __esm(() => {
  init_ComponentDecorator();
  PageHeader = __legacyDecorateClassTS([
    ComponentDecorator.Component("page-header", "templates/page-header/page-header")
  ], PageHeader);
});

// ../../Frontend/project/templates/page-footer/PageFooter.ts
var exports_PageFooter = {};
__export(exports_PageFooter, {
  PageFooter: () => {
    {
      return PageFooter;
    }
  }
});

class PageFooter {
  OnAttach(data, ctx) {
    console.log("Attached !");
  }
  OnRefresh(data, ctx) {
    console.log("Refresh !");
  }
  OnDeattach(data, ctx) {
    console.log("Dettached !");
  }
}
var init_PageFooter = __esm(() => {
  init_ComponentDecorator();
  PageFooter = __legacyDecorateClassTS([
    ComponentDecorator.Component("page-footer", "templates/page-footer/page-footer")
  ], PageFooter);
});

// ../../Frontend/project/index.ts
init_Home();
init_HomePage();
init_Blogs();
init_EntryPoint();

// ../../Frontend/core/Router/DefaultRouteHandler.ts
init_Injector();

class BakedComponent {
  componentInstance = null;
  containerElement = null;
  subComponents = [];
  innterHtml = "";
  attributes = new Map;
}
class BakedRouterView {
  sourceRouterView = null;
  bakedComponent = null;
  parent = null;
  children = [];
  Find(filter, parent) {
    if (filter(this)) {
      return { n: this, parent };
    }
    for (let c of this.children) {
      let res = c.Find(filter, this);
      if (res != null) {
        return res;
      }
    }
    return null;
  }
}

class DefaultRouteHandler {
  routePath = "";
  routeView;
  constructor(path, view) {
    this.routePath = path;
    this.routeView = view;
  }
  CanHandle(route) {
    return route == this.routePath;
  }
  HandleRoute(route) {
    let rootNode = this.RecursiveRoute(route, this.routeView, null);
    return rootNode;
  }
  RecursiveRoute(route, routerNode, parent) {
    let prot = Object.getPrototypeOf(routerNode.component);
    let cmp = new prot.constructor;
    let rootElem = Injector.CreateComponent(cmp);
    let subNodes = Injector.InjectElement(rootElem);
    let bakedComp = {
      componentInstance: cmp,
      containerElement: rootElem,
      subComponents: subNodes,
      innterHtml: "",
      attributes: new Map
    };
    let bakedRoute = new BakedRouterView;
    bakedRoute.children = [];
    bakedRoute.bakedComponent = bakedComp;
    bakedRoute.sourceRouterView = routerNode;
    bakedRoute.parent = parent;
    for (let subRoute of routerNode.children) {
      let subItems = rootElem.getElementsByTagName("*");
      var arr = Array.from(subItems);
      let subOutletIndex = arr.findIndex((c) => c && c.id == subRoute.outletId);
      console.assert(subOutletIndex != -1);
      let subOutlet = arr[subOutletIndex];
      let subRouteCmpNode = this.RecursiveRoute(route, subRoute, bakedRoute);
      subOutlet.appendChild(subRouteCmpNode.bakedComponent.containerElement);
      bakedRoute.children.push(subRouteCmpNode);
    }
    return bakedRoute;
  }
}

// ../../Frontend/project/index.ts
await Promise.resolve().then(() => (init_FadeRouteTransition(), exports_FadeRouteTransition));
await Promise.resolve().then(() => (init_Foreach(), exports_Foreach));
await Promise.resolve().then(() => (init_Subpage(), exports_Subpage));
await Promise.resolve().then(() => (init_SubItem(), exports_SubItem));
await Promise.resolve().then(() => (init_Home(), exports_Home));
await Promise.resolve().then(() => (init_HomePage(), exports_HomePage));
await Promise.resolve().then(() => (init_PageHeader(), exports_PageHeader));
await Promise.resolve().then(() => (init_PageFooter(), exports_PageFooter));
await Promise.resolve().then(() => (init_Blogs(), exports_Blogs));
EntryPoint2.Get().baseURL = "https://localhost:7101";
EntryPoint2.Get().apiURL = "https://localhost:7146";
await EntryPoint2.Get().templateManager.InitializeAsync();
EntryPoint2.Get().routeManager.Add(new DefaultRouteHandler("/", {
  outletId: "router-entry",
  component: new HomePage,
  children: [
    {
      component: new Home,
      outletId: "home-router",
      children: []
    }
  ]
})).Add(new DefaultRouteHandler("/blogs", {
  outletId: "router-entry",
  component: new HomePage,
  children: [
    {
      component: new Blogs,
      outletId: "home-router",
      children: []
    }
  ]
}));
await EntryPoint2.Get().routeManager.InitializeAsync();
