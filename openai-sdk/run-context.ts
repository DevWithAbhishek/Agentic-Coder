import { Agent, run, tool, RunContext } from "@openai/agents";
import 'dotenv/config';
import { z } from "zod";

interface MyContext {
    userId: string;
    userName: string;

    // Dependencies
    fetchUserInfoFromDb: () => Promise<string>
}

const getUserInfoTool = tool({
    name: 'get_user_info',
    description: "Get the user info",
    parameters: z.object({}),
    execute: async (_, ctx?: RunContext<MyContext>): Promise<string | undefined> => {
        const result = await ctx?.context.fetchUserInfoFromDb();
        return result;
    }
})

const customerSupportAgent = new Agent<MyContext>({
    name: 'Customer Support Agent',
    tools: [getUserInfoTool],
    instructions: `You are an expert customer support agent`
});

async function main(query: string, ctx: MyContext) {
    const result = await run(customerSupportAgent, query, { context: ctx });
    console.log("Result: ", result.finalOutput);
}

main("Hello, I am unable to login", {
    userId: "1", userName: "Abhishek Kumar", fetchUserInfoFromDb: async () => `UserId=1,Username=Piyush`
});


// Run: tsx run-context.ts