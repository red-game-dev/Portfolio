import { existsSync } from "fs";
import { join } from "path";

import { VOYAGE_TEXTURES } from "@/config/theme";
import { TEXTURE_IDS } from "@/packages/games/voyage";

describe("the voyage's planet maps", () => {
  test("every map the bodies' looks name has a file, and every file listed is one of them", () => {
    expect(TEXTURE_IDS.filter((id) => !VOYAGE_TEXTURES[id])).toEqual([]);
    expect(Object.keys(VOYAGE_TEXTURES).filter((id) => !TEXTURE_IDS.includes(id))).toEqual([]);
    expect(Object.values(VOYAGE_TEXTURES).filter((url) => !existsSync(join(process.cwd(), "public", url)))).toEqual([]);
  });
});
