import crypto from "crypto";

export const getRandomToken = () => {
  return crypto.randomBytes(20).toString("hex");
};
