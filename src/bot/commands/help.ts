import { buildSlashCommand } from "@/utils/discord-slash-commands";
import { SlashCommandBuilder } from "@discordjs/builders";

const HelpCommand = buildSlashCommand({
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Information about this bot usage"),
  execute: async (interaction) => {
    await interaction.editReply(
      `🌲 This bot was created to help teams track their PRs

In order to make it work, you need to:
  - Add the bot to your server
  - Go to the channel you want the bot to send PR updates to
  - Add the repo to the bot using \`/repo add\`
  - Optionally tell each user on the team to add their github username to the bot using \`/user add\`
  - Go to your github repo settings and a webhook with content type \`json\` selecting **only** Pull requests events and point it to ${process.env.SERVER_URL}/webhook/pr
  - Done!
`
    );
  },
});

export default HelpCommand;
