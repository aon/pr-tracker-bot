import { Client, Intents } from "discord.js";
import Commands from "@/bot/commands";

const initializeBot = () => {
  const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

  client.on("ready", () => {
    console.log("Ready!");
  });

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;

    const command = Commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.run(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  });

  client.login(process.env.DISCORD_TOKEN);
};

export default initializeBot;
