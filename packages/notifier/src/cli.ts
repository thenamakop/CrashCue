#!/usr/bin/env node
import { Notifier } from "./index";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const argv = yargs(hideBin(process.argv))
  .option("sound", {
    alias: "s",
    type: "string",
    description: "Path to sound file",
  })
  .option("volume", {
    alias: "v",
    type: "number",
    description: "Volume (0.0 - 1.0)",
  })
  .option("test", {
    alias: "t",
    type: "boolean",
    description: "Play test sound",
  })
  .help()
  .parseSync();

const notifier = new Notifier();

notifier
  .notify({
    sound: argv.sound,
    volume: argv.volume,
    test: argv.test,
  })
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error playing sound:", err.message);
    process.exit(1);
  });
