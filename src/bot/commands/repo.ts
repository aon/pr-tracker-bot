import { SlashCommandBuilder } from "@discordjs/builders";
import { buildSlashCommandSubCommandsOnly } from "@/utils/bot-slash-commands";
import prisma from "@/db/client";
import { ghRepoUserOrganizationSchema } from "./schemas";
import {
  CHANNEL_NOT_REGISTERED,
  RESOURCE_ADDED,
  RESOURCE_ALREADY_EXISTS,
  VALIDATION_FAILED,
} from "@/utils/bot-responses";
import { isChannelExists } from "@/utils/bot-misc";

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
            .setDescription("Complete repo name as in `<user>/<repo>`")
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
        const channelDiscordId = BigInt(interaction.channelId);

        // Validate channel exists
        const channel = await isChannelExists(channelDiscordId);
        if (!channel) {
          interaction.editReply(CHANNEL_NOT_REGISTERED);
          return;
        }

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

        // Check if repo exists with channel
        const repo = await prisma.repo.findFirst({
          where: { name: repoName },
          select: { id: true, channels: { select: { discordId: true } } },
        });

        // Validate channel is not already subscribed to repo
        if (repo?.channels.includes({ discordId: channelDiscordId })) {
          await interaction.editReply(RESOURCE_ALREADY_EXISTS("repo"));
          return;
        }

        // If organization exists, add channel to repo
        if (repo) {
          await prisma.repo.update({
            where: { id: repo.id },
            data: { channels: { connect: { discordId: channelDiscordId } } },
          });
        }
        // If repo doesn't exist, create it
        else {
          await prisma.repo.create({
            data: {
              name: repoName,
              channels: { connect: { discordId: channelDiscordId } },
            },
          });
        }

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
        if (!channel) {
          interaction.editReply(CHANNEL_NOT_REGISTERED);
          return;
        }

        if (channel.repos.length === 0) {
          await interaction.editReply(`😢 No repos found`);
          return;
        }
        const printUsers = channel.repos
          .map((repo) => `    •  ${repo.name}`)
          .join("\n");
        await interaction.editReply(`🔎 Repos found:\n${printUsers}`);
      },
    },

    [SUBCOMMAND_DELETE]: {
      execute: async (interaction) => {
        const channelDiscordId = BigInt(interaction.channelId);

        const channel = await isChannelExists(channelDiscordId);
        if (!channel) {
          interaction.editReply(CHANNEL_NOT_REGISTERED);
          return;
        }

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
          await interaction.editReply(`❌ Repo not found`);
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
        await interaction.editReply(
          `✅ Repo deleted \`${repoName}\` from this channel`
        );
      },
    },
  },
});

export default Command;
