// Writes the portrait the site's emails reveal beside their header: the whole profile picture, as the About section
// shows it, in raw RGB at the size the email draws it, deflated, so the server draws the reveal without decoding an
// image. sharp comes with Next. Run `npm run email:portrait` after the profile picture changes, and commit the JSON.
import { writeFileSync } from "fs";
import { deflateSync } from "zlib";

import sharp from "sharp";

const SOURCE = "public/images/profile.jpg";
const OUTPUT = "src/data/email/portrait.json";
// Drawn twice as large as the email shows it (96 by 128), for sharp screens, in the picture's own 3:4.
const WIDTH = 192;
const HEIGHT = 256;

const { data, info } = await sharp(SOURCE).resize(WIDTH, HEIGHT, { fit: "cover", kernel: "lanczos3" })
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const pixels = deflateSync(data, { level: 9 }).toString("base64");

writeFileSync(OUTPUT, `${JSON.stringify({ source: SOURCE, width: info.width, height: info.height, encoding: "deflate", pixels }, null, 2)}\n`);
console.log(`Wrote ${OUTPUT}: ${info.width} by ${info.height}, ${data.length} bytes of RGB, ${pixels.length} characters deflated.`);
