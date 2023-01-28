// taken and adapted from create-t3-app
import {z, ZodFormattedError} from "zod";
import dotenv from "dotenv";
import {zh} from "./lib/util/zod-helper";
import {color} from "./lib/util/console-helper";

// Load .env file into `process.env`
dotenv.config();

/**
 * Specify your environment variables schema here.
 * This way you can ensure the app isn't built with invalid env vars.
 */
export const envSchema = z.object({
    PG_URI: zh.nonEmtpyString(),
    MONGODB_URI: zh.nonEmtpyString().optional(),
    FBASE_SERVICE: zh.nonEmtpyString(),
    PATREON_TOKEN: zh.nonEmtpyString(),
    CAMPAIGN_ID: zh.nonEmtpyString(),
    OF_PATREON_TOKEN: zh.nonEmtpyString(),
    OF_CAMPAIGN_ID: zh.nonEmtpyString(),
});

// Parse `process.env` into a strongly typed object
const _env = envSchema.safeParse(process.env);

if (!_env.success) {
    console.error(
        color`❌ ${"red"}Invalid environment variables:${'reset'}\n`,
        ...formatErrors(_env.error.format()),
    );
    process.exit(1);
}

export const env = {..._env.data};

function formatErrors(errors: ZodFormattedError<Map<string, string>>) {
    return Object.entries(errors)
        .map(([name, value]) => {
            if (value && "_errors" in value)
                return color`${'lightblue'}${name}${'blue'} => ${'red'}${value._errors.join(", ")}${'reset'}\n`;
        })
        .filter(Boolean);
}
