using System.Text.Json;
using LineGen;
using Scriban;
using Scriban.Runtime;

static string ProjectRoot()
{
    var configured = Environment.GetEnvironmentVariable("CODEGENKIT_ROOT");
    var root = Path.GetFullPath(string.IsNullOrWhiteSpace(configured) ? Directory.GetCurrentDirectory() : configured);
    if (!Directory.Exists(root))
        throw new DirectoryNotFoundException($"CODEGENKIT_ROOT not found: {root}");
    return root;
}

static string UnderRoot(string root, string path, string label)
{
    var full = Path.GetFullPath(path, root);
    var relative = Path.GetRelativePath(root, full);
    if (relative == ".." || relative.StartsWith($"..{Path.DirectorySeparatorChar}") || Path.IsPathRooted(relative))
        throw new InvalidOperationException($"{label} must be inside CODEGENKIT_ROOT: {full}");
    return full;
}

static (Dictionary<string, object?> spec, string specPath, string featureDir) ReadSpec(string root, string specArg)
{
    var specPath = UnderRoot(root, specArg, "spec");
    var spec = YamlMap.Load(specPath);
    var clients = YamlMap.GetDict(spec, "clients");
    if (!clients.ContainsKey("line"))
        throw new ArgumentException("spec missing clients.line block");
    var featureDir = specPath.Contains($"{Path.DirectorySeparatorChar}ir{Path.DirectorySeparatorChar}")
        ? Path.GetDirectoryName(Path.GetDirectoryName(specPath))!
        : Path.GetDirectoryName(specPath)!;
    return (spec, specPath, featureDir);
}

static List<(string RelativePath, string Template)> BuildPlan(LineContext context)
{
    var screen = context.ScreenPascal;
    var basePath = $"src/Line.App/Generated/{screen}";
    return
    [
        ($"{basePath}/I{screen}Service.cs", "service_interface.cs.scriban"),
        ($"{basePath}/{screen}Service.gen.cs", "service.cs.scriban"),
        ($"{basePath}/{screen}ViewModel.gen.cs", "view_model.cs.scriban"),
        ($"tests/Line.App.Tests/Generated/{screen}ViewModelTests.gen.cs", "view_model_test.cs.scriban"),
    ];
}

static int Registry(string root)
{
    Console.WriteLine(File.ReadAllText(Path.Combine(root, "registries", "dotnet-line.codegen.registry.json")));
    return 0;
}

static int Run(string root, string command, string specArg, bool force)
{
    var dryRun = command == "dry";
    var (spec, specPath, featureDir) = ReadSpec(root, specArg);
    var context = LineContext.FromSpec(spec);
    var written = new List<string>();
    Console.WriteLine($"line-gen: screen={context.ScreenPascal} profile={context.Profile}");
    Console.WriteLine($"  spec: {specPath}");

    foreach (var (relative, template) in BuildPlan(context))
    {
        var destination = UnderRoot(root, relative, "output");
        if (File.Exists(destination) && !force)
        {
            Console.WriteLine($"  skip: {relative} (exists)");
            continue;
        }
        var content = TemplateRenderer.Render(template, context.ToTemplateModel());
        if (dryRun) Console.WriteLine($"  [dry]: {relative}");
        else
        {
            Directory.CreateDirectory(Path.GetDirectoryName(destination)!);
            File.WriteAllText(destination, content);
            Console.WriteLine($"  write: {relative}");
        }
        written.Add(relative);
    }

    if (!dryRun)
    {
        var generatedDir = UnderRoot(root, Path.Combine(featureDir, "generated"), "generated metadata");
        Directory.CreateDirectory(generatedDir);
        var manifestPath = Path.Combine(generatedDir, "line.manifest.json");
        File.WriteAllText(manifestPath, JsonSerializer.Serialize(new
        {
            generatedAt = DateTime.UtcNow.ToString("o"),
            spec = Path.GetRelativePath(root, specPath).Replace('\\', '/'),
            profile = context.Profile,
            screen = context.ScreenPascal,
            files = written,
        }, new JsonSerializerOptions { WriteIndented = true }));
        var handoff = new ScriptObject();
        handoff.Import(context.ToTemplateModel(), renamer: member => member.Name);
        handoff["spec_path"] = specPath;
        handoff["files"] = written;
        var handoffContext = new TemplateContext();
        handoffContext.PushGlobal(handoff);
        var handoffTemplate = Template.Parse(File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "Templates", "handoff.md.scriban")));
        File.WriteAllText(Path.Combine(generatedDir, "LINE-HANDOFF.md"), handoffTemplate.Render(handoffContext));
        Console.WriteLine($"  manifest: {manifestPath}");
    }
    return 0;
}

