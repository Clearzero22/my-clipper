import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "fs";
import { join, resolve } from "path";

const root = process.cwd();
const dist = resolve(root, "dist");

function copyFile(src, dest) {
  if (existsSync(dest)) rmSync(dest, { force: true });
  copyFileSync(src, dest);
}

function copyDir(src, dest) {
  if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  for (const name of readdirSync(src)) {
    const s = join(src, name);
    const d = join(dest, name);
    if (statSync(s).isDirectory()) copyDir(s, d);
    else copyFileSync(s, d);
  }
}

if (!existsSync(dist)) mkdirSync(dist, { recursive: true });

copyFile(resolve(root, "background.js"), resolve(dist, "background.js"));
copyFile(resolve(root, "content.js"), resolve(dist, "content.js"));
copyFile(resolve(root, "manifest.json"), resolve(dist, "manifest.json"));
copyDir(resolve(root, "icons"), resolve(dist, "icons"));

console.log("copied background.js, content.js, manifest.json, icons -> dist/");
