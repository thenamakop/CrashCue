declare module "conf" {
  interface Options<T> {
    defaults?: T;
    configName?: string;
    projectName?: string;
    cwd?: string;
    accessPropertiesByDotNotation?: boolean;
  }

  class Conf<T = any> {
    constructor(options?: Options<T>);
    get(key: string): any;
    set(key: string, value: any): void;
    delete(key: string): void;
    clear(): void;
    store: T;
  }
  export = Conf;
}
