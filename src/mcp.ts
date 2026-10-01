import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createServer } from './server.js';

const assetDir = process.argv.includes('--assets') ? process.argv[process.argv.indexOf('--assets') + 1] : path.join(__dirname, '../assets');
const rootArg = process.argv.includes('--root') ? process.argv[process.argv.indexOf('--root') + 1] : undefined;
const preferences = process.env.PLUGIN_DATA ? path.join(process.env.PLUGIN_DATA, 'projects.json') : undefined;
const server = createServer(readFileSync(path.join(assetDir, 'board.html'), 'utf8'), rootArg ?? process.env.MYISSUE_ROOT, preferences);
server.connect(new StdioServerTransport()).catch(error => { console.error(error); process.exitCode = 1; });
