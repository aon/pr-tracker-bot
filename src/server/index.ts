import { handleWebhook } from "@/utils/gh-webhooks";
import { StatusCodes } from "http-status-codes";
import express from "express";

const initializeServer = () => {
  const app = express();
  const port = process.env.SERVER_PORT || 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.post("/webhook/pr", async (req, res) => {
    try {
      await handleWebhook(req.body);
      return res.status(StatusCodes.OK).end();
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).end();
    }
  });

  app.use((_req, res) => {
    return res.status(StatusCodes.NOT_FOUND).send("Route not found");
  });

  app.listen(port, () => {
    console.log(`Webhook listening on port ${port}`);
  });
};

export default initializeServer;
