/**
 * Compress all .jsonl files in /indexes to .jsonl.gz, compute sizes + sha256
 */
//node
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
//modules
import { Terminal } from '@stackpress/lib';
//src
import { model, build } from '../config';
import { getContextPack } from '../helpers';

type FileRec = {
  // e.g., lib
  repo: string,
  // e.g., lib.jsonl.gz
  name: string,       
  // e.g., lib.jsonl 
  unpacked: string,
  bytes_gz: number,
  bytes: number,
  sha256_gz: string
};

/**
 * Gets the size of a file.
 */
async function statSize(p: string): Promise<number> {
  return (await fs.promises.stat(p)).size;
}

/**
 * Computes the SHA-256 hash of a file.
 */
async function sha256File(p: string): Promise<string> {
  const hash = crypto.createHash('sha256');
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(p)
      .on('data', (d) => hash.update(d))
      .on('end', () => resolve())
      .on('error', reject);
  });
  return hash.digest('hex');
}

/**
 * Compresses a file using gzip.
 */
async function gzipFile(inPath: string, outPath: string) {
  await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
  return new Promise<void>((resolve, reject) => {
    const inp = fs.createReadStream(inPath);
    const out = fs.createWriteStream(outPath);
    const gz = zlib.createGzip({ level: 9 });
    inp.pipe(gz).pipe(out).on('finish', () => resolve()).on('error', reject);
  });
}

/**
 * Zips the specified files.
 */
async function main() {
  //use terminal to process the argv
  const terminal = new Terminal(process.argv, '[spmcp]');
  //if build directory is missing
  if (!fs.existsSync(build)) {
    console.error(`Missing ${build}. Put raw .jsonl files there (e.g., lib.jsonl).`);
    process.exit(2);
  }
  //get list of jsonl files
  const files = (await fs.promises.readdir(build)).filter((f) => f.endsWith('.jsonl'));
  if (!files.length) {
    console.error(`No .jsonl files in ${build}. Nothing to package.`);
    process.exit(0);
  }
  //get context pack info
  const pack = getContextPack();
  //form the manifest
  const manifest = {
    pack: pack.pack,
    version: pack.version,
    created: new Date().toISOString(),
    requires: { 
      embedding_model: terminal.data.model || model, 
      embedding_dim: parseInt(terminal.data.dim || '1536', 10)
    },
    files: [] as FileRec[],
  };
  //process each file
  for (const f of files) {
    // e.g., indexes/lib.jsonl
    const inPath = path.join(build, f);
    // e.g., lib
    const repo = path.basename(f, '.jsonl');
    const gzName = `${repo}.jsonl.gz`;
    const outPath = path.join(build, gzName);

    // Compress
    await gzipFile(inPath, outPath);

    // Sizes + checksum
    const bytes = await statSize(inPath);
    const bytes_gz = await statSize(outPath);
    const sha256_gz = await sha256File(outPath);

    manifest.files.push({
      repo,
      name: gzName,
      unpacked: f,
      bytes_gz,
      bytes,
      sha256_gz,
    });

    console.log(`✔ ${repo}: ${bytes}B → ${bytes_gz}B, sha256=${sha256_gz.slice(0, 12)}…`);
  }

  const manifestPath = path.join(build, 'index-manifest.json');
  await fs.promises.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`\nWrote ${manifestPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
