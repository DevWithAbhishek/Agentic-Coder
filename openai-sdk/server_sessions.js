import { Agent, run, tool } from "@openai/agents";
import "dotenv/config";
import { z } from "zod";

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
  const result = await run(sqlAgent, query, {
    conversationId: `conv_691...`,
  });

  console.log("Result: ", result.finalOutput);
}

main("Hi My name is Piyush Garg");
main("Write a query to get all the users with my name");
