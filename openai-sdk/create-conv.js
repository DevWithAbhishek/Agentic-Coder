import { OpenAI } from "openai";

const client = new OpenAI();

// Returns a conversationId
client.conversations.create({}).then((e) => {
  console.log(`Conversation thread created, id ${e.id}`);
});