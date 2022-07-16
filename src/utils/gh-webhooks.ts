import prisma from "@/db/client";
import { PullRequestWebhook } from "@/interfaces/gh-webhooks";
import {
  buildPrMessage,
  editMessage,
  sendMessage,
} from "./discord-bot-messages";

export const handleWebhook = async (payload: PullRequestWebhook) => {
  // Check if repo exists or has subscribers
  const repo = await prisma.repo.findUnique({
    where: {
      name: payload.repository.name,
    },
    select: {
      id: true,
      channels: { select: { id: true } },
    },
  });
  if (!repo || repo.channels.length === 0) return;

  // Create pr if it doesn't exist
  const pr = await prisma.pr.upsert({
    where: {
      githubId: payload.pull_request.id,
    },
    create: {
      githubId: payload.pull_request.id,
      repoId: repo.id,
    },
    update: {},
  });

  // Get subscribed channels
  const channels = await prisma.channel.findMany({
    where: {
      id: {
        in: repo.channels.map((channel) => channel.id),
      },
    },
    select: {
      id: true,
      discordId: true,
      messages: {
        select: { discordId: true },
        where: { prId: { equals: pr.id } },
      },
    },
  });
  if (!channels) return;

  // Get channels with or without messages
  const [channelsWithMsg, channelsWithoutMsg] = channels.reduce(
    ([withMsg, withoutMsg], channel) => {
      if (channel.messages.length > 0) {
        withMsg.push(channel);
      } else {
        withoutMsg.push(channel);
      }
      return [withMsg, withoutMsg];
    },
    [[], []] as [typeof channels, typeof channels]
  );

  // Form message content
  const content = buildPrMessage(payload);

  // Send all messages
  const results = await Promise.all([
    ...channelsWithMsg.map(async (channel) => {
      try {
        await editMessage({
          channelDiscordId: channel.discordId,
          messageDiscordId: channel.messages[0].discordId,
          content,
        });
      } catch (e) {
        console.error(e);
        return {
          channel,
          type: "EDIT",
          error: e,
        };
      }
    }),
    ...channelsWithoutMsg.map(async (channel) => {
      try {
        const message = await sendMessage({
          channelDiscordId: channel.discordId,
          content,
        });
        await prisma.message.create({
          data: {
            discordId: BigInt(message.id),
            prId: pr.id,
            channelId: channel.id,
          },
        });
      } catch (e) {
        console.error(e);
        return {
          channel,
          type: "SEND",
          error: e,
        };
      }
    }),
  ]);

  // Send new message to failed channelsWithMsg
  const failedChannelsWithMsg = results.filter(
    (
      result
    ): result is {
      channel: typeof channels[number];
      type: "EDIT";
      error: unknown;
    } => result !== undefined && result.type === "EDIT"
  );
  const failedChannelsWithMsgResults = await Promise.all(
    failedChannelsWithMsg.map(async (result) => {
      try {
        const message = await sendMessage({
          channelDiscordId: result.channel.discordId,
          content,
        });
        await prisma.message.create({
          data: {
            discordId: BigInt(message.id),
            prId: pr.id,
            channelId: result.channel.id,
          },
        });
      } catch (e) {
        console.error(e);
        return {
          channel: result.channel,
          type: "SEND",
          error: e,
        };
      }
    })
  );
  const failedAgainChannelsWithMsgResults = failedChannelsWithMsgResults.filter(
    (result) => result !== undefined
  );

  // Handle failed channelsWithoutMsg
  const failedChannelsWithoutMsg = [
    ...results.filter(
      (
        result
      ): result is {
        channel: typeof channels[number];
        type: "SEND";
        error: unknown;
      } => result !== undefined && result.type === "SEND"
    ),
    ...failedAgainChannelsWithMsgResults.filter(
      (
        result
      ): result is {
        channel: typeof channels[number];
        type: "SEND";
        error: unknown;
      } => result !== undefined
    ),
  ];

  return failedChannelsWithoutMsg;
};
