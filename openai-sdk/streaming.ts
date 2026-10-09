import { Agent, run } from "@openai/agents";
import 'dotenv/config';
import { z } from "zod";

const agent = new Agent({
    name: 'Storyteller',
    instructions: `
        You are a storyteller. You will be given a topic and you will tell a story about it.
    `
});

async function* streamOutput(q: string) {
    const result = await run(agent, q, { stream: true });
    const stream = result.toTextStream();

    for await (const val of stream) {
        yield { isCompleted: false, value: val };
    }

    yield { isCompleted: true, value: result.finalOutput };
}

async function main(q: string) {
    // const result = await run(agent, q, { stream: true }); // result is like a generator function
    // const stream = result.toTextStream();

    // for await (const value of stream) {
    //     console.log(value);
    // }

    // result.toTextStream({ compatibleWithNodeStreams: true }).pipe(process.stdout);

    for await (const o of streamOutput(q)) {
        console.log(o);
    }
}

main("Tell me a stroy about macbook in 300 words.")