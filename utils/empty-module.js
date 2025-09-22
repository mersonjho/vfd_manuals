// Intentionally empty module used to alias away ESM-only pdf.js worker in production client builds.
// Use CommonJS here so minifiers that expect non-module code don't error on `export` syntax.
module.exports = {};
