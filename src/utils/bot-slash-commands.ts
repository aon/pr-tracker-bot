import { Command, CommandSubcommandsOnly, GenericCommand } from "@/interfaces/command";

export const buildSlashCommand = (command: Command): GenericCommand => ({
  ...command,
  isCommand: true
});

export const buildSlashCommandSubCommandsOnly = (command: CommandSubcommandsOnly): GenericCommand => ({
  ...command,
  isCommand: false
});
