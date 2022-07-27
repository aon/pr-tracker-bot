import { capitalizeFirstLetter } from "./strings";

export const VALIDATION_FAILED = "🙃 Invalid input, please try again";
export const CHANNEL_NOT_REGISTERED =
  "❌ Channel not registered. Please go ahead and register it first.";
export const RESOURCE_ALREADY_EXISTS = (resource: "organization" | "repo") =>
  `❌ ${capitalizeFirstLetter(resource)} already exists`;
export const RESOURCE_NOT_FOUND = (resource: "organization" | "repo") =>
  `❌ ${capitalizeFirstLetter(resource)} not found`;
export const RESOURCE_LIST_EMPTY = (resource: "organization" | "repo") =>
  `😢 No ${resource}s found`;
export const RESOURCE_ADDED = (
  resource: "organization" | "repo",
  name: string
) => `✅ New ${resource} registered \`${name}\``;
