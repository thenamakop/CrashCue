import path from "path";

describe("resolveCliAssetsDir", () => {
  test("resolves assets relative to compiled CLI", () => {
    const { resolveCliAssetsDir } = require("../utils/resolve-assets") as {
      resolveCliAssetsDir: () => string;
    };

    const moduleEntry = require.resolve("../utils/resolve-assets");
    const expected = path.join(path.dirname(moduleEntry), "assets");

    expect(resolveCliAssetsDir()).toBe(expected);
  });
});
