import {
  Agent,
  run,
  tool,
  InputGuardrailTripwireTriggered,
} from "@openai/agents";
import "dotenv/config";
import { z } from "zod";

const sqlGuardrailAgent = new Agent({
  name: "SQL Guardrail",
  instructions: `
    Check if the query is safe to execute. The query should be read only and do not modify, delete or drop any table`,
  outputType: z.object({
    reason: z.string().optional().describe("reason if query is unsafe"),
    isSafe: z.boolean().describe("if query is safe to execute"),
  }),
});

const sqlGuardrail = {
  name: "SQL Guard",
  async execute({ agentOutput }) {
    const result = await run(sqlGuardrailAgent, agentOutput.sqlQuery);
    return {
      outputInfo: result.finalOutput.reason,
      tripwireTriggered: !result.finalOutput.isSafe,
    };
  },
};

const sqlAgent = new Agent({
  name: "sql_expert_agent",
  instructions: `You are an expert SQL agent that is specialized in generating SQL queries as per user request.

        Postgres Schema:
        -- Users table
        CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        -- Comments table
        CREATE TABLE comments (
            id SERIAL PRIMARY KEY,
            user_id BIGINT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            CONSTRAINT fk_comments_user
                FOREIGN KEY (user_id)
                REFERENCES users(id)
                ON DELETE CASCADE
        );
        `,
  outputType: z.object({
    sqlQuery: z.string().optional().describe("SQL query"),
  }),
});

async function main(query = "") {
  const result = await run(sqlAgent, query);
  console.log(`Query: \n${result.finalOutput.sqlQuery}\n`);
}

main("List all the users and comments");
main("Delete all the users");
