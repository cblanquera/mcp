//node
import fs from 'node:fs';
import path from 'node:path';
//src
import type { Manifest } from './types';
import { 
  sha256File, 
  download, 
  gunzip, 
  synced,
  getReleaseURL, 
  getManifestURL 
} from './helpers';
import type { Chunk } from './types';

/**
 * Calculates the Euclidean norm (magnitude) of a vector.
 */
export function vectorNorm(vector: number[]): number {
  return Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
}

/**
 * Calculates the dot product of two vectors.
 */
export function dotProduct(vectorA: number[], vectorB: number[]): number {
  return vectorA.reduce((sum, value, index) => sum + value * vectorB[index], 0);
}

/**
 * Calculates the cosine similarity between two vectors.
 */
export function cosineSimilarity(vectorA: number[], vectorB: number[]): number {
  const normA = vectorNorm(vectorA);
  const normB = vectorNorm(vectorB);
  return dotProduct(vectorA, vectorB) / (normA * normB || 1);
}

export default class JsonlStore {
  /**
   * Fetches index files listed in the manifest, downloads, verifies, 
   * and unzips them. Optionally filters by provided index names.
   */
  public static async fetch(
    build: string,
    indexNames?: string[], 
    logger = (_type: string, _message: string) => {}
  ) {
    //Fetch and parse the manifest JSON
    const manifestURL = getManifestURL();
    logger('log', `Fetching manifest from ${manifestURL}…`);
    const manifest = await (await fetch(manifestURL)).json() as Manifest;
    //Determine which files to fetch (all or filtered by indexNames)
    const selectedFiles = indexNames?.length
      ? manifest.files.filter(file => indexNames.includes(file.repo) 
        || indexNames.includes(path.basename(file.name, '.jsonl.gz')))
      : manifest.files;
    //Process each selected file
    for (const file of selectedFiles) {
      //Build paths for the gzip file and the output file
      const gzipFilePath = path.join(build, file.name);
      const outputFilePath = path.join(build, file.unpacked);
      const url = `${getReleaseURL()}/${file.name}`;
      //Download the gzip file
      logger('log', `Downloading ${file.name}…`);
      await download(url, gzipFilePath);
      //Calculate and verify the checksum
      const checksum = await sha256File(gzipFilePath);
      if (checksum !== file.sha256_gz) {
        throw new Error(
          `Checksum mismatch for ${file.name}: got ${checksum}, expected ${file.sha256_gz}`
        );
      }
      //Unzip the file to its destination
      await gunzip(gzipFilePath, outputFilePath);
      logger('log', `Ready: ${outputFilePath}`);
    }
    //Write a state file with version and installation timestamp
    await fs.promises.writeFile(
      path.join(build, 'state.json'),
      JSON.stringify({ 
        version: manifest.version, 
        installedAt: new Date().toISOString() 
      }, null, 2)
    );
    logger('success', `Indexes installed for ${manifest.version} in ${build}`);
  }

  /**
   * Verifies that all index files exist and match their expected 
   * checksums.
   */
  public static async verified(
    build: string,
    logger = (_type: string, _message: string) => {}
  ) {
    //check if any jsonl files exist
    if (!synced(build)) {
      logger('error', 'No .jsonl files found');
      return false;
    }

    let manifest: Manifest;
    try { // to fetch and parse the manifest JSON
      const response = await fetch(getManifestURL());
      manifest = await response.json();
    } catch(e) {
      logger('error', `Failed to fetch manifest: ${(e as Error).message}`);
      return false;
    }
    
    //Check each file listed in the manifest
    for (const file of manifest.files) {
      //Build the path for the gzip file
      const gzipFilePath = path.join(build, file.name);
      //Check if the file exists
      if (!fs.existsSync(gzipFilePath)) {
        logger('error', `File not found: ${gzipFilePath}`);
        return false;
      }
      //Calculate and verify the checksum
      const checksum = await sha256File(gzipFilePath);
      if (checksum !== file.sha256_gz) {
        logger(
          'error', 
          `Checksum mismatch for ${file.name}: got ${checksum}, expected ${file.sha256_gz}`
        );
        return false;
      }
    }
    logger('success', 'All files verified');
    return true;
  }

  //The root directory for the JSONL files.
  public readonly dir: string;

  /**
   * Sets the root directory for the JSONL files.
   */
  public constructor(dir: string) {
    this.dir = dir;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive:true });
    }
  }

  /**
   * Gets the file path for a specific repository.
   */
  public fileFor(repo: string) { 
    return path.join(this.dir, `${repo}.jsonl`); 
  }

  /**
   * Appends a chunk of data to the JSONL file for a specific repository.
   */
  public append(repo: string, chunk: Chunk){
    fs.appendFileSync(this.fileFor(repo), JSON.stringify(chunk) + '\n', 'utf8');
  }

  /**
   * Reads the JSONL file for a specific repository.
   */
  public read(repo?: string): Chunk[] {
    if (repo) return this._readFile(this.fileFor(repo));
    // read all
    const files = fs.readdirSync(this.dir).filter(f => f.endsWith('.jsonl'));
    return files.flatMap(f => this._readFile(path.join(this.dir, f)));
  }

  /**
   * Searches for chunks that match the query embedding.
   */
  public search(
    queryEmbedding: number[], 
    opts: { 
      repo?: string; 
      k: number; 
      mustOnly?: boolean; 
      section?: string; 
      order?: string[] 
    }
  ) {
    const items = this.read(opts.repo);
    const scored = items
      .filter(c => !opts.mustOnly || c.rule_level === 'MUST')
      .map(c => ({c, score: cosineSimilarity(queryEmbedding, c.embedding)}));

    // Optional: boost upstream deps via dependency_rank
    scored.forEach(s => {
      if (typeof s.c.dependency_rank === 'number') {
        s.score *= (1 + (0.1 * (1 / (s.c.dependency_rank || 1))));
      }
    });

    return scored.sort((a,b)=>b.score-a.score).slice(0, opts.k).map(s=>s.c);
  }

  /**
   * Reads a JSONL file and returns an array of chunks.
   */
  private _readFile(filepath: string): Chunk[] {
    if (!fs.existsSync(filepath)) return [];
    return fs
      .readFileSync(filepath, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map(l => JSON.parse(l));
  }
};
