import {
  Agent,
  run,
  tool,
  InputGuardrailTripwireTriggered,
} from "@openai/agents";
import "dotenv/config";
import { z } from "zod";

let sharedHistory = [];

const executeSQ = tool({
  name: "execute_sql",
  description: `
    This executes the SQL query
    `,
  parameters: z.object({
    sql: z.string().describe("this is the sql query"),
  }),
  execute: async function ({ sql }) {
    console.log(`[SQL]: Execute ${sql}`);
    return "done";
  },
});

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
  //   const result = await run(sqlAgent, query);
  //   console.log("History: ", result.history);
  //   console.log("Result: ", result.finalOutput);

  // Store the message in DB
  sharedHistory.push({ role: "user", content: "q" });
  const result = await run(sqlAgent, sharedHistory);
  sharedHistory = result.history;

  //   console.log("History: ", result.history);
  console.log("Result: ", result.finalOutput);
}

main("Get me all the users");

// TURN 1
main("Hi My name is Piyush Garg").then(() => {
  // TURN 2 - NO MEMORY OF TURN 1 without a thread for shared history
  main("Get all the users with my name");
});

/**
 * Use JS Debug Terminal to understand the flow (VS Code)
 * Go through each iteration on "node conversation.js"
 * 
 */