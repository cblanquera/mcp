//node
import path from 'node:path';
//modules
import { Terminal } from '@stackpress/lib';
//src
import { cwd, build } from './config';
import Store from './store';
import server from './server';
import { getContextPack } from './helpers';

/**
 * Returns a terminal interface
 */
export default function terminal(argv = process.argv) {
  const terminal = new Terminal(argv, '[spmcp]');
  const logger = async (type: string, message: string) => {
    terminal.resolve('log', { type, message });
  };

  terminal.on('log', req => {
    const type = req.data.path('type', 'log');
    const message = req.data.path('message', '');
    if (!message) return;
    if (type === 'error') {
      terminal.control.error(message);
    } else if (type === 'success') {
      terminal.control.success(message);
    } else if (type === 'system') {
      terminal.control.system(message);
    } else {
      terminal.control.info(message);
    }
  });

  terminal.on('fetch', async req => {
    const pack = getContextPack();
    //ex. --output /some/path
    //ex. --output .
    let output = req.data.path('output', build);
    if (output.startsWith('.')) {
      output = path.resolve(cwd, output);
    }
    const names = pack.order
      //only include names that are requested
      //ex. --coding --documenting --testing
      .filter(name => req.data(name));
    // Fetch the latest data
    await Store.fetch(output, names, logger);
  });

  terminal.on('verify', async req => {
    //ex. --output /some/path
    //ex. --output .
    let output = req.data.path('output', build);
    if (output.startsWith('.')) {
      output = path.resolve(cwd, output);
    }
    // Fetch the latest data
    await Store.verified(output, logger);
  });

  terminal.on('serve', async req => {
    //ex. --input /some/path
    //ex. --input .
    let input = req.data.path('input', build);
    if (input.startsWith('.')) {
      input = path.resolve(cwd, input);
    }
    // Start the MCP server
    await terminal.resolve('log', { 
      type: 'success', 
      message: 'MCP server started!' 
    });
    await server(input);
  });

  return terminal;
}
