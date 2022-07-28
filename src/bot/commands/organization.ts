import { SlashCommandBuilder } from "@discordjs/builders";
import { buildSlashCommandSubCommandsOnly } from "@/utils/bot-slash-commands";
import prisma from "@/db/client";
import { ghRepoUserOrganizationSchema } from "./schemas";
import {
  CHANNEL_NOT_REGISTERED,
  RESOURCE_ADDED,
  RESOURCE_LIST_EMPTY,
  RESOURCE_NOT_FOUND,
  VALIDATION_FAILED,
} from "@/utils/bot-responses";
import { RESOURCE_ALREADY_EXISTS } from "@/utils/bot-responses";
import { isChannelExists } from "@/utils/bot-misc";

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
        const channelDiscordId = BigInt(interaction.channelId);

        // Validate channel exists
        const channel = await isChannelExists(channelDiscordId);
        if (!channel) {
          interaction.editReply(CHANNEL_NOT_REGISTERED);
          return;
        }

        // Validate input
        let organizationName: string;
        try {
          organizationName = await ghRepoUserOrganizationSchema.validateAsync(
            interaction.options.getString("name", true)
          );
        } catch (error) {
          interaction.editReply(VALIDATION_FAILED);
          return;
        }

        // Get organization from db
        const organization = await prisma.organization.findFirst({
          where: { name: organizationName },
          select: { id: true, channels: { select: { discordId: true } } },
        });

        // Validate channel is not already subscribed to organization
        if (organization?.channels.includes({ discordId: channelDiscordId })) {
          await interaction.editReply(RESOURCE_ALREADY_EXISTS("organization"));
          return;
        }

        // If organization exists, add channel to organization
        if (organization) {
          await prisma.organization.update({
            where: { id: organization.id },
            data: { channels: { connect: { discordId: channelDiscordId } } },
          });
        }
        // If organization doesn't exist, create it
        else {
          await prisma.organization.create({
            data: {
              name: organizationName,
              channels: { connect: { discordId: channelDiscordId } },
            },
          });
        }

        await interaction.editReply(
          RESOURCE_ADDED("organization", organizationName)
        );
      },
    },

    [SUBCOMMAND_LIST]: {
      execute: async (interaction) => {
        const channelDiscordId = BigInt(interaction.channelId);

        const channel = await prisma.channel.findUnique({
          where: { discordId: channelDiscordId },
          select: { organizations: { select: { name: true } } },
        });
        if (!channel) {
          interaction.editReply(CHANNEL_NOT_REGISTERED);
          return;
        }
        if (channel.organizations.length === 0) {
          await interaction.editReply(RESOURCE_LIST_EMPTY("organization"));
          return;
        }
        const printUsers = channel.organizations
          .map((organization) => `    •  ${organization.name}`)
          .join("\n");
        await interaction.editReply(`🔎 Organizations found:\n${printUsers}`);
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

        let organizationName: string;
        try {
          organizationName = await ghRepoUserOrganizationSchema.validateAsync(
            interaction.options.getString("name", true)
          );
        } catch (error) {
          interaction.editReply(VALIDATION_FAILED);
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
          await interaction.editReply(RESOURCE_NOT_FOUND("organization"));
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
        await interaction.editReply(
          `✅ Organization deleted \`${organizationName}\` from this channel`
        );
      },
    },
  },
});

export default Command;
