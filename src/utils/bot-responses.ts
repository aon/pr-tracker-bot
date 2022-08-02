import { capitalizeFirstLetter } from "./strings";

type Resource = "organization" | "repo" | "user";
export type ResponseContent = (...args: any[]) => {
  title: string;
  description?: string;
};

export const VALIDATION_FAILED = () => ({
  title: "🙃 Invalid input, please try again",
});

export const RESOURCE_ALREADY_EXISTS = (resource: Resource) => ({
  title: `❌ ${capitalizeFirstLetter(resource)} already exists`,
});

export const RESOURCE_NOT_FOUND = (resource: Resource) => ({
  title: `❌ ${capitalizeFirstLetter(resource)} not found`,
});

export const RESOURCE_LIST = (resource: Resource, list: string[]) => ({
  title: `🔎 ${capitalizeFirstLetter(resource)}s found:`,
  description: `${list.map((item) => `    -  \`${item}\``).join("\n")}`,
});

export const RESOURCE_LIST_EMPTY = (resource: Resource) => ({
  title: `😢 No ${resource}s found`,
});

export const RESOURCE_ADDED = (resource: Resource, name: string) => ({
  title: `✅ New ${resource} registered \`${name}\``,
});

export const RESOURCE_DELETED = (resource: Resource, name: string) => ({
  title: `✅ ${capitalizeFirstLetter(
    resource
  )} \`${name}\` deleted from this channel`,
});
