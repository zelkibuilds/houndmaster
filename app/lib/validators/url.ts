export function isValidExternalUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  return (
    (url.startsWith("http://") || url.startsWith("https://")) &&
    !url.startsWith("/") &&
    !url.startsWith("./") &&
    !url.startsWith("../")
  );
}
