import {z} from "zod";

const nonEmtpyString = (message = "Must not be empty!") => z.string().trim().min(1, message);

export const zh = {nonEmtpyString};