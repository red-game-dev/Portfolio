// Em dashes become commas, whatever the model writes.
export const withoutEmDashes = (text: string): string => text.replace(/\s*—\s*/g, ", ");
