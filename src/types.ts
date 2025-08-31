//Types for building:

export type RawChunk = {
  id: string,
  repo: string,
  file: string,
  headings: string[],
  rule_level?: 'MUST' | 'SHOULD' | 'MUST NOT',
  version?: string,
  updated?: string,
  text: string
};

export type Chunk = RawChunk & {
  dependency_rank?: number,
  embedding: number[]
};

export type Pack = { 
  pack: string,
  version: string,
  order: string[],
  budgets: { 
    max_chunk_tokens: number, 
    overlap_tokens: number 
  } 
};

//Types for fetching:

export type Manifest = {
  version: string,
  files: {
    repo: string,
    name: string,
    unpacked: string,
    sha256_gz: string
  }[];
};