import OpenAI from "openai";
import readLineSync from "readline-sync";

const OPENAI_KEY = dummy_value;

const client = new OpenAI({
  apiKey: OPENAI_KEY,
});

// Tools
function getWeatherDetails(city) {
  if (city.toLowerCase() === "patiala") {
    return `10° C`;
  }
  if (city.toLowerCase() === "mohali") {
    return `15° C`;
  }
  if (city.toLowerCase() === "bangalore") {
    return `18° C`;
  }
  if (city.toLowerCase() === "delhi") {
    return `30° C`;
  }
}

// System Prompt: Instructions for Agent (Workflow, for complex use Langraph tool)
const SYSTEM_PROMPT = `
    You are an AI assistant with START, PLAN, Observation and Output State.
    Wait for the user prompt and first PLAN using available tools.
    After Planning, Take the action with appropriate tools and wait for Observation based on Action.
    Once you get the observations, return the AI response based on START prompt and observations.

    Strictly follow the JSON output format as in examples.

    Available Tools:
    - function getWeatherDetails(city: string): string {}
    getWeatherDetails is a function that accepts city name as string and returns the weather details.

    Example:
    START
    {"type": "user", "user": "What is the sum of weather of Patiala and Mohali?"}
    {"type": "plan", "plan": "I will call the getWeatherDetails for Patiala"}
    {"type": "action", "function": "getWeatherDetails", "input": "patiala"}
    {"type": "observation","observation": "10° C"}
    {"type": "plan", "plan": "I will call the getWeatherDetails for Mohali"}
    {"type": "action", "function": "getWeatherDetails", "input": "mohali"}
    {"type": "observation", "observation": "14° C"}
    {"type": "output", "output": "The sum of weather of Patiala and Mohali is 24° C"}
    
`;

// const user = "Hey, What is weather of Patiala";

// async function chat() {
//   const result = await client.chat.completions.create({
//     model: "gpt-4o",
//     messages: [
//       {
//         role: "system",
//         content: SYSTEM_PROMPT,
//       },
//       {
//         role: "developer",
//         content: `{"type": "plan", "plan": "I will call the getWeatherDetails for Patiala"}`,
//       },
//       {
//         role: "developer",
//         content: `{"type": "action", "function": "getWeatherDetails", "input": "patiala"}`,
//       },
//       {
//         role: "developer",
//         content: `{"type": "observation","observation": "10° C"}`,
//       },
//       {
//         role: "user",
//         content: user,
//       },
//     ],
//   });

//   console.log(result.choices[0].message.content);
// }

// chat();

const tools = {
  getWeatherDetails: getWeatherDetails,
};

const messages = [
  {
    role: "system",
    content: SYSTEM_PROMPT,
  },
];

while (true) {
  const query = readLineSync.question(">> ");
  const q = {
    type: "user",
    user: query,
  };
  messages.push({
    role: "user",
    content: JSON.stringify(q),
  });

  while (true) {
    const chat = await client.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      response_format: { type: "json_object" },
    });

    const result = chat.choices[0].message.content;
    messages.push({ role: "assistant", content: result });

    console.log(`\n\n\--------------START AI-------------\n\n`);
    console.log(result);
    console.log(`\n\n\--------------END AI-------------\n\n`);

    const call = JSON.parse(result);
    if (call.type === "output") {
      console.log(`🤖: ${call.output}`);
      break;
    } else if (call.type === "action") {
      const fn = tools[call.function];
      const observation = fn(call.input);
      const obs = {
        type: "observation",
        observation: observation,
      };
      messages.push({
        role: "developer",
        content: JSON.stringify(obs),
      });
    }
  }
}
