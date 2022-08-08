import prisma from "@/db/client";
import { inlineCode, mention } from "@/utils/bot-messages";
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
import { ghUserOrganizationSchema } from "./schemas";

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
          githubUser = await ghUserOrganizationSchema.validateAsync(
            interaction.options.getString("username", true)
          );
        } catch (error) {
          await new Response(interaction).setCommon(VALIDATION_FAILED).send();
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
            await new Response(interaction)
              .setCommon(
                RESOURCE_ALREADY_EXISTS,
                "user",
                inlineCode(githubUser)
              )
              .send();
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
        await new Response(interaction)
          .setCommon(
            RESOURCE_ADDED,
            "user",
            `${inlineCode(githubUser)} ↔ ${interaction.user}`
          )
          .send();
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
          await new Response(interaction)
            .setCommon(RESOURCE_LIST_EMPTY, "user")
            .send();
          return;
        }

        await new Response(interaction)
          .setCommon(
            RESOURCE_LIST,
            "user",
            users.map(
              (user) =>
                `${inlineCode(user.githubUser)} ↔ ${mention(user.discordId)}`
            )
          )
          .send();
      },
    },

    [SUBCOMMAND_DELETE]: {
      execute: async (interaction) => {
        let githubUser: string;
        try {
          githubUser = await ghUserOrganizationSchema.validateAsync(
            interaction.options.getString("username", true)
          );
        } catch (error) {
          await new Response(interaction).setCommon(VALIDATION_FAILED).send();
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
          await new Response(interaction)
            .setCommon(RESOURCE_NOT_FOUND, "user", inlineCode(githubUser))
            .send();
          return;
        }

        await prisma.user.delete({
          where: {
            id: user.id,
          },
        });
        await new Response(interaction)
          .setCommon(
            RESOURCE_DELETED,
            "user",
            `${inlineCode(githubUser)} ↔ ${interaction.user}`
          )
          .send();
      },
    },
  },
});

export default Command;
