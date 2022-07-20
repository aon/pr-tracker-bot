export const getEmbedColor = (state: string) => {
  const GREEN = "#238636";
  const RED = "#DA3633";
  const PURPLE = "#8957E5";
  const GREY = "#999999";

  switch (state) {
    case "open":
      return GREEN;
    case "closed":
      return RED;
    case "merged":
      return PURPLE;
    default:
      return GREY;
  }
}
