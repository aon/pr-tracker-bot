import { buildSlashCommand } from "@/utils/bot-slash-commands";
import { SlashCommandBuilder } from "@discordjs/builders";
import Response from "@/utils/bot-response-helper";
import { MessageEmbed } from "discord.js";

const AboutCommand = buildSlashCommand({
  data: new SlashCommandBuilder()
    .setName("about")
    .setDescription("About this bot"),
  execute: async (interaction) => {
    await new Response(interaction)
      .setContent(null)
      .setEmbed(
        new MessageEmbed().setTitle("About").setDescription(
          `🌲 This bot was created to help teams track their PRs\n
            🔗 Check out the [repo](https://github.com/aon/pr-tracker-discord-bot)\n
            📖 Made by [aon](https://github.com/aon)\n`
        )
      )
      .send();
  },
});

export default AboutCommand;
