import { Agent, run } from "@openai/agents";
import "dotenv/config";

// const agent = new Agent({
//   name: "Assistant",
//   instructions: "You are a helpful assistant.",
// });

// const result = await run(
//   agent,
//   "Write a haiku about recursion in programming.",
// );

console.log(result.finalOutput);

// const helloAgent = new Agent({
//     name: "Hello Agent",
//     model: 'gpt-4o',
//   instructions: "You are an agent that always says hello world",
// });

const location = "india";

const helloAgent = new Agent({
  name: "Hello Agent",
  model: "gpt-4o",
  instructions: function () {
    if (location === "india") {
      return "Always say namaste and then You are and agent that always says hello world with users name";
    } else {
      return "This just talk to the user";
    }
  },
});

run(helloAgent, "Hey There, this is ABK91").then((result) =>
  console.log(result.finalOutput),
);
