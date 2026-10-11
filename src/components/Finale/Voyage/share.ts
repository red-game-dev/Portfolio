// A run's card: the size social sites show a picture at.
export const RUN_CARD = { width: 1200, height: 630 };

export interface RunCardText {
  title: string;
  subtitle: string;
  score: string;
  rows: ReadonlyArray<{ label: string; value: string }>;
  site: string;
  cta: string;
}

// At most this many figures on the card, in two columns.
const ROWS = 6;

// Draws a run's card: the run's last view on the right, fading into a dark panel on the left with the score large and
// the run's figures under it, and the site's address at the foot.
export const drawRunCard = (context: CanvasRenderingContext2D, photo: HTMLCanvasElement | null, text: RunCardText): void => {
  const { width, height } = RUN_CARD;

  context.fillStyle = "#05080f";
  context.fillRect(0, 0, width, height);

  if (photo && photo.width > 0 && photo.height > 0) {
    const scale = Math.max((width * 0.62) / photo.width, height / photo.height);
    const drawn = { width: photo.width * scale, height: photo.height * scale };

    context.drawImage(photo, width - drawn.width + (drawn.width - width * 0.62) / 2, (height - drawn.height) / 2, drawn.width, drawn.height);
  }

  const fade = context.createLinearGradient(width * 0.3, 0, width * 0.6, 0);

  fade.addColorStop(0, "rgba(5, 8, 15, 1)");
  fade.addColorStop(1, "rgba(5, 8, 15, 0)");
  context.fillStyle = fade;
  context.fillRect(0, 0, width * 0.6, height);
  context.fillStyle = "#05080f";
  context.fillRect(0, 0, width * 0.3, height);

  context.textBaseline = "top";
  context.fillStyle = "#c4d2ff";
  context.font = "600 30px Roboto, Arial, sans-serif";
  context.fillText(text.title, 64, 64);
  context.fillStyle = "#ffffff";
  context.font = "700 104px Roboto, Arial, sans-serif";
  context.fillText(text.score, 60, 110);
  context.fillStyle = "#aab3c9";
  context.font = "400 24px Roboto, Arial, sans-serif";
  context.fillText(text.subtitle, 64, 236);

  text.rows.slice(0, ROWS).forEach((row, index) => {
    const x = 64 + (index % 2) * 240;
    const y = 300 + Math.floor(index / 2) * 74;

    context.fillStyle = "#8a93ab";
    context.font = "400 20px Roboto, Arial, sans-serif";
    context.fillText(row.label, x, y);
    context.fillStyle = "#ffffff";
    context.font = "600 30px Roboto, Arial, sans-serif";
    context.fillText(row.value, x, y + 26);
  });

  context.fillStyle = "#ffd76a";
  context.font = "700 30px Roboto, Arial, sans-serif";
  context.fillText(text.site, 64, height - 92);
  context.fillStyle = "#c4d2ff";
  context.font = "400 22px Roboto, Arial, sans-serif";
  context.fillText(text.cta, 64, height - 54);
};

// Shares a card through the device's share sheet where it can share files, else saves it; says which it did (null
// when the reader closed the sheet or nothing could be made).
export const shareCard = async (card: HTMLCanvasElement, fileName: string, text: string, url: string): Promise<"shared" | "saved" | null> => {
  const blob = await new Promise<Blob | null>((resolve) => card.toBlob(resolve, "image/png"));

  if (!blob) {
    return null;
  }

  const file = new File([blob], fileName, { type: "image/png" });

  if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text, url });

      return "shared";
    } catch {
      return null;
    }
  }

  const link = document.createElement("a");
  const href = URL.createObjectURL(blob);

  link.href = href;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(href), 1000);

  return "saved";
};
