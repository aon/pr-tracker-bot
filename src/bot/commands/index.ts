import { Collection } from "discord.js";
import { GenericCommand } from "@/interfaces/command";
import AboutCommand from "@/bot/commands/about";
import RepoCommand from "@/bot/commands/repo";
import UserCommand from "@/bot/commands/user";

export const CommandsList: GenericCommand[] = [
  AboutCommand,
  RepoCommand,
  UserCommand,
];

const Commands = new Collection<string, GenericCommand>();
for (const cmd of CommandsList) {
  Commands.set(cmd.data.name, cmd);
}

export default Commands;
