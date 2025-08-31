# Stackpress Context Provider

Experimental MCP server implementation to provide Stackpress context to AI utilities like cline.

## 1. Install

The following sections describe several ways to install this MCP.

> Make sure you are using Node version 22.

### 1.1. Option 1: Using NPX

Run the following commands in the same folder your other MCP servers are.

```bash
$ mkdir stackpress-mcp
$ cd stackpress-mcp
$ npx --y @stackpress/mcp fetch --output ./data
$ npx --y @stackpress/mcp verify --output ./data
$ pwd
```

Copy the response from `pwd` and edit your MCP server configuration by following one of the options below.

#### 1.1.1 Using NPX With Claude Desktop

Add the following configuration to your `claude_desktop_config.json` where `[pwd]` is the response from the `pwd` command earlier.

```json
{
  "mcpServers": {
    "stackpress-context": {
      "command": "npx",
      "args": [ 
        "-y", 
        "@stackpress/mcp", 
        "serve", 
        "--input", 
        "[pwd]/data" 
      ]
    }
  }
}
```

#### 1.1.2 Using NPX With Cline

Add the following configuration to your `cline_mcp_settings.json` where `[pwd]` is the response from the `pwd` command earlier.

```json
{
  "name": "stackpress-context",
  "command": "npx",
  "args": [ 
    "-y", 
    "@stackpress/mcp", 
    "serve", 
    "--input", 
    "[pwd]/data" 
  ]
}
```

### 1.2. Option 2: Direct From the Repository

Run the following commands in the same folder your other MCP servers are.

```bash
$ git clone https://github.com/stackpress/mcp.git stackpress-mcp
$ cd stackpress-mcp
$ npm i
$ npm run build
$ npm run fetch --output ./data
$ npm run verify --output ./data
$ pwd
```

Copy the response from `pwd` and edit your MCP server configuration by following one of the options below.

#### 1.2.1. From the Repository With Claude Desktop

Add the following configuration to your `claude_desktop_config.json`.

```json
{
  "mcpServers": {
    "stackpress-context": {
      "command": "node",
      "args": [ 
        "[pwd]/dist/scripts/serve.js", 
        "--input", 
        "[pwd]/data" 
      ]
    }
  }
}
```

#### 1.2.2. From the Repository With Cline

Add the following configuration to your `cline_mcp_settings.json`.

```json
{
  "name": "stackpress-context",
  "command": "node",
  "args": [ 
    "[pwd]/dist/scripts/serve.js", 
    "--input", 
    "[pwd]/data" 
  ]
}
```

### 1.3. From Prompt

 1. Copy and paste the following prompt.

```
Set up the MCP server from https://github.com/stackpress/mcp while adhering to these MCP server installation rules:
- Start by loading the MCP documentation.
- Use "github.com/stackpress/mcp" as the server name in cline_mcp_settings.json.
- Create the directory for the new MCP server before starting installation.
- Make sure you read the user's existing cline_mcp_settings.json file before editing it with this new mcp, to not overwrite any existing servers.
- Use commands aligned with the user's shell and operating system best practices.
- Once installed, demonstrate the server's capabilities by using one of its tools.
Here is the project's README to help you get started:
```

 2. Then paste in this README.

## 2. Usage

You can manually start the server like the following.

```bash
$ npm start --input [pwd]/.data
```

Or you can run it manually like the following.

```bash
$ node [pwd]/dist/scripts/serve.js --input [pwd]/.data
```

If you installed via `npx`, you can start the server like the following.

```bash
$ npx @stackpress/mcp serve --input [pwd]/.data
```

## 2.1. Fetching Updated Context

You can manually fetch and verify the Stackpress context like the following.

```bash
$ npm run fetch --output [pwd]/.data
$ npm run verify --output [pwd]/.data
```

Or you can run it manually like the following.

```bash
$ node [pwd]/dist/scripts/fetch.js --output [pwd]/.data
$ node [pwd]/dist/scripts/verify.js --output [pwd]/.data
```

If you installed via `npx`, you can start the server like the following.

```bash
$ npx @stackpress/mcp fetch --output [pwd]/.data
$ npx @stackpress/mcp verify --output [pwd]/.data
```

## 2.2. Upgrading Search Model

The MCP uses `Xenova/all-MiniLM-L6-v2` locally to determine the best search query term for the MCP. Think about it like random prompt → correct query → ask MCP. You can upgrade this to use your OpenAI key by adding `OPENAI_HOST`, `OPENAI_KEY` and `EMBEDDING_MODEL` environment variables in your MCP settings like the following.

```json
{
  "name": "stackpress-context",
  "command": "node",
  "command": "npx",
  "args": [ 
    "-y", 
    "@stackpress/mcp", 
    "serve", 
    "--input", 
    "[pwd]/.data" 
  ],
  "env": {
    "OPENAI_HOST": "https://api.openai.com/v1",
    "OPENAI_KEY": "sk-xxx",
    "EMBEDDING_MODEL": "text-embedding-3-small"
  }
}
```

> WARNING: OpenRouter doesn't support the `/embeddings` API endpoint. This is called when providing an OpenAI compatible host.

## 3. Maximizing Your Knowledge Base

Create a rule (markdown file) called **Stackpress-MCP-Rule.md** in your knowledge folder (ex. `.clinerules`) with the following context.

```md
# Rule: Using the Stackpress MCP

If the users mentions "idea", "ingest", "inquire", "reactus" or "stackpress", you must do the following.

- If the user asks about library rules, guidelines, or context, use the MCP tool `stackpress-context.search_context`.
- If the user asks for a compact summary of rules for a task, use the MCP tool `stackpress-context.build_brief`.
- Always prefer these MCP tools over answering from memory.
```