import { CommandAction } from "@/interfaces/command";
import { MessageEmbed } from "discord.js";
import { ResponseContent } from "./bot-responses";

export default class Response {
  protected content: string | null = null;
  protected embeds: MessageEmbed[] = [];
  protected interaction: Parameters<CommandAction>[0];

  constructor(interaction: Parameters<CommandAction>[0]) {
    this.interaction = interaction;
  }

  setCommon<T extends ResponseContent>(message: T, ...args: Parameters<T>) {
    const { title, description } = message(...args);
    const embed = new MessageEmbed().setTitle(title);
    if (description) embed.setDescription(description);
    this.setEmbed(embed);
    return this;
  }

  setContent(content: string | null) {
    this.content = content;
    return this;
  }

  setEmbed(embed: MessageEmbed) {
    this.embeds.push(embed);
    return this;
  }

  async send() {
    await this.interaction.editReply({
      content: this.content,
      embeds: this.embeds,
    });
    return this;
  }
}
