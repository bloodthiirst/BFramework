namespace Middleware.Example;

public class JavascriptMiddleware
{
    private readonly RequestDelegate _next;
    private readonly string _route;
    private readonly string _staticFilepath;
    
    public JavascriptMiddleware(RequestDelegate next, string route , string staticFilepath)
    {
        _next = next;
        _route = route;
        _staticFilepath = staticFilepath;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        string request = context.Request.Path.Value;

        if (request != _route)
        {
            await _next(context);
            return;
        }

        context.Response.Headers.Add("Content-Type", "text/javascript");

        using (FileStream fs = File.Open(_staticFilepath, FileMode.Open))
        {
            byte[] buffer = new byte[fs.Length];
            int pageData = await fs.ReadAsync(buffer);
            await context.Response.BodyWriter.WriteAsync(buffer);
        }
    }
}

public static class JavascriptMiddlewareExtensions
{
    public static IApplicationBuilder UseJavascriptsRouter(
        this IApplicationBuilder builder, string route, string staticFilepath)
    {
        return builder.UseMiddleware<JavascriptMiddleware>(route , staticFilepath);
    }
}
