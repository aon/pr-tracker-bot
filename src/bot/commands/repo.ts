import prisma from "@/db/client";
import { inlineCode } from "@/utils/bot-messages";
import Response from "@/utils/bot-response-helper";
import {
  RESOURCE_ADDED,
  RESOURCE_ALREADY_EXISTS,
  RESOURCE_DELETED,
  RESOURCE_LIST,
  RESOURCE_LIST_EMPTY,
  RESOURCE_NOT_FOUND,
  VALIDATION_FAILED,
} from "@/utils/bot-responses";
import { buildSlashCommandSubCommandsOnly } from "@/utils/bot-slash-commands";
import { SlashCommandBuilder } from "@discordjs/builders";
import { ghRepoSchema } from "./schemas";

const SUBCOMMAND_ADD = "add";
const SUBCOMMAND_LIST = "list";
const SUBCOMMAND_DELETE = "delete";

const Command = buildSlashCommandSubCommandsOnly({
  data: new SlashCommandBuilder()
    .setName("repo")
    .setDescription("Handle subscribed repos")
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SUBCOMMAND_ADD)
        .setDescription("Add a new repo to subscribe to on this channel")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription(
              "Complete repo name as in <user or organization>/<repo>"
            )
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SUBCOMMAND_LIST)
        .setDescription("List subscribed repos on this channel")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SUBCOMMAND_DELETE)
        .setDescription("Delete repo subscription from this channel")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("Complete repo name as in `<user>/<repo>`")
            .setRequired(true)
        )
    ),
  subcommands: {
    [SUBCOMMAND_ADD]: {
      execute: async (interaction) => {
        // Validate input
        let repoName: string;
        try {
          repoName = await ghRepoSchema.validateAsync(
            interaction.options.getString("name", true)
          );
        } catch (error) {
          await new Response(interaction).setCommon(VALIDATION_FAILED).send();
          return;
        }

        const channelDiscordId = BigInt(interaction.channelId);
        const guildDiscordId = BigInt(interaction.guildId);

        // Check if repo exists attached to this channel
        const repo = await prisma.repo.findFirst({
          where: {
            name: repoName,
            channels: { some: { discordId: channelDiscordId } },
          },
          select: { id: true },
        });
        if (repo) {
          await new Response(interaction)
            .setCommon(RESOURCE_ALREADY_EXISTS, "repo", inlineCode(repoName))
            .send();
          return;
        }

        // Add or update repo subscription
        const channel = [
          {
            where: { discordId: channelDiscordId },
            create: {
              discordId: channelDiscordId,
              guild: {
                connectOrCreate: {
                  where: { discordId: guildDiscordId },
                  create: { discordId: guildDiscordId },
                },
              },
            },
          },
        ];
        await prisma.repo.upsert({
          where: { name: repoName },
          update: { channels: { connectOrCreate: channel } },
          create: {
            name: repoName,
            channels: { connectOrCreate: channel },
          },
        });

        await new Response(interaction)
          .setCommon(RESOURCE_ADDED, "repo", inlineCode(repoName))
          .send();
      },
    },

    [SUBCOMMAND_LIST]: {
      execute: async (interaction) => {
        const channelDiscordId = BigInt(interaction.channelId);

        const channel = await prisma.channel.findUnique({
          where: { discordId: channelDiscordId },
          select: { repos: { select: { name: true } } },
        });

        if (!channel || channel.repos.length === 0) {
          await new Response(interaction)
            .setCommon(RESOURCE_LIST_EMPTY, "repo")
            .send();
          return;
        }

        await new Response(interaction)
          .setCommon(
            RESOURCE_LIST,
            "repo",
            channel.repos.map((repo) => inlineCode(repo.name))
          )
          .send();
      },
    },

    [SUBCOMMAND_DELETE]: {
      execute: async (interaction) => {
        const channelDiscordId = BigInt(interaction.channelId);

        let repoName: string;
        try {
          repoName = await ghRepoSchema.validateAsync(
            interaction.options.getString("name", true)
          );
        } catch (error) {
          await new Response(interaction).setCommon(VALIDATION_FAILED).send();
          return;
        }

        const repo = await prisma.repo.findFirst({
          where: {
            name: repoName,
            channels: { some: { discordId: channelDiscordId } },
          },
          select: { id: true, channels: { select: { id: true } } },
        });
        if (!repo) {
          await new Response(interaction)
            .setCommon(RESOURCE_NOT_FOUND, "repo", inlineCode(repoName))
            .send();
          return;
        }

        await prisma.repo.update({
          where: { id: repo.id },
          data: {
            channels: {
              disconnect: { discordId: channelDiscordId },
            },
          },
        });
        await new Response(interaction)
          .setCommon(RESOURCE_DELETED, "repo", inlineCode(repoName))
          .send();
      },
    },
  },
});

export default Command;
