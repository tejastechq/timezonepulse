#!/usr/bin/env node

// This script will manually initialize the server

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { SequentialThinkingServer } = require('@modelcontextprotocol/server-sequential-thinking');

// Initialize and start the server
async function main() {
  try {
    console.error("Starting Sequential Thinking MCP Server...");
    const server = new SequentialThinkingServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Server started successfully");
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
}

main().catch(console.error);
