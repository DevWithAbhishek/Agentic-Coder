import { Agent, run, tool } from "@openai/agents";
import { z } from "zod";
import axios from "axios";

// Structured output
const GetWeatherResultSchema = z.object({
    city: z.string().describe("name of the city"),
    degree_c: z.number().describe("the temperature in degree celsius"),
    condition: z.string().optional().describe("condition of the weather")
})


const getWeatherTool = tool({
  name: "get_Weather",
  description: "Returns the current weather information for the given city",
  parameters: z.object({
    city: z.string().describe("name of the city"),
  }),
  execute: async function ({ city }) {
    // TODO: Replace this with API call
    // return `The weather of ${city} is 12 with some wind`;

    const url = `https://wttr.in./${city.toLowerCase()}?format=%C+%t/`;
    const response = await axios.get(url, { responseType: "text" });
    return `The weather of ${city} is ${response.data}`;
  },
});

const sendEmailTool = tool({
  name: "send_email",
  description: "This tool sends an email",
  parameters: z.object({
    toEmail: z.email().describe("email address to"),
    fromEmail: z.email().describe("email address from"),
    subject: z.string().describe("Subject of email"),
    body: z.string().describe("Body of email"),
  }),
  execute: async function ({ body, subject, toEmail, fromEmail }) {},
});

const agent = new Agent({
  name: "Weather Agent",
  instructions: `
     You are an expert weather agent that helps user to tell weather report
    `,
    tools: [getWeatherTool, sendEmailTool],
  outputType: GetWeatherResultSchema
});

async function main(query = "") {
  const result = await run(agent, query);
//   console.log(`Result: `, result.finalOutput);
  console.log(`Result: `, result.finalOutput); // can use degree_c or condition
}

main("What is the weather of Patiala?");
main("What is the weather of Goa, Delhi and Patiala?");
