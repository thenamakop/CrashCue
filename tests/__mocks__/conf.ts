const conf = jest.fn().mockImplementation(() => ({
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
  store: {},
  path: "/mock/path/config.json",
}));

export default conf;
