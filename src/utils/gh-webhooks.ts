import prisma from "@/db/client";
import { PullRequestWebhook } from "@/interfaces/gh-webhooks";
import { serverLogger as logger } from "@/logger";
import {
  buildPrMessage,
  editMessage,
  sendMessage,
} from "./bot-messages";

export const handleWebhook = async (payload: PullRequestWebhook) => {
  // Check if webhook is pull_request
  if (payload.pull_request === undefined) {
    throw new Error("webhook is not a pull request");
  }

  logger.info(
    {
      payload: {
        action: payload.action,
        repo: payload.repository.full_name,
        pullRequest: {
          number: payload.pull_request.number,
          title: payload.pull_request.title,
          state: payload.pull_request.state,
        },
      },
    },
    "handling webhook"
  );


  // Check if organization exists
  let organization = null;
  let repo = null;
  if (payload.organization !== undefined) {
    organization = await prisma.organization.findUnique({
      where: { name: payload.organization.login },
      select: { id: true },
    });
  }

  // Connect to repository
  if (organization) {
    repo = await prisma.repo.upsert({
      where: { name: payload.repository.full_name },
      update: {},
      create: {
        name: payload.repository.full_name,
        organization: { connect: { id: organization.id } },
      },
      select: { id: true },
    });
  }

  // Check if repo exists if wasn´t from organization
  if (!repo) {
    repo = await prisma.repo.findUnique({
      where: { name: payload.repository.full_name },
      select: { id: true },
    });
  }

  // If still no repo throw error
  if (!repo) {
    throw new Error("repo was not found");
  }

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
  const repoQuery = { repos: { some: { id: repo.id } } };
  const organizationQuery = {
    organizations: { some: { id: organization?.id } },
  };
  const channels = await prisma.channel.findMany({
    where: {
      OR: organization ? [repoQuery, organizationQuery] : [repoQuery],
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
  if (channels.length === 0) {
    throw new Error("repo has no subscribers");
  }

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

  // Form message
  const message = await buildPrMessage(payload);

  // Send all messages
  logger.info("sending messages");
  const results = await Promise.all([
    ...channelsWithMsg.map(async (channel) => {
      try {
        await editMessage({
          channelDiscordId: channel.discordId,
          messageDiscordId: channel.messages[0].discordId,
          ...message,
        });
      } catch (e) {
        logger.info("error editing message");
        logger.error(e);
        return {
          channel,
          type: "EDIT",
          error: e,
        };
      }
    }),
    ...channelsWithoutMsg.map(async (channel) => {
      try {
        const sentMessage = await sendMessage({
          channelDiscordId: channel.discordId,
          ...message,
        });
        await prisma.message.create({
          data: {
            discordId: BigInt(sentMessage.id),
            prId: pr.id,
            channelId: channel.id,
          },
        });
      } catch (e) {
        logger.info("error sending message");
        logger.error(e);
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
        const sentMessage = await sendMessage({
          channelDiscordId: result.channel.discordId,
          ...message,
        });
        await prisma.message.create({
          data: {
            discordId: BigInt(sentMessage.id),
            prId: pr.id,
            channelId: result.channel.id,
          },
        });
      } catch (e) {
        logger.info("error sending message");
        logger.warn(e);
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

  console.log(failedChannelsWithoutMsg);
  return failedChannelsWithoutMsg;
};
