// Writes the portrait the site's emails reveal beside their header: the profile picture cropped round the head and
// shoulders, as raw RGB at the size the avatar is drawn, so the server draws the reveal without decoding an image.
// sharp comes with Next. Run `npm run email:portrait` after the profile picture changes, and commit the JSON.
import { writeFileSync } from "fs";

import sharp from "sharp";

const SOURCE = "public/images/profile.jpg";
const OUTPUT = "src/data/email/portrait.json";
// The head and shoulders, square, in the 450 by 600 picture.
const CROP = { left: 90, top: 45, width: 300, height: 300 };
// Drawn twice as large as the email shows it, for sharp screens.
const SIZE = 96;

const { data, info } = await sharp(SOURCE).extract(CROP)
  .resize(SIZE, SIZE, { kernel: "lanczos3" })
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

writeFileSync(OUTPUT, `${JSON.stringify({ source: SOURCE, crop: CROP, width: info.width, height: info.height, pixels: data.toString("base64") }, null, 2)}\n`);
console.log(`Wrote ${OUTPUT}: ${info.width} by ${info.height}, ${data.length} bytes of RGB.`);
