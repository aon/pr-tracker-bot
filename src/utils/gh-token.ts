import crypto from "crypto";

export const verifySignature = ({
  signature,
  payload,
  secret,
}: {
  signature: string;
  payload: string;
  secret: string;
}): boolean => {
  const result = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(result));
  } catch (error) {
    return false;
  }
};
