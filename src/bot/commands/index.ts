import { Collection } from "discord.js";
import { GenericCommand } from "@/interfaces/command";
import AboutCommand from "@/bot/commands/about";
import ChannelCommand from "@/bot/commands/channel";
import HelpCommand from "@/bot/commands/help";
import OrganizationCommand from "@/bot/commands/organization";
import RepoCommand from "@/bot/commands/repo";
import UserCommand from "@/bot/commands/user";

export const CommandsList: GenericCommand[] = [
  AboutCommand,
  ChannelCommand,
  HelpCommand,
  OrganizationCommand,
  RepoCommand,
  UserCommand,
];

const Commands = new Collection<string, GenericCommand>();
for (const cmd of CommandsList) {
  Commands.set(cmd.data.name, cmd);
}

export default Commands;
