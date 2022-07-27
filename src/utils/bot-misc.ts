import prisma from "@/db/client";

export const isChannelExists = (channelDiscordId: bigint) => {
  return prisma.channel.findUnique({
    where: { discordId: BigInt(channelDiscordId) },
    select: { id: true },
  });
};
