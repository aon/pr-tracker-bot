import { client } from "@/bot";
import prisma from "@/db/client";
import { User } from "@/interfaces/gh-base";
import { PullRequestWebhook } from "@/interfaces/gh-webhooks";
import { MessageEmbed, TextChannel } from "discord.js";
import { getEmbedColor } from "./embed-colors";

export const sendMessage = async ({
  channelDiscordId,
  content,
  embeds,
}: {
  channelDiscordId: BigInt;
  content?: string;
  embeds?: MessageEmbed[];
}) => {
  const channel = await getChannel(channelDiscordId);
  return await channel.send({ content, embeds });
};

export const editMessage = async ({
  messageDiscordId,
  channelDiscordId,
  content,
  embeds,
}: {
  messageDiscordId: BigInt;
  channelDiscordId: BigInt;
  content?: string;
  embeds?: MessageEmbed[];
}) => {
  const channel = await getChannel(channelDiscordId);
  const message = await getMessage(messageDiscordId, channel);
  return await message.edit({ content, embeds });
};

export const buildPrMessage = async (payload: PullRequestWebhook) => {
  const {
    pull_request: { title, body, assignees, requested_reviewers, number },
    repository: { full_name },
  } = payload;
  const usernames = [...assignees, ...requested_reviewers].map(
    (user) => user.login
  );
  const users = await prisma.user.findMany({
    where: {
      githubUser: {
        in: usernames,
      },
    },
    select: {
      discordId: true,
      githubUser: true,
    },
  });
  const usernameToDiscordId = users.reduce(
    (acc, user) => ({ ...acc, [user.githubUser]: user.discordId }),
    {} as { [username: string]: BigInt }
  );
  const assigneesList = getUserList(assignees, usernameToDiscordId);
  const reviewersList = getUserList(requested_reviewers, usernameToDiscordId);

  const embed = new MessageEmbed()
    .setColor(
      getEmbedColor(
        payload.pull_request.merged ? "merged" : payload.pull_request.state
      )
    )
    .setTitle(`${full_name} - ${title} - #${number}`)
    .setURL(payload.pull_request.html_url)
    .setAuthor({
      name: payload.sender.login,
      iconURL: payload.sender.avatar_url,
      url: payload.sender.html_url,
    })
    .setDescription(body || "*no description*")
    .addFields(
      { name: "\u200B", value: "\u200B", inline: true },
      {
        name: "🔧 Assignees",
        value:
          assigneesList.length === 0
            ? "*none*"
            : `${assigneesList
                .map((assignee) => `    - ${assignee}`)
                .join("\n")}`,
      },
      { name: "\u200B", value: "\u200B" },
      {
        name: "🧹 Pending reviewers",
        value:
          reviewersList.length === 0
            ? "*none*"
            : `${reviewersList
                .map((assignee) => `    - ${assignee}`)
                .join("\n")}`,
      },
      { name: "\u200B", value: "\u200B" }
    )
    .setTimestamp()
    .setFooter({
      text: payload.pull_request.merged
        ? `merged by ${payload.pull_request.merged_by.login}`
        : payload.pull_request.state,
    });
  return { embeds: [embed] };
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
};

export const mention = (discordId: BigInt) => {
  return `<@${discordId}>`;
};

export const inlineCode = (code: string) => {
  return `\`${code}\``;
};

const getUserList = (
  users: User[],
  usernameToDiscordId: { [username: string]: BigInt }
) => {
  return users.map((user) => {
    const discordId = usernameToDiscordId[user.login];
    return discordId ? mention(discordId) : user.login;
  });
};
