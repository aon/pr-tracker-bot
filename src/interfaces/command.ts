import {
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "@discordjs/builders";
import { CommandInteraction } from "discord.js";

export type CommandAction = (
  interaction: CommandInteraction & { guildId: string }
) => Promise<void>;

export interface Command {
  data: SlashCommandBuilder;
  execute: CommandAction;
}

export interface CommandSubcommandsOnly {
  data: SlashCommandSubcommandsOnlyBuilder;
  subcommands: {
    [subcommand: string]: {
      execute: CommandAction;
    };
  };
}

export type GenericCommand = (Command | CommandSubcommandsOnly) & {
  isCommand: boolean;
};
