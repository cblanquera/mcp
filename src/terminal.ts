//fills
import './polyfills.js'; 
//node
import path from 'node:path';
//modules
import { Terminal } from '@stackpress/lib';
//src
import { cwd, build } from './config.js';
import Store from './store.js';
import server from './server.js';
import { getContextPack } from './helpers.js';

/**
 * Returns a terminal interface
 */
export default function terminal(argv = process.argv) {
  const terminal = new Terminal(argv, '[spmcp]');
  const verbose = terminal.expect<boolean>(['v', 'verbose'], false);
  const logger = async (type: string, message: string) => {
    await terminal.resolve('log', { type, message });
  };

  terminal.on('log', req => {
    const type = req.data.path('type', 'log');
    const ignore = [ 'log', 'info', 'system' ];
    if (!verbose && ignore.includes(type)) {
      return;
    }
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
    
    try {
      // Start the MCP server
      await terminal.resolve('log', { 
        type: 'success', 
        message: 'Starting MCP server...' 
      });
      await server(input, terminal);
    } catch (error) {
      await terminal.resolve('log', { 
        type: 'error', 
        message: `Failed to start MCP server: ${(error as Error).message}` 
      });
      throw error;
    }
  });

  return terminal;
}
