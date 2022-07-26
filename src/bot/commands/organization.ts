import { SlashCommandBuilder } from "@discordjs/builders";
import { buildSlashCommandSubCommandsOnly } from "@/utils/discord-slash-commands";
import prisma from "@/db/client";
import { ghRepoUserOrganizationSchema } from "./schemas";
import { VALIDATION_FAILED } from "@/utils/constants";

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
        let organizationName: string;
        try {
          organizationName = await ghRepoUserOrganizationSchema.validateAsync(
            interaction.options.getString("name", true)
          );
        } catch (error) {
          interaction.editReply(VALIDATION_FAILED);
          return;
        }

        const channelDiscordId = BigInt(interaction.channelId);
        const guildDiscordId = BigInt(interaction.guildId);

        const organization = await prisma.organization.findFirst({
          where: {
            name: organizationName,
            channels: { some: { discordId: channelDiscordId } },
          },
          select: { id: true },
        });
        if (organization) {
          await interaction.editReply(`❌ Organization already exists`);
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
        await prisma.organization.upsert({
          where: { name: organizationName },
          update: { channels: { connectOrCreate: channels } },
          create: {
            name: organizationName,
            channels: { connectOrCreate: channels },
          },
        });
        await interaction.editReply(
          `✅ New organization registered \`${organizationName}\``
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
        if (!channel || channel?.organizations.length === 0) {
          await interaction.editReply(`😢 No organizations found`);
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
        let organizationName: string;
        try {
          organizationName = await ghRepoUserOrganizationSchema.validateAsync(
            interaction.options.getString("name", true)
          );
        } catch (error) {
          interaction.editReply(VALIDATION_FAILED);
          return;
        }
        const channelDiscordId = BigInt(interaction.channelId);

        const organization = await prisma.organization.findFirst({
          where: {
            name: organizationName,
            channels: { some: { discordId: channelDiscordId } },
          },
          select: { id: true, channels: { select: { id: true } } },
        });
        if (!organization) {
          await interaction.editReply(`❌ Organization not found`);
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
