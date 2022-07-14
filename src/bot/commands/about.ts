import { buildSlashCommand } from "@/utils/discord-slash-commands";
import { SlashCommandBuilder } from "@discordjs/builders";

const AboutCommand = buildSlashCommand({
  data: new SlashCommandBuilder()
    .setName("about")
    .setDescription("About this bot"),
  execute: async (interaction) => {
    await interaction.editReply(
      "This bot was created to help teams track their PRs"
    );
  },
});

export default AboutCommand;
