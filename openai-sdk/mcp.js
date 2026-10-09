import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";
import { z } from "zod";

const server = new McpServer({
  name: "Demo",
  version: "1.0.0",
});

async function getWeatherCity(city = "") {
  if (city.toLowerCase() === "patiala") {
    return { temp: "30C", forecast: "chances of severe rainfall" };
  }
  if (city.toLowerCase() === "delhi") {
    return { temp: "35C", forecast: "chances of low rainfall" };
  }
  return { temp: null, error: "Unable to gt the data" };
}

server.tool(
  "getWeatherDataByCityName",
  { city: z.string() },
  async ({ city }) => {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(await getWeatherCity(city)),
        },
      ],
    };
  },
);

async function init() {
    // Via standard input output - code access to end user
    const transport = new StdioServerTransport();
    await server.connect(transport);
};

// You can use SSE Transport too (Server Sent Events Transport) - remote access

init();
