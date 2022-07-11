import { Collection } from "discord.js";
import { Command } from "@/interfaces/command";
import RegisterCommand from "@/bot/commands/register";
import RemoveCommand from "@/bot/commands/remove";

export const CommandsList: Command[] = [RegisterCommand, RemoveCommand];

const Commands = new Collection<string, Command>();
for (const cmd of CommandsList) {
  Commands.set(cmd.data.name, cmd);
}

export default Commands;
