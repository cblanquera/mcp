#!/usr/bin/env node

const terminal = require('./dist/terminal');

terminal.default(process.argv.slice(2)).run().catch(err => {
  console.error(err);
  process.exit(1);
});