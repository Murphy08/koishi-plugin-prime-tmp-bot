const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const sourceDir = path.join(rootDir, "src", "resource");
const targetDir = path.join(rootDir, "lib", "resource");

function ensureDirExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function copyResources() {
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`resource directory not found: ${sourceDir}`);
  }

  fs.rmSync(targetDir, { recursive: true, force: true });
  ensureDirExists(path.dirname(targetDir));
  fs.cpSync(sourceDir, targetDir, { recursive: true });
  console.log(`copied resources: ${sourceDir} -> ${targetDir}`);
}

copyResources();
