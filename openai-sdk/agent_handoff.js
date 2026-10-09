import "dotenv/config";
import { Agent, run, tool } from "@openai/agents";
import { RECOMMENDED_PROMPT_PREFIX } from "@openai/agents-core/extensions";
import { z } from "zod";
import fs from "node:fs/promises";

// Refund agent
const processRefund = tool({
  name: "process_refund",
  description: "This tool processes the refund for a customer",
  parameters: z.object({
    customerId: z.string().describe("id of the customer"),
    reason: z.string().describe("reason for refund"),
  }),
  execute: async function ({ customerId, reason }) {
    await fs.appendFile(
      "./refunds.txt",
      `Refund for Customer with${customerId}, due to ${reason}\n\n`,
      "utf-8",
    );
    return { refundIssued: true };
  },
});

const refundAgent = new Agent({
  name: "refund_agent",
  instructions: "You are an expert in issuing refunds to the customer",
  tools: [processRefund],
});

// Sales Agent
const fetchAvailablePlans = tool({
  name: "fetch_available_plans",
  description: "fetches the available plans for internet",
  parameters: z.object({}),
  execute: async function () {
    return [
      { plan_id: "1", price_in_inr: 399, speed: "30 MB/s" },
      { plan_id: "2", price_in_inr: 999, speed: "100 MB/s" },
      { plan_id: "3", price_in_inr: 2999, speed: "200 MB/s" },
    ];
  },
});

const salesAgent = new Agent({
  name: "Sales Agent",
  instructions: `
        You are an expert sales agent for an internet broadband connection provider.
        Talk to the user and help them with what they need
    `,
  tools: [
    fetchAvailablePlans,
    refundAgent.asTool({
      toolName: "refund_expert",
      toolDescription: "Handles refund questions and requests",
    }),
  ],
});

// Reception Agent
const receptionAgent = new Agent({
  name: "Reception Agent",
  instructions: `${RECOMMENDED_PROMPT_PREFIX}
    You are the customer facing agent expert in understanding what customer needs and then route them or handoff them to the right agent`,
  handoffDescription: `You have two agents available:
        - salesAgent: Expert in handling queries like all plans and pricing available.
        - refundAgent: Expert in handling user queries for existing customers and issue refunds and help them.
    `,
  handoffs: [salesAgent, refundAgent],
});

async function main(query = "") {
  const result = await run(receptionAgent, query);
  console.log("Result: ", result.finalOutput);
  console.log("History: ", result.history);
}

main("Hey There, Can you tell me about available plans best for me?");
main(
  "Hi There, I am a customer having id cust_234 and i want to have refund request as I am facing slow internet speed",
);
