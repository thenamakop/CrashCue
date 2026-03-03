import path from "path";
import fs from "fs";

describe("Shared Assets Module", () => {
  const realAssetsDir = path.resolve(
    __dirname,
    "..",
    "packages",
    "shared-assets",
    "assets",
  );

  afterEach(() => {
    delete process.env.CRASHCUE_TEST_ASSETS_PATH;
    jest.resetModules();
  });

  test("resolveAssetsDir should use __dirname/assets when no env override", () => {
    delete process.env.CRASHCUE_TEST_ASSETS_PATH;
    jest.resetModules();

    const moduleEntry = require.resolve("../packages/shared-assets/src/index");
    const expected = path.resolve(path.dirname(moduleEntry), "assets");
    const { resolveAssetsDir } =
      require("../packages/shared-assets/src/index") as typeof import("../packages/shared-assets/src/index");

    expect(resolveAssetsDir()).toBe(expected);
  });

  test("resolveAssetsDir should respect CRASHCUE_TEST_ASSETS_PATH", () => {
    process.env.CRASHCUE_TEST_ASSETS_PATH = "C:\\mock\\assets";
    jest.resetModules();

    const { resolveAssetsDir } =
      require("../packages/shared-assets/src/index") as typeof import("../packages/shared-assets/src/index");

    expect(resolveAssetsDir()).toBe(path.resolve("C:\\mock\\assets"));
  });

  test("DEFAULT_SOUND_PATH should resolve to an existing file when env override points to real assets", () => {
    process.env.CRASHCUE_TEST_ASSETS_PATH = realAssetsDir;
    jest.resetModules();

    const { DEFAULT_SOUND_PATH } =
      require("../packages/shared-assets/src/index") as typeof import("../packages/shared-assets/src/index");

    expect(fs.existsSync(DEFAULT_SOUND_PATH)).toBe(true);
    expect(fs.statSync(DEFAULT_SOUND_PATH).isFile()).toBe(true);
    expect(path.extname(DEFAULT_SOUND_PATH)).toBe(".wav");
  });

  test("resolveSoundPath should return DEFAULT_SOUND_PATH when no custom path provided", () => {
    process.env.CRASHCUE_TEST_ASSETS_PATH = realAssetsDir;
    jest.resetModules();

    const { DEFAULT_SOUND_PATH, resolveSoundPath } =
      require("../packages/shared-assets/src/index") as typeof import("../packages/shared-assets/src/index");

    expect(resolveSoundPath()).toBe(DEFAULT_SOUND_PATH);
  });

  test("resolveSoundPath should return custom path when valid path provided", () => {
    process.env.CRASHCUE_TEST_ASSETS_PATH = realAssetsDir;
    jest.resetModules();

    const { DEFAULT_SOUND_PATH, resolveSoundPath } =
      require("../packages/shared-assets/src/index") as typeof import("../packages/shared-assets/src/index");

    expect(resolveSoundPath(DEFAULT_SOUND_PATH)).toBe(DEFAULT_SOUND_PATH);
  });

  test("resolveSoundPath should return DEFAULT_SOUND_PATH when invalid custom path provided", () => {
    process.env.CRASHCUE_TEST_ASSETS_PATH = realAssetsDir;
    jest.resetModules();

    const { DEFAULT_SOUND_PATH, resolveSoundPath } =
      require("../packages/shared-assets/src/index") as typeof import("../packages/shared-assets/src/index");

    const invalidPath = path.resolve(__dirname, "non-existent-file.mp3");
    expect(resolveSoundPath(invalidPath)).toBe(DEFAULT_SOUND_PATH);
  });

  test("resolveSoundPath should return DEFAULT_SOUND_PATH when custom path is a directory", () => {
    process.env.CRASHCUE_TEST_ASSETS_PATH = realAssetsDir;
    jest.resetModules();

    const { DEFAULT_SOUND_PATH, resolveSoundPath } =
      require("../packages/shared-assets/src/index") as typeof import("../packages/shared-assets/src/index");

    expect(resolveSoundPath(realAssetsDir)).toBe(DEFAULT_SOUND_PATH);
  });

  test("DEFAULT_SOUND_PATH should be absolute", () => {
    process.env.CRASHCUE_TEST_ASSETS_PATH = realAssetsDir;
    jest.resetModules();

    const { DEFAULT_SOUND_PATH } =
      require("../packages/shared-assets/src/index") as typeof import("../packages/shared-assets/src/index");

    expect(path.isAbsolute(DEFAULT_SOUND_PATH)).toBe(true);
  });
});
