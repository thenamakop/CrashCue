declare module "play-sound" {
  interface Player {
    play(file: string, options?: any, callback?: (err: any) => void): void;
    play(file: string, callback?: (err: any) => void): void;
  }

  function createPlayer(options?: any): Player;
  export = createPlayer;
}
