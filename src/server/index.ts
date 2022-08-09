import { handleWebhook } from "@/utils/gh-webhooks";
import { StatusCodes } from "http-status-codes";
import express from "express";
import { httpLogger, serverLogger as logger } from "@/logger";
import { verifySignature } from "@/utils/gh-token";
import { version } from "../../package.json";
import { client } from "@/bot";

const initializeServer = () => {
  const app = express();
  const port = process.env.SERVER_PORT || 8080;

  app.use(httpLogger);
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.post("/webhook/pr", async (req, res) => {
    try {
      // Authenticate request
      const secret = process.env.GITHUB_SECRET;
      if (secret !== undefined) {
        const signature = req.headers["x-hub-signature-256"] as
          | string
          | undefined;
        if (signature === undefined) {
          logger.warn("missing signature");
          return res.status(StatusCodes.UNAUTHORIZED).send();
        }

        const isValid = verifySignature({
          signature: signature.slice(7), // remove "sha256="
          secret,
          payload: JSON.stringify(req.body),
        });
        if (!isValid) {
          logger.warn("invalid signature");
          return res.status(StatusCodes.UNAUTHORIZED).send();
        }
      }

      // Handle webhook
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
      logger.warn(error);
      return res.status(StatusCodes.BAD_REQUEST).send();
    }
  });

  app.get("/healthcheck", async (_req, res) => {
    try {
      const isBotReady = client.isReady();

      if (!isBotReady) {
        logger.warn("bot is not ready");
        return res.status(StatusCodes.SERVICE_UNAVAILABLE).send();
      }

      return res.status(StatusCodes.OK).send({
        version,
        status: "ok",
        uptime: process.uptime(),
      });
    } catch (error) {
      logger.info("failed to handle healthcheck");
      logger.warn(error);
      return res.status(StatusCodes.BAD_REQUEST).send();
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
