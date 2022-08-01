import prisma from "@/db/client";
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
import { ghRepoUserOrganizationSchema } from "./schemas";

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
          repoName = await ghRepoUserOrganizationSchema.validateAsync(
            interaction.options.getString("name", true)
          );
        } catch (error) {
          interaction.editReply(VALIDATION_FAILED);
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
          await interaction.editReply(RESOURCE_ALREADY_EXISTS("repo"));
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

        await interaction.editReply(RESOURCE_ADDED("repo", repoName));
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
          await interaction.editReply(RESOURCE_LIST_EMPTY("repo"));
          return;
        }

        await interaction.editReply(
          RESOURCE_LIST(
            "repo",
            channel.repos.map((repo) => repo.name)
          )
        );
      },
    },

    [SUBCOMMAND_DELETE]: {
      execute: async (interaction) => {
        const channelDiscordId = BigInt(interaction.channelId);

        let repoName: string;
        try {
          repoName = await ghRepoUserOrganizationSchema.validateAsync(
            interaction.options.getString("name", true)
          );
        } catch (error) {
          interaction.editReply(VALIDATION_FAILED);
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
          await interaction.editReply(RESOURCE_NOT_FOUND("repo"));
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
        await interaction.editReply(RESOURCE_DELETED("repo", repoName));
      },
    },
  },
});

export default Command;
