import pino from "pino";
import pinoHttp from "pino-http";

const baseLogger = pino();
export const mainLogger = baseLogger.child({module: "main"})
export const serverLogger = baseLogger.child({ module: "server" });
export const botLogger = baseLogger.child({ module: "bot" });

export const httpLogger = pinoHttp({
  logger: serverLogger,
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  wrapSerializers: true,
  customLogLevel: function (_req, res, err) {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return "warn";
    } else if (res.statusCode >= 500 || err) {
      return "error";
    } else if (res.statusCode >= 300 && res.statusCode < 400) {
      return "silent";
    }
    return "info";
  },
  customSuccessMessage: function (req, res) {
    if (res.statusCode === 404) {
      return "resource not found";
    }
    return `${req.method} completed`;
  },
  customReceivedMessage: function (req, _res) {
    return "request received: " + req.method;
  },
  customErrorMessage: function (_req, res, _err) {
    return "request errored with status code: " + res.statusCode;
  },
  customAttributeKeys: {
    req: "request",
    res: "response",
    err: "error",
    responseTime: "timeTaken",
  },
});
