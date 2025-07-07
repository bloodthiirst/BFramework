using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Options;
using Middleware.Example;
using System.Diagnostics;
using WebServer.Filewatcher;
using WebServer.Websocket;
using WebSocketSharp.Server;

namespace Bloodthirst.Server
{
    public class Program
    {
        private const string SettingsSectionKey = "WebProject";

        private static WebApplication? webServer;
        private static Thread? webServerThread;

        private static Filewatcher watcher;
        private static WebSocketServer socketserver;
        private static IConfigurationRoot appConfig;

        static async Task Main(string[] args)
        {
            appConfig = new ConfigurationBuilder()
                    .AddJsonFile("appsettings.json")
                    .AddEnvironmentVariables()
                    .Build();

            // socket hotreload
            // NOTE : WebSocketServer.Start() internally calls Thread.Start()
            // so it's not blocking
            {
                socketserver = new WebSocketServer("ws://localhost:56888");
                socketserver.AddWebSocketService<SocketRefreshBehaviour>("/Refresh");
                socketserver.Start();
                Console.WriteLine("Server has started on ws://localhost:56888.{0}Waiting for a connection…", Environment.NewLine);
            }

            // filewatcher start
            {
                string? folderPath = GetProjectRootPath();
                Debug.Assert(folderPath != null);

                string[] extensions = [".ts", ".css", ".html"];
                watcher = new Filewatcher(folderPath, extensions);
                watcher.Start();
                watcher.OnFileChanged += HandleChanged;
            }

            await BuildTypescript();
            await BuildTailwind();

            // webserver thread
            {
                webServer = CreateServer(args);
                webServerThread = new Thread(() =>
                {
                    Debug.Assert(webServer != null);
                    webServer.Run();
                });

                webServerThread.Start();
            }

            webServerThread.Join();

            watcher.OnFileChanged -= HandleChanged;
            watcher.Stop();
        }
        private static string GetProjectRootPath()
        {
            IConfigurationSection configurationSection = appConfig.GetSection(SettingsSectionKey);
            Debug.Assert(configurationSection.Exists());

            WebProjectSettings? frontend = configurationSection.Get<WebProjectSettings>();
            Debug.Assert(frontend != null);

            string path = frontend.RootPath;
            string currDir = Environment.CurrentDirectory;
            
            if(!Path.IsPathRooted(path))
            {
                path = Path.GetFullPath(path , currDir);
            }

            return path;
        }
        private static string GetFrontendPath()
        {
            IConfigurationSection configurationSection = appConfig.GetSection(SettingsSectionKey);
            Debug.Assert(configurationSection.Exists());

            WebProjectSettings? frontend = configurationSection.Get<WebProjectSettings>();
            Debug.Assert(frontend != null);

            string path = frontend.FrontendPath;
            string currDir = Environment.CurrentDirectory;

            if (!Path.IsPathRooted(path))
            {
                path = Path.GetFullPath(path, currDir);
            }

            return path;
        }
        private static async Task BuildTailwind()
        {

            string? folderPath = GetProjectRootPath();
            Debug.Assert(folderPath != null);

            string fontendPath = Path.Combine(folderPath, "Frontend");
            string cssPath = Path.Combine(folderPath, "Frontend", "css");

            string[] args = [
                "tailwindcss",
                "-i","./css/style.css",
                "-o","./css/style-output.css",
                "--cwd" , fontendPath
                ];

            ProcessStartInfo startInfo = new ProcessStartInfo($"bunx", args);
            startInfo.WorkingDirectory = fontendPath;
            startInfo.UseShellExecute = false;
            startInfo.RedirectStandardOutput = true;
            startInfo.RedirectStandardError = true;

            using (Process? bunProcess = Process.Start(startInfo))
            {
                Debug.Assert(bunProcess != null);

                Task[] tasks =
                [
                    Task.Delay(1000),
                ];

                await bunProcess.WaitForExitAsync();

                string str = await bunProcess.StandardOutput.ReadToEndAsync();
                string err = await bunProcess.StandardError.ReadToEndAsync();
            }
        }
        private static async Task BuildTypescript()
        {
            string? frontendPath = GetFrontendPath();
            Debug.Assert(frontendPath != null);

            string inputScript = Path.Combine(frontendPath, "project", "index.ts");
            string outputScript = Path.Combine(frontendPath, "index.js");

            string[] args = [
                "build",
                inputScript
                ];

            ProcessStartInfo startInfo = new ProcessStartInfo($"bun", args);
            startInfo.Verb = "runas";
            startInfo.UseShellExecute = false;
            startInfo.RedirectStandardOutput = true;
            startInfo.RedirectStandardError = true;

            using (Process? bunProcess = Process.Start(startInfo))
            using (FileStream fs = File.Open(outputScript, FileMode.OpenOrCreate, FileAccess.ReadWrite))
            using (StreamWriter sw = new StreamWriter(fs))
            {
                Debug.Assert(bunProcess != null);

                Task[] tasks =
                [
                    Task.Delay(250),
                    bunProcess.WaitForExitAsync()
                ];

                await Task.WhenAny(tasks);

                string scriptContent = await bunProcess.StandardOutput.ReadToEndAsync();
                string err = await bunProcess.StandardError.ReadToEndAsync();

                fs.Position = 0;
                fs.SetLength(scriptContent.Length);

                await sw.WriteAsync(scriptContent);
            }
        }
        private static WebApplication? CreateServer(string[] args)
        {
            string folderPath = GetProjectRootPath();
            Debug.Assert(folderPath != null);

            string frontendPath = GetFrontendPath();
            Debug.Assert(frontendPath != null);

            WebApplicationOptions options = new WebApplicationOptions()
            {
                Args = args,
                WebRootPath = frontendPath,
                ContentRootPath = frontendPath,
            };

            WebApplicationBuilder builder = WebApplication.CreateBuilder(options);
            builder.Services.Configure<IOptions<WebProjectSettings>>(appConfig);

            WebApplication app = builder.Build();

            // redirections to index
            {
                DefaultFilesOptions defaultFileOptions = new DefaultFilesOptions();
                defaultFileOptions.DefaultFileNames.Add("index.html");

                app.UseDefaultFiles(defaultFileOptions);
            }

            // direct resource request folders
            string[] foldersToServe =
            [
                "node_modules",
                "css",
                "res"
            ];

            foreach (string f in foldersToServe)
            {
                string path = Path.Combine(frontendPath, f);
                PhysicalFileProvider provider = new PhysicalFileProvider(path);
                StaticFileOptions fileServingOptions = new StaticFileOptions()
                {
                    FileProvider = provider,
                    RequestPath = $"/{f}"
                };

                app.UseStaticFiles(fileServingOptions);
            }

            // tempates routing
            app.UseTemplateHtmlRouter(Path.Combine(frontendPath, "project"));

            // js routing
            app.UseJavascriptsRouter("/index.js", Path.Combine(frontendPath, "index.js"));
            app.UseJavascriptsRouter("/hot-reloading.js", Path.Combine(frontendPath, "hot-reloading.js"));

            // index routing
            // All the routes included in the list should server index.html
            {
                string[] routes = new string[]
                {
                    "/index.html",
                    "/index",
                    "/blogs"
                };

                app.UseHtmlRouter(routes, Path.Combine(frontendPath, "index.html"));
            }
            return app;
        }
        private static void HandleChanged(object sender, FileSystemEventArgs e)
        {
            Task.Run(async () =>
            {
                Console.WriteLine($"Change detected {e.FullPath} , Changed");

                await BuildTypescript();
                await BuildTailwind();

                socketserver.WebSocketServices.Broadcast("Server changed , please refresh");
            });
        }



    }
}