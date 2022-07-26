import { SlashCommandBuilder } from "@discordjs/builders";
import { buildSlashCommandSubCommandsOnly } from "@/utils/discord-slash-commands";
import prisma from "@/db/client";
import { mention } from "@/utils/discord-bot-messages";
import { ghRepoUserOrganizationSchema } from "./schemas";
import { VALIDATION_FAILED } from "@/utils/constants";

const SUBCOMMAND_ADD = "add";
const SUBCOMMAND_LIST = "list";
const SUBCOMMAND_DELETE = "delete";

const Command = buildSlashCommandSubCommandsOnly({
  data: new SlashCommandBuilder()
    .setName("user")
    .setDescription("Handle github/discord users")
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SUBCOMMAND_ADD)
        .setDescription("Add a new Discord user -> GitHub user relationship")
        .addStringOption((option) =>
          option
            .setName("username")
            .setDescription("GitHub user name")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SUBCOMMAND_LIST)
        .setDescription("List all Discord user -> GitHub user relationships")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SUBCOMMAND_DELETE)
        .setDescription("Delete Discord user -> GitHub user relationship")
        .addStringOption((option) =>
          option
            .setName("username")
            .setDescription("Github user name")
            .setRequired(true)
        )
    ),
  subcommands: {
    [SUBCOMMAND_ADD]: {
      execute: async (interaction) => {
        let githubUser: string;
        try {
          githubUser = await ghRepoUserOrganizationSchema.validateAsync(
            interaction.options.getString("username", true)
          );
        } catch (error) {
          interaction.editReply(VALIDATION_FAILED);
          return;
        }
        const userDiscordId = BigInt(interaction.user.id);
        const guildDiscordId = BigInt(interaction.guildId);

        const guild = await prisma.guild.findUnique({
          where: { discordId: guildDiscordId },
          select: { id: true },
        });
        if (guild) {
          const user = await prisma.user.findUnique({
            where: {
              discordId_githubUser_guildId: {
                discordId: userDiscordId,
                githubUser,
                guildId: guild.id,
              },
            },
            select: { id: true },
          });
          if (user) {
            await interaction.editReply(`❌ User already exists`);
            return;
          }
        }

        await prisma.user.create({
          data: {
            discordId: userDiscordId,
            githubUser,
            guild: {
              connectOrCreate: {
                where: { discordId: guildDiscordId },
                create: { discordId: guildDiscordId },
              },
            },
          },
        });
        await interaction.editReply(
          `✅ New user registered \`${githubUser}\` ↔ ${interaction.user}`
        );
      },
    },
    
    [SUBCOMMAND_LIST]: {
      execute: async (interaction) => {
        const guildDiscordId = BigInt(interaction.guildId);

        const users = await prisma.user.findMany({
          where: {
            guild: {
              discordId: guildDiscordId,
            },
          },
        });
        if (users.length === 0) {
          await interaction.editReply(`😢 No users found`);
          return;
        }
        const printUsers = users
          .map(
            (user) =>
              `    •  \`${user.githubUser}\` ↔ ${mention(user.discordId)} `
          )
          .join("\n");
        await interaction.editReply(`🔎 Users found:\n${printUsers}`);
      },
    },

    [SUBCOMMAND_DELETE]: {
      execute: async (interaction) => {
        let githubUser: string;
        try {
          githubUser = await ghRepoUserOrganizationSchema.validateAsync(
            interaction.options.getString("username", true)
          );
        } catch (error) {
          interaction.editReply(VALIDATION_FAILED);
          return;
        }
        const userDiscordId = BigInt(interaction.user.id);
        const guildDiscordId = BigInt(interaction.guildId);

        const user = await prisma.user.findFirst({
          where: {
            discordId: userDiscordId,
            githubUser,
            guild: {
              discordId: guildDiscordId,
            },
          },
          select: { id: true },
        });
        if (!user) {
          await interaction.editReply(`❌ No user found with that name`);
          return;
        }

        await prisma.user.delete({
          where: {
            id: user.id,
          },
        });
        await interaction.editReply(
          `✅ User deleted \`${githubUser}\` ↔ ${interaction.user}`
        );
      },
    },
  },
});

export default Command;
