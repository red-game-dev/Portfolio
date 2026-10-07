// Compiles test and source files with Next's bundled Babel and the project's .babelrc.js, so twin.macro and
// the styled-components plugin run in Jest exactly as they do in the build. The root @babel/core is an older
// copy that refuses next/babel, and Next's SWC transform skips Babel macros, so neither can be used here.
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const { transformSync } = require("next/dist/compiled/babel/core");

const configFile = path.resolve(__dirname, "../../.babelrc.js");
const configs = [configFile, path.resolve(__dirname, "../../babel-plugin-macros.config.js"), path.resolve(__dirname, "../../tailwind.config.js")];

module.exports = {
  process(source, filename) {
    const result = transformSync(source, {
      filename,
      configFile,
      babelrc: false,
      sourceMaps: "inline",
      caller: { name: "babel-jest", supportsStaticESM: false, supportsDynamicImport: false },
    });

    return { code: result ? result.code : source };
  },
  // A change to the Babel, macro or Tailwind config invalidates every cached file.
  getCacheKey(source, filename) {
    const hash = crypto.createHash("sha1");

    hash.update(source).update(filename);
    configs.forEach((file) => hash.update(fs.existsSync(file) ? fs.readFileSync(file) : ""));

    return hash.digest("hex");
  },
};
