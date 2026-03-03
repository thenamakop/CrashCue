import path from "path";

export function resolveCliAssetsDir(): string {
  const assetsDir = path.join(__dirname, "assets");
  return assetsDir;
}

export function resolveCliDefaultSoundPath(): string {
  return path.join(resolveCliAssetsDir(), "faahhhhhh.wav");
}
