import { SlashCommandBuilder } from "@discordjs/builders";
import { buildSlashCommandSubCommandsOnly } from "@/utils/discord-slash-commands";
import prisma from "@/db/client";

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
        const githubUser = interaction.options.getString("username", true);

        const guild = await prisma.guild.findUnique({
          where: { discordId: BigInt(interaction.guildId) },
          select: { id: true },
        });
        if (guild) {
          const user = await prisma.user.findUnique({
            where: {
              discordId_githubUser_guildId: {
                discordId: BigInt(interaction.user.id),
                githubUser: githubUser.trim(),
                guildId: guild.id,
              },
            },
            select: { id: true },
          });
          if (user) {
            return await interaction.reply(`❌ User already exists`);
          }
        }

        await prisma.user.create({
          data: {
            discordId: BigInt(interaction.user.id),
            githubUser: githubUser.trim(),
            guild: {
              connectOrCreate: {
                where: {
                  discordId: BigInt(interaction.guildId),
                },
                create: {
                  discordId: BigInt(interaction.guildId),
                },
              },
            },
          },
        });
        await interaction.reply(
          `✅ New user registered \`${githubUser}\` ↔ ${interaction.user}`
        );
      },
    },
    [SUBCOMMAND_LIST]: {
      execute: async (interaction) => {
        const users = await prisma.user.findMany({
          where: {
            guild: {
              discordId: BigInt(interaction.guildId),
            },
          },
        });
        if (users.length === 0) {
          return await interaction.reply(`No users found 😢`);
        }
        const printUsers = users
          .map(
            (user) => `    •  \`${user.githubUser}\` ↔ <@${user.discordId}> `
          )
          .join("\n");
        await interaction.reply(`🔎 Users found:\n${printUsers}`);
      },
    },
    [SUBCOMMAND_DELETE]: {
      execute: async (interaction) => {
        const githubUser = interaction.options.getString("username", true);
        const guild = await prisma.guild.findUnique({
          where: { discordId: BigInt(interaction.guildId) },
          select: { id: true },
        });
        if (!guild) {
          return await interaction.reply(
            `❌ Server doesn't have any registered users`
          );
        }
        const user = await prisma.user.findUnique({
          where: {
            discordId_githubUser_guildId: {
              discordId: BigInt(interaction.user.id),
              githubUser: githubUser.trim(),
              guildId: guild.id,
            },
          },
          select: { id: true },
        });
        if (!user) {
          return await interaction.reply(`❌ No user found with that name`);
        }

        await prisma.user.delete({
          where: {
            discordId_githubUser_guildId: {
              discordId: BigInt(interaction.user.id),
              githubUser: githubUser.trim(),
              guildId: guild.id,
            },
          },
        });
        await interaction.reply(
          `✅ User deleted \`${githubUser}\` ↔ ${interaction.user}`
        );
      },
    },
  },
});

export default Command;
