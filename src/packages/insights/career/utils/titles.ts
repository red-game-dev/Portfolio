// "Founder, CEO at TasteTravellers" and "Senior Frontend Engineer, reNFT Labs" both split into a role and
// the place it was held. A title with neither separator is all role.
export const splitTitle = (title: string) => {
  const separator = title.includes(" at ") ? " at " : ", ";
  const index = title.lastIndexOf(separator);

  return index < 0 ? { role: title, place: "" } : { role: title.slice(0, index), place: title.slice(index + separator.length) };
};
