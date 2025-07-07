# BFramework
A lightweight component-base web framework that has enough to do a simple and manageable web app
- Component based
- App routing
- Dynamic transitions/animation with router
- Simple API and design
- Hot reloading

## How does it work ?
The point is to use as little dependencies as possible (especially for the frontend part)
The Backend solution contains a web server project that launches the webpage along with a basic rest API that get used by the page

To run the webserver backend, use ``dotnet run --project WebServer`` from the backend folder

To run the REST API backend , end ``dotnet run --project "REST API"`` from the backend folder