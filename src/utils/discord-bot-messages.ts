import { client } from "@/bot";
import { PullRequestWebhook } from "@/interfaces/gh-webhooks";
import { TextChannel } from "discord.js";

export const sendMessage = async ({
  channelDiscordId,
  content,
}: {
  channelDiscordId: BigInt;
  content: string;
}) => {
  const channel = await getChannel(channelDiscordId);
  return await channel.send(content);
};

export const editMessage = async ({
  messageDiscordId,
  channelDiscordId,
  content,
}: {
  messageDiscordId: BigInt;
  channelDiscordId: BigInt;
  content: string;
}) => {
  const channel = await getChannel(channelDiscordId);
  const message = await getMessage(messageDiscordId, channel);
  return await message.edit(content);
};

export const buildPrMessage = (payload: PullRequestWebhook) => {
  const {
    pull_request: { title, body, assignees, requested_reviewers },
    repository: { name },
  } = payload;

  const assigneesStr = assignees.map((assignee) => assignee.login).join(", ");
  const reviewersStr = requested_reviewers
    .map((reviewer) => reviewer.login)
    .join(", ");

  return `${name}: ${title}
${body}

Assignees: ${assigneesStr}
Reviewers: ${reviewersStr}`;
};

const getChannel = async (channelDiscordId: BigInt) => {
  const channel = (await client.channels.fetch(
    channelDiscordId.toString()
  )) as TextChannel;
  if (!channel) throw new Error("Channel not found");
  return channel;
};

const getMessage = async (messageDiscordId: BigInt, channel: TextChannel) => {
  const message = await channel.messages.fetch(messageDiscordId.toString());
  if (!message) throw new Error("Message not found");
  return message;
}
