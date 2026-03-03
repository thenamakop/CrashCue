jest.mock("../../../shared-assets/src/index", () => ({
  resolveAssetsDir: jest.fn(),
}));

describe("resolveSharedAssets", () => {
  test("delegates to shared-assets resolver", () => {
    const sharedAssets = require("../../../shared-assets/src/index") as {
      resolveAssetsDir: jest.Mock;
    };
    const { resolveSharedAssets } =
      require("../utils/resolve-shared-assets") as {
        resolveSharedAssets: () => string;
      };

    sharedAssets.resolveAssetsDir.mockReturnValue("C:\\mock\\assets");

    const dir = resolveSharedAssets();
    expect(sharedAssets.resolveAssetsDir).toHaveBeenCalledTimes(1);
    expect(dir).toBe("C:\\mock\\assets");
  });
});
