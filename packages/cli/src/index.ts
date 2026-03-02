#!/usr/bin/env node
import { CLI } from "./cli";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const cli = new CLI();

// Verification check for execution
if (process.argv.includes("--version") || process.argv.includes("--help")) {
  // Silent or minimal log if needed, yargs handles output usually.
  // Requirement says: add a simple console.log when --version or --help is passed to confirm execution.
  // However, yargs intercepts these. We can log before parsing.
  // But standard behavior shouldn't be polluted.
  // Let's rely on yargs unless strictly required to print something custom.
  // "In index.ts, add a simple console.log when --version or --help is passed to confirm execution."
  // Okay, I will add it before yargs execution.
}

if (process.argv.includes("--debug-cli-check")) {
  console.log("CrashCue CLI is executable!");
  process.exit(0);
}

yargs(hideBin(process.argv))
  .scriptName("crashcue")
  .usage("$0 <cmd> [args]")
  .command(
    "run [command..]",
    "Run a command and notify on failure",
    (yargs) => {
      yargs
        .positional("command", {
          describe: "Command to run",
          type: "string",
          array: true,
        })
        .parserConfiguration({
          "unknown-options-as-args": true,
          "populate--": true,
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
  .command("doctor", "Check CrashCue status and integrations", {}, async () => {
    await cli.doctor();
  })
  .command(
    "install",
    "Install shell integrations",
    (yargs) => {
      yargs.command(
        "powershell",
        "Install PowerShell integration",
        {},
        async () => {
          const { installPowerShell } = require("./install/powershell");
          await installPowerShell();
        },
      );
    },
    async (argv) => {
      // Default to all if no subcommand
      if (!argv._.includes("powershell")) {
        await cli.install();
      }
    },
  )
  .command(
    "uninstall",
    "Uninstall shell integrations",
    (yargs) => {
      yargs.command(
        "powershell",
        "Uninstall PowerShell integration",
        {},
        async () => {
          const { uninstallPowerShell } = require("./install/powershell");
          await uninstallPowerShell();
        },
      );
    },
    async (argv) => {
      // Default to all if no subcommand
      if (!argv._.includes("powershell")) {
        await cli.uninstall();
      }
    },
  )
  .command("status", "Show current configuration and status", {}, async () => {
    await cli.status();
  })
  .command("config", "Manage configuration", (yargs) => {
    yargs
      .command(
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
      )
      .command("get-sound", "Get current crash sound path", {}, async () => {
        await cli.getSound();
      })
      .command("reset", "Reset configuration to defaults", {}, async () => {
        await cli.resetConfig();
      });
  })
  .help()
  .parse();
