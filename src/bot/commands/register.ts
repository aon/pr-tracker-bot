import { SlashCommandBuilder } from "@discordjs/builders";
import { buildSlashCommandSubCommandsOnly } from "@/utils/discord-slash-commands";

const SUBCOMMAND_USER = "user";
const SUBCOMMAND_REPO = "repo";

const RegisterCommand = buildSlashCommandSubCommandsOnly({
  data: new SlashCommandBuilder()
    .setName("register")
    .setDescription("Register new resource")
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SUBCOMMAND_USER)
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
        .setName(SUBCOMMAND_REPO)
        .setDescription("Register a GitHub repo to monitor")
        .addStringOption((option) =>
          option
            .setName("path")
            .setDescription("The repo path, as in 'user/repo-name'")
            .setRequired(true)
        )
    ),
  subcommands: {
    [SUBCOMMAND_USER]: {
      execute: async (interaction) => {
        const username = interaction.options.getString("username");
        await interaction.reply(`Registering a new user: ${username}`);
      },
    },
    [SUBCOMMAND_REPO]: {
      execute: async (interaction) => {
        const path = interaction.options.getString("path");
        await interaction.reply(`Registering a new repo with path: ${path}`);
      },
    },
  },
});

export default RegisterCommand;
