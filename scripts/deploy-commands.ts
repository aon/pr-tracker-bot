import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { CommandsList } from "@/bot/commands";

const rest = new REST({ version: "9" }).setToken(process.env.DISCORD_TOKEN!);

rest
  .put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!), {
    body: CommandsList.map((cmd) => cmd.data.toJSON()),
  })
  .then(() => console.log("Successfully registered application commands."))
  .catch(console.error);
