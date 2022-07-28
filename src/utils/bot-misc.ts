import prisma from "@/db/client";

export const isChannelExists = async (channelDiscordId: bigint) => {
  return await prisma.channel.findUnique({
    where: { discordId: BigInt(channelDiscordId) },
    select: { id: true },
  });
};
