import { Client, CommandInteraction, Intents } from "discord.js";
import Commands from "@/bot/commands";
import {
  Command,
  CommandAction,
  CommandSubcommandsOnly,
} from "@/interfaces/command";

const initializeBot = () => {
  const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

  client.on("ready", () => {
    console.log("Ready!");
  });

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;
    if (!interaction.guildId) return;

    const command = Commands.get(interaction.commandName);
    if (!command) return;

    const isCommand = command.isCommand;
    let executable: CommandAction;

    if (isCommand) {
      executable = (command as Command).execute;
    } else {
      const subcommand = interaction.options.getSubcommand(false);
      if (!subcommand) return;
      if (!(command as CommandSubcommandsOnly).subcommands[subcommand]) return;
      executable = (command as CommandSubcommandsOnly).subcommands[subcommand]
        .execute;
    }

    try {
      await executable(interaction as CommandInteraction & { guildId: string });
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
