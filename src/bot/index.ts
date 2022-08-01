import { Client, CommandInteraction, Intents } from "discord.js";
import Commands from "@/bot/commands";
import {
  Command,
  CommandAction,
  CommandSubcommandsOnly,
} from "@/interfaces/command";
import { botLogger as logger } from "@/logger";
import { getResponseTime } from "@/utils/performance";

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

const initializeBot = () => {
  client.on("ready", () => {
    logger.info("ready");
  });

  client.on("interactionCreate", async (interaction) => {
    logger.info({ interaction }, "interaction received");
    if (!interaction.isCommand()) {
      logger.warn("interaction is not a command");
      return;
    }
    if (!interaction.guildId) {
      logger.warn("interaction is not in a guild");
      return;
    }

    const command = Commands.get(interaction.commandName);
    if (!command) {
      logger.error("command not found");
      return;
    }

    const isCommand = command.isCommand;
    const subcommandName = interaction.options.getSubcommand(false);
    let executable: CommandAction;

    if (isCommand) {
      executable = (command as Command).execute;
    } else {
      if (!subcommandName) {
        logger.error("subcommand not found");
        return;
      }
      if (!(command as CommandSubcommandsOnly).subcommands[subcommandName])
        return;
      executable = (command as CommandSubcommandsOnly).subcommands[
        subcommandName
      ].execute;
    }

    try {
      logger.info(
        `executing command '/${interaction.commandName}` +
          (subcommandName ? ` ${subcommandName}'` : "'")
      );
      const startTime = performance.now();
      await interaction.reply({ content: "*Processing...*", ephemeral: true });
      await executable(interaction as CommandInteraction & { guildId: string });
      const endTime = performance.now();
      logger.info(
        { responseTime: getResponseTime(startTime, endTime) },
        "command executed successfully"
      );
    } catch (error) {
      logger.info("error executing command");
      logger.error(error);
      try {
        await interaction.editReply({
          content: "☠️ There was an error while executing this command",
        });
      } catch (error) {
        logger.info("error while sending error message");
        logger.error(error);
      }
    }
  });

  client.login(process.env.DISCORD_TOKEN);
};

export default initializeBot;
export { client };
