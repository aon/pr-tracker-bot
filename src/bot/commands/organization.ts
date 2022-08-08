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
import { ghUserOrganizationSchema } from "./schemas";

const SUBCOMMAND_ADD = "add";
const SUBCOMMAND_LIST = "list";
const SUBCOMMAND_DELETE = "delete";

const Command = buildSlashCommandSubCommandsOnly({
  data: new SlashCommandBuilder()
    .setName("organization")
    .setDescription("Handle subscribed organizations")
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SUBCOMMAND_ADD)
        .setDescription(
          "Add a new organization to subscribe to on this channel"
        )
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("Organization name")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SUBCOMMAND_LIST)
        .setDescription("List subscribed organizations on this channel")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SUBCOMMAND_DELETE)
        .setDescription("Delete organization subscription from this channel")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("Organization name")
            .setRequired(true)
        )
    ),
  subcommands: {
    [SUBCOMMAND_ADD]: {
      execute: async (interaction) => {
        // Validate input
        let organizationName: string;
        try {
          organizationName = await ghUserOrganizationSchema.validateAsync(
            interaction.options.getString("name", true)
          );
        } catch (error) {
          await new Response(interaction).setCommon(VALIDATION_FAILED).send();
          return;
        }

        const channelDiscordId = BigInt(interaction.channelId);
        const guildDiscordId = BigInt(interaction.guildId);

        // Check if organization exists attached to this channel
        const organization = await prisma.organization.findFirst({
          where: {
            name: organizationName,
            channels: { some: { discordId: channelDiscordId } },
          },
          select: { id: true },
        });
        if (organization) {
          await new Response(interaction)
            .setCommon(
              RESOURCE_ALREADY_EXISTS,
              "organization",
              inlineCode(organizationName)
            )
            .send();
          return;
        }

        // Add or update organization subscription
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
        await prisma.organization.upsert({
          where: { name: organizationName },
          update: { channels: { connectOrCreate: channel } },
          create: {
            name: organizationName,
            channels: { connectOrCreate: channel },
          },
        });
        await new Response(interaction)
          .setCommon(
            RESOURCE_ADDED,
            "organization",
            inlineCode(organizationName)
          )
          .send();
      },
    },

    [SUBCOMMAND_LIST]: {
      execute: async (interaction) => {
        const channelDiscordId = BigInt(interaction.channelId);

        const channel = await prisma.channel.findUnique({
          where: { discordId: channelDiscordId },
          select: { organizations: { select: { name: true } } },
        });
        if (!channel || channel.organizations.length === 0) {
          await new Response(interaction)
            .setCommon(RESOURCE_LIST_EMPTY, "organization")
            .send();
          return;
        }
        await new Response(interaction)
          .setCommon(
            RESOURCE_LIST,
            "organization",
            channel.organizations.map((organization) =>
              inlineCode(organization.name)
            )
          )
          .send();
      },
    },

    [SUBCOMMAND_DELETE]: {
      execute: async (interaction) => {
        const channelDiscordId = BigInt(interaction.channelId);

        let organizationName: string;
        try {
          organizationName = await ghUserOrganizationSchema.validateAsync(
            interaction.options.getString("name", true)
          );
        } catch (error) {
          await new Response(interaction).setCommon(VALIDATION_FAILED).send();
          return;
        }

        const organization = await prisma.organization.findFirst({
          where: {
            name: organizationName,
            channels: { some: { discordId: channelDiscordId } },
          },
          select: { id: true, channels: { select: { id: true } } },
        });
        if (!organization) {
          await new Response(interaction)
            .setCommon(
              RESOURCE_NOT_FOUND,
              "organization",
              inlineCode(organizationName)
            )
            .send();
          return;
        }

        await prisma.organization.update({
          where: { id: organization.id },
          data: {
            channels: {
              disconnect: { discordId: channelDiscordId },
            },
          },
        });
        await new Response(interaction)
          .setCommon(
            RESOURCE_DELETED,
            "organization",
            inlineCode(organizationName)
          )
          .send();
      },
    },
  },
});

export default Command;
