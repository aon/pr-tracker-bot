import prisma from "@/db/client";
import { isChannelExists } from "@/utils/bot-misc";
import {
  CHANNEL_ALREADY_REGISTERED,
  CHANNEL_NOT_REGISTERED,
  CHANNEL_REGISTERED,
  SECRET_TOKEN_CREATED,
  SECRET_TOKEN_UPDATED,
  TOKEN_UPDATED,
} from "@/utils/bot-responses";
import { buildSlashCommandSubCommandsOnly } from "@/utils/bot-slash-commands";
import { getRandomToken } from "@/utils/gh-token";
import { SlashCommandBuilder } from "@discordjs/builders";

const SUBCOMMAND_REGISTER = "register";
const SUBCOMMAND_REGENERATE_TOKEN = "regenerate-token";

const Command = buildSlashCommandSubCommandsOnly({
  data: new SlashCommandBuilder()
    .setName("channel")
    .setDescription("Handle channel options")
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SUBCOMMAND_REGISTER)
        .setDescription(
          "Register new channel and generate a token to use for github webhooks"
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SUBCOMMAND_REGENERATE_TOKEN)
        .setDescription("Regenerate token to use for github webhooks")
    ),
  subcommands: {
    [SUBCOMMAND_REGISTER]: {
      execute: async (interaction) => {
        const channelDiscordId = BigInt(interaction.channelId);
        const guildDiscordId = BigInt(interaction.guildId);

        // Validate channel doesn't exist
        const channel = await isChannelExists(channelDiscordId);
        if (channel) {
          interaction.editReply(CHANNEL_ALREADY_REGISTERED);
          return;
        }

        // Generate random token
        const token = getRandomToken();

        // Add channel to db
        await prisma.channel.create({
          data: {
            discordId: channelDiscordId,
            token,
            guild: {
              connectOrCreate: {
                where: { discordId: guildDiscordId },
                create: { discordId: guildDiscordId },
              },
            },
          },
        });

        await interaction.editReply(CHANNEL_REGISTERED);
        await interaction.followUp({
          content: SECRET_TOKEN_CREATED(token),
          ephemeral: true,
        });
      },
    },
    [SUBCOMMAND_REGENERATE_TOKEN]: {
      execute: async (interaction) => {
        const channelDiscordId = BigInt(interaction.channelId);

        // Validate channel exists
        const channel = await isChannelExists(channelDiscordId);
        if (!channel) {
          interaction.editReply(CHANNEL_NOT_REGISTERED);
          return;
        }

        // Generate random token
        const token = getRandomToken();

        // Update channel in db
        await prisma.channel.update({
          where: { id: channel.id },
          data: { token },
        });

        await interaction.editReply(TOKEN_UPDATED);
        await interaction.followUp({
          content: SECRET_TOKEN_UPDATED(token),
          ephemeral: true,
        });
      },
    },
  },
});

export default Command;
