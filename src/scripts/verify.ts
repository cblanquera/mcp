import terminal from '../terminal.js';

const argv = [
  'verify',
  ...process.argv.slice(2)
];

terminal(argv).run().catch(err => {
  console.error(err);
  process.exit(1);
});
