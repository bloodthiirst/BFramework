namespace Middleware.Example;

public class TemplateHtmlRouteMiddleware
{
    private readonly RequestDelegate _next;
    private readonly string _basePath;

    public TemplateHtmlRouteMiddleware(RequestDelegate next, string basePath)
    {
        _next = next;
        _basePath = basePath;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        string request = context.Request.Path.Value;

        if(Path.HasExtension(request))
        {
            await _next(context);
            return;
        }

        request = request.Replace("/", "\\");

        string pagePath = _basePath + request + ".html";

        if (File.Exists(pagePath))
        {
            context.Response.Headers.Add("Content-Type", "text/html");

            using (FileStream fs = File.Open(pagePath , FileMode.Open))
            {
                byte[] buffer = new byte[fs.Length];
                int pageData = await fs.ReadAsync(buffer);
                await context.Response.BodyWriter.WriteAsync(buffer);
            }
        }

        // Call the next delegate/middleware in the pipeline.
        await _next(context);
    }
}

public static class TemplateHtmlRouteMiddlewareExtensions
{
    public static IApplicationBuilder UseTemplateHtmlRouter(
        this IApplicationBuilder builder, string basePath)
    {
        return builder.UseMiddleware<TemplateHtmlRouteMiddleware>(basePath);
    }
}