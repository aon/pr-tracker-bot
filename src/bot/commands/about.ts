import { buildSlashCommand } from "@/utils/bot-slash-commands";
import { SlashCommandBuilder } from "@discordjs/builders";

const AboutCommand = buildSlashCommand({
  data: new SlashCommandBuilder()
    .setName("about")
    .setDescription("About this bot"),
  execute: async (interaction) => {
    await interaction.editReply(
      `📖 This bot was made by [aon](https://github.com/aon)
🐛 If you find any bugs please report it on the [repo](https://github.com/aon/pr-tracker-discord-bot)
`
    );
  },
});

export default AboutCommand;
