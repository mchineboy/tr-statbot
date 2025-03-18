import { z } from "zod";

const nonEmptyString = (message = "Must not be empty!") =>
  z.string({ required_error: message }).trim().min(1, message);

const emptyString = () => z.literal("");

const urlOrEmptyString = () => z.string().url().or(emptyString());

export const zh = {
  string: () => ({ nonEmpty: nonEmptyString, empty: emptyString, urlOrEmpty: urlOrEmptyString }),
};