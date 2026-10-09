import {
    Agent,
    run,
    MCPServerStreamableHttp,
} from "@openai/agents";
import "dotenv/config";

const githubMcpServer = new MCPServerStreamableHttp({
    url: "https://gitmcp.io/openai/codex",
    name: 'GitMCP Documentation Server',
})

const agent = new Agent({
    name: 'MCP Assistant',
    instructions: 'You must always use the MCP tools to answer questions.',
    mcpServers: [githubMcpServer]
});

async function main(query: string) {
    await githubMcpServer.connect();

    const result = await run(agent, query);
    console.log(result.finalOutput);

    await githubMcpServer.close();
}

main("What is this repository about?");