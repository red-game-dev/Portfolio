export const useToBinary = (text: string) => [...text].map((letter) => letter.charCodeAt(0).toString(2)).join(" ");
