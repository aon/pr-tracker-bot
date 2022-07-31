export const getResponseTime = (startTime: number, endTime: number, decimals = 3) => {
  const responseTime = Math.round((endTime - startTime) * 10 ** decimals) / 10 ** decimals;
  return responseTime;
}
