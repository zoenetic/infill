#!/usr/bin/env node
import { register } from "tsx/esm/api";

// Register tsx so the CLI can load a user's spec (TypeScript), then run the
// compiled CLI. tsx is only needed for that dynamic spec import — the CLI's own
// code ships compiled in dist.
register();
await import("../dist/cli.js");
