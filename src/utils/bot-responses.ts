import { capitalizeFirstLetter } from "./strings";

type Resource = "organization" | "repo" | "user";

export const VALIDATION_FAILED = "🙃 Invalid input, please try again";

export const CHANNEL_NOT_REGISTERED =
  "❌ Channel not registered. Please go ahead and register it first";

export const CHANNEL_ALREADY_REGISTERED =
  "❌ Channel is already registered. If you lost the token, you can regenerate it with `/channel regenerate-token`";

export const CHANNEL_REGISTERED = "✅ Channel registered";

export const TOKEN_UPDATED = "✅ Token updated";

export const SECRET_TOKEN_CREATED = (token: string) =>
  `🔒 Token created. Please store it safely as it can't be recovered\n\`\`\`${token}\`\`\``;

export const SECRET_TOKEN_UPDATED = (token: string) =>
  `🔒 Token updated. Please store it safely as it can't be recovered\n\`\`\`${token}\`\`\``;

export const RESOURCE_ALREADY_EXISTS = (resource: Resource) =>
  `❌ ${capitalizeFirstLetter(resource)} already exists`;

export const RESOURCE_NOT_FOUND = (resource: Resource) =>
  `❌ ${capitalizeFirstLetter(resource)} not found`;

export const RESOURCE_LIST = (
  resource: Resource,
  list: string[]
) =>
  `🔎 ${capitalizeFirstLetter(resource)}s found:\n${list
    .map((item) => `    -  ${item}`)
    .join("\n")}`;

export const RESOURCE_LIST_EMPTY = (resource: Resource) =>
  `😢 No ${resource}s found`;

export const RESOURCE_ADDED = (resource: Resource, name: string) =>
  `✅ New ${resource} registered \`${name}\``;

export const RESOURCE_DELETED = (resource: Resource, name: string) =>
  `✅ ${capitalizeFirstLetter(resource)} \`${name}\` deleted from this channel`;
