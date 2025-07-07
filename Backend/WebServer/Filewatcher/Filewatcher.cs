namespace WebServer.Filewatcher
{
    public class Filewatcher
    {
        private readonly string basePath;
        private readonly List<string> extensions;
        private readonly List<FileSystemWatcher> fileWatchers;
        public event Action<object , FileSystemEventArgs> OnFileChanged;

        public Filewatcher(string basePath, IEnumerable<string> extensions)
        {
            this.basePath = basePath;
            this.extensions = new List<string>(extensions);

            fileWatchers = new List<FileSystemWatcher>(this.extensions.Count);
        }

        public void Start()
        {
            foreach (string ext in extensions)
            {
                FileSystemWatcher watcher = new FileSystemWatcher(basePath);
                watcher.NotifyFilter = NotifyFilters.CreationTime
                                     | NotifyFilters.DirectoryName
                                     | NotifyFilters.FileName
                                     | NotifyFilters.LastWrite;
                watcher.EnableRaisingEvents = true;
                watcher.IncludeSubdirectories = true;
                watcher.Filter = $"*{ext}";

                watcher.Changed += HandleChage;

                fileWatchers.Add(watcher);
            }
        }

        private void HandleChage(object sender, FileSystemEventArgs e)
        {
            OnFileChanged?.Invoke(sender, e);
        }

        public void Stop()
        {
            foreach (FileSystemWatcher watcher in this.fileWatchers)
            {
                watcher.Dispose();
                watcher.Changed -= HandleChage;
            }

            fileWatchers.Clear();
        }
    }
}
