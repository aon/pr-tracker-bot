import { inlineCode } from "@/utils/bot-messages";
import Response from "@/utils/bot-response-helper";
import { buildSlashCommand } from "@/utils/bot-slash-commands";
import { SlashCommandBuilder } from "@discordjs/builders";
import { MessageEmbed } from "discord.js";

const HelpCommand = buildSlashCommand({
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Information about this bot usage"),
  execute: async (interaction) => {
    await new Response(interaction)
      .setContent(null)
      .setEmbed(
        new MessageEmbed()
          .setTitle("Help")
          .setDescription(
            `🛟 You can see the available commands by typing ${inlineCode(
              "/"
            )} on your server.`
          )
          .addField("\u200B", "\u200B")
          .addField(
            "🧩 Instructions",
            `1. Add the bot to your server\n
          2. Go to the channel you want the bot to send PR updates to\n
          3. Add the repo to the bot using \`/repo add\`\n
          4. Optionally tell each user on the team to add their github username to the bot using \`/user add\`\n
          5. Go to your github repo settings and a webhook with content type \`json\` and with the secret you defined in your envs, selecting **only** Pull requests events and point it to ${process.env.SERVER_URL}/webhook/pr\n
          6. Done!`
          )
      )
      .send();
  },
});

export default HelpCommand;
