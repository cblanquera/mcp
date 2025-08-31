// modules
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// src
import Store from './store.js';
import { embed, getContextPack } from './helpers.js';

export const pack = getContextPack();

//-------------------------------------------------------------------//
// Zod shapes (ZodRawShape)

export const searchContextShape = {
  query: z.string(),
  repo: z.string().optional(),
  section: z.string().optional(),
  must_only: z.boolean().optional(),
  k: z.number().int().positive().default(6)
};

export const getRuleShape = {
  id: z.string(),
};

export const dependencyGraphShape = {
  repo: z.string().optional(),
};

export const buildBriefShape = {
  task: z.string(),
  repos: z.array(z.string()),
  tokens: z.number().int().positive().default(6000)
};

//--------------------------------------------------------------------//
// Server Features

export function registerSearchContext(server: McpServer, store: Store) {
  server.registerTool(
    'search_context',
    {
      title: 'Semantic search over Stackpress docs',
      description: 'Semantic search over Stackpress docs',
      inputSchema: searchContextShape,
    },
    async (args) => {
      // defaults applied here; k is guaranteed number
      const { query, repo, must_only, k } = z.object(searchContextShape).parse(args);
      const [q] = await embed([String(query)]);
      const results = store.search(q, { repo, k, mustOnly: !!must_only, order: pack.order });
      return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
    }
  );
};

export function registerGetRule(server: McpServer, store: Store) {
  server.registerTool(
    'get_rule',
    {
      title: 'Fetch a chunk by id',
      description: 'Fetch a chunk by id',
      inputSchema: getRuleShape,
    },
    async (args) => {
      const { id } = z.object(getRuleShape).parse(args);
      const [repo] = String(id).split(':');
      const items = store.read(repo).filter((c) => c.id === id);
      return {
        content: [{ type: 'text', text: items.length ? JSON.stringify(items[0], null, 2) : 'NOT_FOUND' }],
      };
    }
  );
};

export function registerDependencyGraph(server: McpServer) {
  server.registerTool(
    'dependency_graph',
    {
      title: 'Returns ordered dependencies',
      description: 'Returns ordered dependencies',
      inputSchema: dependencyGraphShape,
    },
    async () => ({
      content: [{ type: 'text', text: JSON.stringify({ order: pack.order }, null, 2) }],
    })
  );
};

export function registerBuildBrief(server: McpServer, store: Store) {
  server.registerTool(
    'build_brief',
    {
      title: 'Assemble a compact brief for a task from top results across repos',
      description: 'Assemble a compact brief for a task from top results across repos',
      inputSchema: buildBriefShape,
    },
    async (args) => {
      // tokens is guaranteed number here
      const { task, repos } = z.object(buildBriefShape).parse(args);
      const [q] = await embed([String(task)]);
      const perRepo = repos.map(r => ({
        repo: r,
        hits: store
          .search(q, { repo: r, k: 8, mustOnly: false })
          .sort((a, b) => {
            const aw = a.rule_level === 'MUST' ? 2 : a.rule_level === 'SHOULD' ? 1.2 : 1;
            const bw = b.rule_level === 'MUST' ? 2 : b.rule_level === 'SHOULD' ? 1.2 : 1;
            return bw - aw;
          })
          .slice(0, 8)
      }));

      const brief: string[] = [
        `# Stackpress Task Brief`,
        `Task: ${task}`,
        ``,
        `**Rules precedence:** MUST > SHOULD > MUST NOT. Upstream (lib) overrides downstream on conflict.`,
        ``
      ];
      for (const { repo, hits } of perRepo) {
        brief.push(`## ${repo}`);
        for (const h of hits) {
          brief.push(`### ${h.headings.join(' › ')}`);
          if (h.rule_level) brief.push(`**${h.rule_level}**`);
          brief.push(h.text, '');
        }
      }
      // you can use `tokens` later to trim to budget
      return { content: [{ type: 'text', text: brief.join('\n') }] };
    }
  );
};

//--------------------------------------------------------------------//
// Main Function

export default async function serve(input: string) {

  const store = new Store(input);
  const server = new McpServer({
    name: pack.pack,     // ensure these are strings
    version: pack.version,
  });

  registerSearchContext(server, store);
  registerGetRule(server, store);
  registerDependencyGraph(server);
  registerBuildBrief(server, store);

  const transport = new StdioServerTransport();
  await server.connect(transport);
};
