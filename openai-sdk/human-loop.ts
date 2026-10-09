import { Agent, run, tool } from "@openai/agents";
import { z } from "zod";
import axios from "axios";
import readline from "node:readline/promises";


const getWeatherTool = tool({
    name: "get_Weather",
    description: "Returns the current weather information for the given city",
    parameters: z.object({
        city: z.string().describe("name of the city"),
    }),
    execute: async function ({ city }) {
        const url = `https://wttr.in./${city.toLowerCase()}?format=%C+%t/`;
        const response = await axios.get(url, { responseType: "text" });
        return `The weather of ${city} is ${response.data}`;
    },
});

const sendEmailTool = tool({
    name: "send_email",
    description: "This tool sends an email to the user",
    parameters: z.object({
        to: z.email().describe("email address to"),
        subject: z.string().describe("Subject of email"),
        html: z.string().describe("html Body of email"),
    }),
    needsApproval: true,
    execute: async function ({ to, subject, html }) {
        const API_KEY = process.env.AUTOSEND_API_KEY!;
        const response = await axios.post("https://api.autosend.com/v1/mails/send", {
            from: {
                email: 'ai@abhikmech91.com', // configured in Autosend account
                name: 'AI Weather Agent'
            },
            to: {
                email: to,
            },
            subject,
            html,
        }, {
            headers: {
                Authorization: `Bearer ${API_KEY}`
            }
        })
        return response.data;
    },
});


const agent = new Agent({
    name: "Weather Email Agent",
    instructions: `
     You are an expert agent in getting weather info and sending it to user via email
    `,
    tools: [getWeatherTool, sendEmailTool],
});

async function askForUserConfirmation(ques: string) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    const answer = await rl.question(`${ques}: Yes / No`);
    const normalizedAnswer = answer.toLowerCase();
    rl.close();
    return normalizedAnswer === 'y' || normalizedAnswer === 'yes';
}

async function main(query = "") {
    let result = await run(agent, query);
    let hasInterruptions = result.interruptions?.length > 0;
    while (hasInterruptions) {
        const currentState = result.state;
        for (const interrupt of result.interruptions) {
            if (interrupt.type === 'tool_approval_item') {
                const isAllowed = await askForUserConfirmation(`Agent ${interrupt.agent.name} is asking for calling the tool ${interrupt.name} with args ${interrupt.arguments}`);
                if (isAllowed) {
                    currentState.approve(interrupt);
                } else {
                    currentState.reject(interrupt);
                }
                result = await run(agent, currentState);
                hasInterruptions = result.interruptions?.length > 0;
            }
        }
    }
    console.log(result.finalOutput);
}

main("What is the weather of Goa, Delhi and Patiala? Send me on abhikmech91@gmail.com")


