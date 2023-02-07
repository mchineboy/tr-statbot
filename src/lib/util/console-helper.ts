const colorMarkers = ["black", "red", "green", "orange", "blue", "lightblue", "pink", "reset"] as const;

/**
 * template literal function for coloring parts of console output using coloration markers <br>
 * Usage: dye\`Default ${"red"} This is Red ${"green"} Green numbers: ${420} ${"reset"} And this is ${"back"} to normal.
 * ${stringOrNumberVariable} can be included as well.\`
 * @param strings an array of all the substrings that come before, after and between args, in order
 * @param args can be either numbers, arbitrary strings or {@link ColorMarker}, marking the start of coloration.
 * the 'reset' marker will remove coloring, enabling you to colorize certain parts of the template string
 * (including other interpolated values)
 */
export function dye(strings: TemplateStringsArray, ...args: (ColorMarker | string | number | boolean)[]) {
  if (!args.length) {
    return strings.reduce((prev, cur) => prev + cur);
  }

  let res = "";
  let marked = false;
  strings.forEach((str, i) => {
    const arg = args[i];

    if (colorMarkers.includes(arg as ColorMarker)) {
      res += str + getMarkerByName(arg as ColorMarker);
      marked = true;
      return;
    }
    res += str + (arg?.toString() ?? "");
  });

  return marked ? res + getMarkerByName("reset") : res;
}

export const formatCaller = (caller: string) => dye`${"lightblue"}[${caller}]`;

export const logFormattedMessage = (logger: AllowedConsoleFuncton, caller: string, message: string, prefix = " ") =>
  logger(`${prefix} ${formatCaller(caller)} ${message}`);

export const formatLog: LogFormatter = (caller, message, prefix = "📜") =>
  logFormattedMessage(console.log, caller, message, prefix);

export const formatInfo: LogFormatter = (caller, message, prefix = "ℹ️") =>
  logFormattedMessage(console.info, caller, message, prefix);

export const formatDebug: LogFormatter = (caller, message, prefix = "🪲") =>
  logFormattedMessage(console.debug, caller, message, prefix);

export const formatWarn: LogFormatter = (caller, message, prefix = "⚠️") =>
  logFormattedMessage(console.warn, caller, dye`${"orange"}${message}`, prefix);

export const formatError: LogFormatter = (caller, message, prefix = "❌") =>
  logFormattedMessage(console.error, caller, dye`${"red"}${message}`, prefix);

export const formatTrace: LogFormatter = (caller, message, prefix = "") =>
  logFormattedMessage(console.trace, caller, message, prefix);

export class Logger {
  public log: NamedLogFormatter;
  public info: NamedLogFormatter;
  public debug: NamedLogFormatter;
  public warn: NamedLogFormatter;
  public error: NamedLogFormatter;
  public trace: NamedLogFormatter;

  constructor(name: string) {
    this.log = (message, prefix?) => formatLog(name, message, prefix);
    this.info = (message, prefix?) => formatInfo(name, message, prefix);
    this.debug = (message, prefix?) => formatDebug(name, message, prefix);
    this.warn = (message, prefix?) => formatWarn(name, message, prefix);
    this.error = (message, prefix?) => formatError(name, message, prefix);
    this.trace = (message, prefix?) => formatTrace(name, message, prefix);
  }
}

function getMarkerByName(marker: ColorMarker) {
  switch (marker) {
    case "black":
      return "\x1b[30m";
    case "red":
      return "\x1b[31m";
    case "green":
      return "\x1b[32m";
    case "orange":
      return "\x1b[33m";
    case "blue":
      return "\x1b[34m";
    case "pink":
      return "\x1b[35m";
    case "lightblue":
      return "\x1b[36m";
    case "reset":
      return "\x1b[0m";
    default:
      return "";
  }
}

type ColorMarker = (typeof colorMarkers)[number];

type AllowedLoggerFunction = "trace" | "warn" | "log" | "info" | "group" | "groupCollapsed" | "error" | "debug";

type AllowedConsoleFunctionRecord = Pick<typeof console, AllowedLoggerFunction>;

type AllowedConsoleFuncton = AllowedConsoleFunctionRecord[keyof AllowedConsoleFunctionRecord];

type NamedLogFormatter = (message: string, prefix?: string) => void;
type LogFormatter = (caller: string, message: string, prefix?: string) => void;
