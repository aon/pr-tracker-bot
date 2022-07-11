import { SlashCommandBuilder } from "@discordjs/builders";
import { Command } from "@/interfaces/command";

const RemoveCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("remove")
    .setDescription("Remove resource")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("user")
        .setDescription(
          "Remove a Discord user -> GitHub user relationship"
        )
        .addStringOption((option) =>
          option
            .setName("username")
            .setDescription("The user")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("repo")
        .setDescription("Remove a monitored GitHub repo")
        .addStringOption((option) =>
          option
            .setName("path")
            .setDescription("The repo path, as in 'user/repo-name'")
            .setRequired(true)
        )
    ),
  run: async (interaction) => {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case "user":
        const username = interaction.options.getString("username");
        await interaction.reply(`Removing user: ${username}`);
        break;
      case "repo":
        const path = interaction.options.getString("path");
        await interaction.reply(`Removing repo with path: ${path}`);
        break;
    }
  },
};

export default RemoveCommand;
