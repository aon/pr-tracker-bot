import { PullRequestWebhook } from "@/interfaces/gh-webhooks";

export const handleWebhook = async (payload: PullRequestWebhook) => {
  console.log(payload);
};
