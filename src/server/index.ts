import { handleWebhook } from "@/utils/gh-webhooks";
import { StatusCodes } from "http-status-codes";
import express from "express";
import { httpLogger, serverLogger as logger } from "@/logger";

const initializeServer = () => {
  const app = express();
  const port = process.env.SERVER_PORT || 3000;

  app.use(httpLogger);
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.post("/webhook/pr", async (req, res) => {
    try {
      const failedMessages = await handleWebhook(req.body);
      if (failedMessages.length === 0) {
        logger.info("webhook handled successfully");
        return res.status(StatusCodes.OK).send();
      }
      logger.info(
        "webhook handled successfully, but some messages were not sent"
      );
      return res.status(StatusCodes.MULTI_STATUS).send({
        message: "failed to send messages to some channels",
        channels: failedMessages.map((r) => r.channel.discordId),
      });
    } catch (error) {
      logger.info("failed to handle webhook");
      logger.error(error);
      return res.status(StatusCodes.BAD_REQUEST).end();
    }
  });

  app.use((_req, res) => {
    return res.status(StatusCodes.NOT_FOUND).send("route not found");
  });

  app.listen(port, () => {
    logger.info(`listening on port ${port}`);
  });
};

export default initializeServer;