static List<string> ResolveSpecPaths(string root, string? specArg, string? idArg)
{
    if (specArg is not null) return [specArg];
    if (idArg is null) throw new InvalidOperationException("Either --spec or --id must be provided");

    var dir = new DirectoryInfo(AppContext.BaseDirectory);
    while (dir != null && dir.Name != "adapters")
    {
        dir = dir.Parent;
    }
    if (dir == null) throw new Exception("Could not locate adapters directory");
    var scriptPath = Path.Combine(dir.FullName, "shared", "resolve-cli.mjs");

    var process = new System.Diagnostics.Process
    {
        StartInfo = new System.Diagnostics.ProcessStartInfo
        {
            FileName = "node",
            Arguments = $"\"{scriptPath}\" \"{root}\" \"{idArg}\" codegen",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        }
    };
    process.Start();
    var output = process.StandardOutput.ReadToEnd();
    process.WaitForExit();
    if (process.ExitCode != 0)
    {
        throw new Exception($"Failed to resolve ID {idArg}: {process.StandardError.ReadToEnd()}");
    }
    using var doc = JsonDocument.Parse(output);
    var rootObj = doc.RootElement;
    if (!rootObj.GetProperty("success").GetBoolean())
    {
        throw new Exception($"Failed to resolve ID {idArg}: {rootObj.GetProperty("error").GetString()}");
    }
    
    var paths = rootObj.GetProperty("paths").EnumerateArray().Select(x => x.GetString()!).ToList();
    var notes = rootObj.GetProperty("notes").EnumerateArray().Select(x => x.GetString()!).ToList();
    var kind = rootObj.GetProperty("kind").GetString();

    foreach (var note in notes) Console.WriteLine($"  note: {note}");
    if (paths.Count == 0) throw new Exception($"--id {idArg}: no codegen specs");
    Console.WriteLine($"line-gen: --id {idArg} -> {paths.Count} spec(s) ({kind})");
    return paths;
}

if (args.Length == 0)
{
    Console.Error.WriteLine("Usage: LineGen registry | dry --spec <path> | write --spec <path> [--force]");
    return 1;
}

try
{
    var root = ProjectRoot();
    var force = args.Contains("--force");
    var specIndex = Array.IndexOf(args, "--spec");
    var specPath = specIndex >= 0 && specIndex + 1 < args.Length ? args[specIndex + 1] : null;
    var idIndex = Array.IndexOf(args, "--id");
    var idArg = idIndex >= 0 && idIndex + 1 < args.Length ? args[idIndex + 1] : null;
    
    if (args[0] == "registry") return Registry(root);
    if (args[0] == "dry" || args[0] == "write")
    {
        var paths = ResolveSpecPaths(root, specPath, idArg);
        if (paths.Count > 1) Console.WriteLine($"line-gen: {paths.Count} spec(s) to process");
        var failed = 0;
        foreach (var path in paths)
        {
            try
            {
                Run(root, args[0], path, force);
                if (paths.Count > 1) Console.WriteLine("");
            }
            catch (Exception e)
            {
                failed++;
                Console.Error.WriteLine($"line-gen: FAIL {path}: {e.Message}");
            }
        }
        return failed > 0 ? 1 : 0;
    }
    return 1;
}
catch (Exception error)
{
    Console.Error.WriteLine($"LineGen: {error.Message}");
    return 1;
}
