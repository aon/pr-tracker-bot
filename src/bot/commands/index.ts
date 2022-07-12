import { Collection } from "discord.js";
import { GenericCommand } from "@/interfaces/command";
import AboutCommand from "@/bot/commands/about";
import RegisterCommand from "@/bot/commands/register";
import RemoveCommand from "@/bot/commands/remove";

export const CommandsList: GenericCommand[] = [AboutCommand, RegisterCommand, RemoveCommand];

const Commands = new Collection<string, GenericCommand>();
for (const cmd of CommandsList) {
  Commands.set(cmd.data.name, cmd);
}

export default Commands;
