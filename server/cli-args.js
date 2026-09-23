const help = `NanoPM Studio

Usage:
  nanopm-studio [project] [options]

Options:
  --project <path>  Open a NanoPM project (overrides remembered project)
  --port <port>     Bind a specific port on 127.0.0.1 (0 chooses a free port)
  --no-open         Do not open the browser
  --json            Print the ready event as one JSON line
  -h, --help        Show this help
`;

export function cliHelp() {
  return help;
}

export function parseCliArgs(args, env = process.env) {
  const result = {
    project: env.NANOPM_PROJECT || "",
    port: env.PORT === undefined ? 0 : parsePort(env.PORT, "PORT"),
    open: true,
    json: false,
    help: false,
  };
  let positional = "";
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === "-h" || value === "--help") result.help = true;
    else if (value === "--no-open") result.open = false;
    else if (value === "--json") result.json = true;
    else if (value === "--project") {
      result.project = requiredValue(args, ++index, "--project");
    } else if (value === "--port") {
      result.port = parsePort(requiredValue(args, ++index, "--port"), "--port");
    } else if (value.startsWith("-")) {
      throw new Error(`Unknown option: ${value}`);
    } else if (positional) {
      throw new Error("Only one positional project path is supported.");
    } else positional = value;
  }
  if (!args.includes("--project") && positional) result.project = positional;
  return result;
}

function requiredValue(args, index, option) {
  const value = args[index];
  if (!value || value.startsWith("-"))
    throw new Error(`${option} requires a value.`);
  return value;
}

function parsePort(value, source) {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 0 || port > 65535)
    throw new Error(`${source} must be an integer from 0 to 65535.`);
  return port;
}
