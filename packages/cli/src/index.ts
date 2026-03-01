#!/usr/bin/env node
import { CLI } from "./cli";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const cli = new CLI();

yargs(hideBin(process.argv))
  .scriptName("crashcue")
  .usage("$0 <cmd> [args]")
  .command(
    "run [command..]",
    "Run a command and notify on failure",
    (yargs) => {
      yargs.positional("command", {
        describe: "Command to run",
        type: "string",
        array: true,
      });
    },
    async (argv) => {
      const commandParts = argv.command as string[];
      if (!commandParts || commandParts.length === 0) {
        console.error("Please provide a command to run");
        process.exit(1);
      }
      const exitCode = await cli.run(commandParts);
      process.exit(exitCode);
    },
  )
  .command("test", "Play test sound", {}, async () => {
    await cli.test();
  })
  .command("mute", "Mute notifications", {}, async () => {
    await cli.mute();
  })
  .command("unmute", "Unmute notifications", {}, async () => {
    await cli.unmute();
  })
  .command("config", "Manage configuration", (yargs) => {
    yargs.command(
      "set-sound <path>",
      "Set custom crash sound",
      (yargs) => {
        yargs.positional("path", {
          describe: "Path to sound file",
          type: "string",
        });
      },
      async (argv) => {
        await cli.setSound(argv.path as string);
      },
    );
  })
  .help()
  .parse();
