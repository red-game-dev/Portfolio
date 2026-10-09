// Each image fetched and decoded once a visit, however many things ask for it: the same promise for the same
// address, dropped again if it fails so a later ask can try once more.
const decoded = new Map<string, Promise<HTMLImageElement>>();

export const decodeImage = (url: string): Promise<HTMLImageElement> => {
  const known = decoded.get(url);

  if (known) {
    return known;
  }

  const image = new Image();

  image.decoding = "async";
  image.src = url;

  const ready = image.decode().then(() => image);

  ready.catch(() => decoded.delete(url));
  decoded.set(url, ready);

  return ready;
};
