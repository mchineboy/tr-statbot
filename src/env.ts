// taken and adapted from create-t3-app
import { z, ZodFormattedError } from "zod";
import dotenv from "dotenv";
import { expand } from "dotenv-expand";
import { zh } from "./lib/util/zod-helper";
import { dye } from "./lib/util/console-helper";

// Load .env file into `process.env`
dotenv.config();

/**
 * Specify your environment variables schema here.
 * This way you can ensure the app isn't built with invalid env vars.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]),
  PG_URI: zh.string().nonEmpty().url("Must be a valid URL!"),
  FBASE_SERVICE: zh.string().nonEmpty(),
  PATREON_TOKEN: zh.string().nonEmpty(),
  CAMPAIGN_ID: zh.string().nonEmpty(),
  OF_PATREON_TOKEN: zh.string().nonEmpty(),
  OF_CAMPAIGN_ID: zh.string().nonEmpty(),
});

// expand variable references in .env variables
// eslint-disable-next-line no-process-env
const expandedEnv = expand({ parsed: process.env as Record<string, string> });

if (expandedEnv.error) {
  fail(expandedEnv.error.message);
}

// Parse `process.env` into a strongly typed object
const _env = envSchema.safeParse(expandedEnv.parsed);

if (!_env.success) {
  fail(...formatErrors(_env.error.format()));
}

try {
  JSON.parse(_env.data.FBASE_SERVICE);
} catch (e) {
  fail(getInvalidVariableSummary("FBASE_SERVICE", [(e as Error).message]));
}

export const env = { ..._env.data };

function fail(...formattedErrors: string[]): never {
  console.error(dye`❌ ${"red"}Invalid environment variables:${"reset"}\n`, ...formattedErrors);
  process.exit(1);
}

function formatErrors(errors: ZodFormattedError<Map<string, string>>) {
  return Object.entries(errors)
    .map(([name, value]) => {
      if (value && "_errors" in value) {
        return getInvalidVariableSummary(name, value._errors);
      }
    })
    .filter(Boolean) as string[];
}

function getInvalidVariableSummary(name: string, errors: string[]) {
  return dye`${"lightblue"}${name}${"blue"} => ${"red"}${errors.join(", ")}\n`;
}
