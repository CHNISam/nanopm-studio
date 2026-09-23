import test from "node:test";
import assert from "node:assert/strict";
import { cliHelp, parseCliArgs } from "../server/cli-args.js";

test("CLI arguments support explicit project, port, headless, and JSON output", () => {
  assert.deepEqual(
    parseCliArgs(["D:\\product", "--port", "4312", "--no-open", "--json"], {}),
    {
      project: "D:\\product",
      port: 4312,
      open: false,
      json: true,
      help: false,
    },
  );
  assert.equal(
    parseCliArgs(["--project", "D:\\explicit"], {
      NANOPM_PROJECT: "D:\\remembered",
    }).project,
    "D:\\explicit",
  );
  assert.match(cliHelp(), /--port <port>/);
});

test("CLI rejects ambiguous or invalid automation arguments", () => {
  assert.throws(() => parseCliArgs(["one", "two"], {}), /Only one/);
  assert.throws(() => parseCliArgs(["--port", "70000"], {}), /0 to 65535/);
  assert.throws(() => parseCliArgs(["--unknown"], {}), /Unknown option/);
  assert.throws(() => parseCliArgs(["--project"], {}), /requires a value/);
});
