import { SlashCommandBuilder } from "@discordjs/builders";
import { Command } from "@/interfaces/command";

const RegisterCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("register")
    .setDescription("Register new resource")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("user")
        .setDescription(
          "Register a new Discord user -> GitHub user relationship"
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
        .setDescription("Register a GitHub repo to monitor")
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
        await interaction.reply(`Registering a new user: ${username}`);
        break;
      case "repo":
        const path = interaction.options.getString("path");
        await interaction.reply(`Registering a new repo with path: ${path}`);
        break;
    }
  },
};

export default RegisterCommand;
