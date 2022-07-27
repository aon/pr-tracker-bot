import { SlashCommandBuilder } from "@discordjs/builders";
import { buildSlashCommandSubCommandsOnly } from "@/utils/bot-slash-commands";
import prisma from "@/db/client";
import { ghRepoUserOrganizationSchema } from "./schemas";
import { VALIDATION_FAILED } from "@/utils/bot-responses";

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

        const repo = await prisma.repo.findFirst({
          where: {
            name: repoName,
            channels: { some: { discordId: channelDiscordId } },
          },
          select: { id: true },
        });
        if (repo) {
          await interaction.editReply(`❌ Repo already exists`);
          return;
        }

        const channels = [
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
          update: { channels: { connectOrCreate: channels } },
          create: {
            name: repoName,
            channels: { connectOrCreate: channels },
          },
        });
        await interaction.editReply(`✅ New repo registered \`${repoName}\``);
      },
    },

    [SUBCOMMAND_LIST]: {
      execute: async (interaction) => {
        const channelDiscordId = BigInt(interaction.channelId);

        const channel = await prisma.channel.findUnique({
          where: { discordId: channelDiscordId },
          select: { repos: { select: { name: true } } },
        });
        if (!channel || channel?.repos.length === 0) {
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
