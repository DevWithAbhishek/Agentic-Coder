import {
  Agent,
  run,
  tool,
  InputGuardrailTripwireTriggered,
} from "@openai/agents";
import "dotenv/config";
import { z } from "zod";

const mathInputAgent = new Agent({
  name: "Math query checker",
  instructions: `You are an input guardrail agent that checks if the user query is a math problem
        Rules:
        - The question has to strictly a maths question only.
        - Reject any other kind of request even if related to maths.
        `,
  outputType: z.object({
    isValidMathsQuestions: z
      .boolean()
      .describe("if the question is a maths problem?"),
    reason: z.string().optional().describe("Reason to reject"),
  }),
});

const mathInputGuardrail = {
  name: "Math Homework Guardrail",
  execute: async ({ input }) => {
    console.log(`TOD: We need to validate this input ${input}`);
    const result = await run(mathInputAgent, input);
    return {
      outputInfo: result.finalOutput.reason,
      tripwireTriggered: !result.finalOutput.isValidMathsQuestions,
    }; // <-- this value decides if we have to trigger or not
  },
};

const mathsAgent = new Agent({
  name: "maths_agent",
  instructions: "You are an expert maths AI agent",
  inputGuardrails: [mathInputGuardrail],
});

async function main(query = "") {
  try {
    const result = await run(mathsAgent, query);
    console.log(`Result: `, result.finalOutput);
  } catch (error) {
    if (error instanceof InputGuardrailTripwireTriggered) {
      console.log(`Invalid input: Rejected because ${error.message}`);
    }
  }
}

main("What is 2*3 / 5  + 10");
main("Write a JS code to add numbers in JS");
