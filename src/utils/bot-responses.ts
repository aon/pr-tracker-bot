import { capitalizeFirstLetter } from "./strings";

export const VALIDATION_FAILED = "🙃 Invalid input, please try again";
export const RESOURCE_ALREADY_EXISTS = (name: string) =>
  `❌ ${capitalizeFirstLetter(name)} already exists`;
