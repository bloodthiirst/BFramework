namespace Middleware.Example;

public class HtmlMiddleware
{
    private readonly RequestDelegate _next;
    private readonly string _staticFilepath;
    private HashSet<string> _routesLookup;

    public HtmlMiddleware(RequestDelegate next, IEnumerable<string> routes, string staticFilepath)
    {
        _next = next;
        _staticFilepath = staticFilepath;
        _routesLookup = new HashSet<string>(routes);
    }

    public async Task InvokeAsync(HttpContext context)
    {
        string request = context.Request.Path.Value!;

        if (!_routesLookup.Contains(request))
        {
            await _next(context);
            return;
        }

        context.Response.Headers.Append("Content-Type", "text/html");

        using (FileStream fs = File.Open(_staticFilepath, FileMode.Open))
        {
            byte[] buffer = new byte[fs.Length];
            int pageData = await fs.ReadAsync(buffer);
            await context.Response.BodyWriter.WriteAsync(buffer);
        }
    }
}

public static class IndexMiddlewareExtensions
{
    public static IApplicationBuilder UseHtmlRouter(
        this IApplicationBuilder builder, IEnumerable<string> routes, string staticFilepath)
    {
        return builder.UseMiddleware<HtmlMiddleware>(routes, staticFilepath);
    }
}
