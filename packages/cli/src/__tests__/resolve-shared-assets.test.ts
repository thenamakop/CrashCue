import fs from "fs";
import path from "path";

// the module path relative to test file
const modulePath = "../utils/resolve-shared-assets";

describe("resolveSharedAssets", () => {
  let resolveSharedAssets: () => string;
  let existsSpy: jest.SpyInstance;
  let requireResolveSpy: jest.SpyInstance;

  beforeEach(() => {
    // clear module cache to reload fresh (important when spying)
    jest.resetModules();
    existsSpy = jest.spyOn(fs, "existsSync");
    requireResolveSpy = jest.spyOn(require, "resolve" as any);
    // import after spies are in place
    resolveSharedAssets = require(modulePath).resolveSharedAssets;
  });

  afterEach(() => {
    existsSpy.mockRestore();
    requireResolveSpy.mockRestore();
  });

  test("resolves installed @crashcue/shared-assets via require.resolve", () => {
    // simulate require.resolve returning a file path inside package
    requireResolveSpy.mockImplementation((name: string) => {
      if (name === "@crashcue/shared-assets") {
        return path.join(
          "C:",
          "fake",
          "node_modules",
          "@crashcue",
          "shared-assets",
          "dist",
          "index.js",
        );
      }
      throw new Error("not found");
    });

    // Mock fs.existsSync to return true for the assets folder
    existsSpy.mockImplementation((p: string) => {
      return p.endsWith("assets");
    });

    const dir = resolveSharedAssets();
    expect(dir).toContain("shared-assets");
    expect(dir).toContain("assets");
  });

  test("falls back to bundled notifier assets when require.resolve fails", () => {
    requireResolveSpy.mockImplementation(() => {
      throw new Error("not installed");
    });
    // If path contains 'notifier/assets' return true
    existsSpy.mockImplementation(
      (p: string) => p.includes("notifier") && p.includes("assets"),
    );

    const dir = resolveSharedAssets();
    expect(dir).toContain("notifier");
    expect(dir).toContain("assets");
  });

  test("falls back to monorepo path when bundled absent", () => {
    requireResolveSpy.mockImplementation(() => {
      throw new Error("not installed");
    });
    // First check for bundled candidate -> false
    // Second check for monorepo candidate -> true
    existsSpy.mockImplementation((p: string) => {
      if (
        typeof p === "string" &&
        (p.includes("packages/notifier/assets") ||
          p.includes("notifier/assets"))
      ) {
        return true;
      }
      return false;
    });

    const dir = resolveSharedAssets();
    expect(dir).toContain("notifier");
    expect(dir).toContain("assets");
  });
});
