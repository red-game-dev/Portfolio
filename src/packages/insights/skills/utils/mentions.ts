const MIN_LENGTH = 3;

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Skill names that appear as whole words in a piece of prose, for evidence that lives in bullets rather than
// in a stack list. Very short names are skipped, because "C" or "Go" would match almost anything.
export const findMentions = (text: string, names: string[]): string[] => names.filter((name) => {
  const plain = name.replace(/\([^)]*\)/g, "").trim();

  return plain.length >= MIN_LENGTH && new RegExp(`(^|[^A-Za-z0-9])${escape(plain)}($|[^A-Za-z0-9])`, "i").test(text);
});
