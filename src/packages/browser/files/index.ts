// A file handed to the visitor to keep: the browser's own save, through a link to the blob that is let go a moment later.
export const saveBlob = (blob: Blob, fileName: string): void => {
  const link = document.createElement("a");
  const href = URL.createObjectURL(blob);

  link.href = href;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(href), 1000);
};
