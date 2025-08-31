//node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import stream from 'node:stream';
//modules
import yaml from 'js-yaml';
//src
import type { Pack } from './types.js';
import { pwd, host, repo, token, model } from './config.js';

/**
 * Generates embeddings for an array of input texts using a remote API.
 */
export async function embed(texts: string[]): Promise<number[][]> {
  if (model === 'local') {
    //This transpiles to require() in cjs...
    //const { pipeline } = await import('@xenova/transformers');
    const { pipeline } = await new Function(
      "return import('@xenova/transformers')"
    )();
    const pipe = await pipeline(
      'feature-extraction', 
      'Xenova/all-MiniLM-L6-v2'
    );
    return Promise.all(texts.map(async t => {
      const e = await pipe(t, { pooling: 'mean', normalize: true });
      return Array.from(e.data);
    }));
  }
  //get embeddings (openrouter doesn't have an endpoint for this)
  const response = await fetch(`${host}/embeddings`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ input: texts, model })
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch embeddings: ${response.statusText}`);
  }
  const json = await response.json();
  return json.data.map((d: any) => d.embedding);
};

/**
 * Calculates the SHA-256 checksum of a file at the given path.
 */
export function sha256File(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    //Create a SHA-256 hash object
    const hash = crypto.createHash('sha256');
    //Read the file as a stream
    fs.createReadStream(filePath)
      //Update the hash with each chunk of data
      .on('data', data => hash.update(data))
      //When the stream ends, resolve with the hex digest
      .on('end', () => resolve(hash.digest('hex')))
      //If an error occurs, reject the promise
      .on('error', reject);
  });
};

/**
 * Ensures the specified directory exists, creating it recursively if necessary.
 */
export async function ensureDir(dirPath: string) {
  //Create the directory and all parent directories if they do not exist
  await fs.promises.mkdir(dirPath, { recursive: true });
};

/**
 * Downloads a file from the specified URL and saves it to the destination path.
 * Ensures the destination directory exists before writing.
 */
export async function download(url: string, destinationPath: string) {
  //Fetch the file from the URL
  const response = await fetch(url, { headers: { 'User-Agent': '@stackpress/mcp fetch' }});
  //Throw an error if the response is not OK
  if (!response.ok) throw new Error(`Download failed ${response.status} ${response.statusText} for ${url}`);
  //Ensure the destination directory exists
  await ensureDir(path.dirname(destinationPath));
  //Create a writable stream for the destination file
  const fileStream = fs.createWriteStream(destinationPath);
  await new Promise<void>((resolve, reject) => {
    //If the response has a body, pipe it to the file stream
    if (response.body) {
      stream.Readable.fromWeb(response.body as any)
        .pipe(fileStream)
        //Resolve when writing is finished
        .on('finish', resolve)
        //Reject if an error occurs
        .on('error', reject);
    } else {
      //Reject if there is no response body
      reject(new Error('No response body'));
    }
  });
};

/**
 * Unzips a gzip-compressed file from sourcePath to destinationPath.
 */
export function gunzip(sourcePath: string, destinationPath: string) {
  return new Promise<void>((resolve, reject) => {
    //Create a readable stream for the source file
    const inputFileStream = fs.createReadStream(sourcePath);
    //Create a writable stream for the destination file
    const outputFileStream = fs.createWriteStream(destinationPath);
    //Pipe the input through gunzip and then to the output
    inputFileStream
      .pipe(zlib.createGunzip())
      .pipe(outputFileStream)
      //Resolve when finished
      .on('finish', resolve)
      //Reject if an error occurs
      .on('error', reject);
  });
};

/**
 * Retrieves information from the package.json file.
 */
export function getPackageInfo(): any {
  const packageJsonPath = path.join(pwd, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`Could not find package.json at ${packageJsonPath}`);
  }
  return JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
};

/**
 * Retrieves information from the context-pack.yaml file.
 */
export function getContextPack() {
  const contextPackPath = path.join(pwd, 'context-pack.yaml');
  if (!fs.existsSync(contextPackPath)) {
    throw new Error(`Could not find context-pack.yaml at ${contextPackPath}`);
  }
  return yaml.load(fs.readFileSync(contextPackPath, 'utf-8')) as Pack;
};

/**
 * Retrieves the release URL for the current project.
 */
export function getReleaseURL() {
  const { version } = getContextPack();
  return `${repo}/releases/download/${version}`;
};

/**
 * Retrieves the manifest URL for the current project.
 */
export function getManifestURL() {
  return `${getReleaseURL()}/index-manifest.json`;
};

/**
 * Checks if the build directory contains any JSONL files.
 */
export function synced(build: string) {
  try { 
    return fs.readdirSync(build).some(file => file.endsWith('.jsonl')); 
  } catch { 
    return false; 
  }
};
