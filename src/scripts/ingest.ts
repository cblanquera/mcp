//node
import fs from 'node:fs';
import path from 'node:path';
//modules
import matter from 'gray-matter';
//src
import type { Chunk, RawChunk } from '../types';
import Store from '../store';
import { pwd, build } from '../config';
import { embed, getContextPack } from '../helpers';

const RULE_RE = /\b(MUST NOT|MUST|SHOULD)\b/;

/**
 * Returns a list of all .md files in the given root directory
 * that match the provided glob patterns.
 * (super-tiny glob: only ** / *.md and *.md)
 */
function globSync(root: string, patterns: string[]) {
  const out: string[] = [];
  //walks the given directory recursively returning all .md files
  function walk(dir: string) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.isFile() && e.name.endsWith('.md')) out.push(p);
    }
  }
  //start walking for each pattern's base path
  patterns.forEach(p => {
    const base = p.includes('**') ? p.split('**')[0] : '';
    walk(path.join(root, base));
  });
  //return the collected .md files
  return out;
}

/**
 * Converts a Markdown file into an array of chunks.
 * ex. ** / lib.md → [ { id: 'lib:lib.md#0', ... }, ... ]
 */
function mdToChunks(
  repo: string, 
  filePath: string
) {
  //read the markdown file
  const raw = fs.readFileSync(filePath, 'utf8');
  //YAML front-matter → data
  const { content, data } = matter(raw); 
  //split content into lines
  const lines = content.split('\n');

  const chunks: RawChunk[] = [];
  let current: string[] = [];
  let headings: string[] = [];
  let sectionIdx = 0;

  //flushes the current chunk
  const flush = () => {
    //create the chunk
    const text = current.join('\n').trim();
    if (!text) return;
    //determine the rule level
    const ruleMatch = text.match(RULE_RE)?.[1] as RawChunk['rule_level'];
    //push the chunk
    chunks.push({
      id: `${repo}:${filePath}#${sectionIdx++}`,
      repo,
      file: filePath,
      headings: [...headings],
      rule_level: ruleMatch,
      version: data?.version,
      updated: data?.updated,
      text
    });
    current = [];
  };

  //process each line
  for (const line of lines) {
    //check for headings
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      //flush the current chunk
      flush();
      const level = h[1].length;
      const title = h[2].trim();
      headings = headings.slice(0, level-1);
      headings[level-1] = title;
      continue;
    }
    current.push(line);
  }
  flush();
  return chunks;
}

/**
 * Ingests all Markdown files in the specified workspace.
 */
async function main() {
  //load the context pack. ex.
  // pack: "Chris Context Pack"
  // version: 0.0.1
  // order: [ coding, documenting, testing ]
  // budgets:
  //   max_chunk_tokens: 400
  //   overlap_tokens: 32
  const pack = getContextPack();

  //initialize the store
  const store = new Store(build);

  //ingest each repo
  for (const repo of pack.order) {
    const depRank = pack.order.indexOf(repo) + 1;
    const docsRoot = path.join(pwd, 'docs');
    //find all markdown files in the repo
    const files = globSync(docsRoot, [ `${repo}/**/*.md` ]);
    //filter out any files starting with `.` (these are private)
    const rawChunks = files
      .filter(f => !path.basename(f).startsWith('.'))
      .flatMap(f => mdToChunks(repo, f));
    // Optional: simple size control—merge small adjacent chunks, etc.

    // Embed in batches
    const batchSize = 64;
    for (let i = 0; i < rawChunks.length; i += batchSize) {
      const batch = rawChunks.slice(i, i + batchSize);
      const embs = await embed(batch.map(b => b.text));
      console.log(
        'Embedded', 
        rawChunks[i].repo, 
        rawChunks[i].file,
        `${i}-${i + batch.length} / ${rawChunks.length}`
      );
      batch.forEach((b, j) => {
        const c: Chunk = {
          ...b,
          dependency_rank: depRank,
          embedding: embs[j]
        };
        store.append(repo, c);
      });
    }
    console.log(`Ingested ${repo}: ${rawChunks.length} chunks`);
  }
}

main().catch(e => { 
  console.error(e); 
  process.exit(1); 
});
