import initializeBot from "./bot";
import { mainLogger as logger } from "./logger";
import initializeServer from "./server";

logger.info("initializing bot");
initializeBot();

logger.info("initializing server");
initializeServer();
