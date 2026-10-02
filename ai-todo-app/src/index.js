// import { eq, ilike } from "drizzle-orm";
// import { db } from "./db/index.js";
// import { todosTable } from "./db/schema.js";
// import OpenAI from "openai";
// import readlineSync from "readline-sync";

// const client = new OpenAI();

// Tools

// async function getAllTodos() {
//   const todos = await db.select().from(todosTable);
//   return todos;
// }

// async function createTodo(todo) {
//   const [result] = await db
//     .insert(todosTable)
//     .values({
//       todo,
//     })
//     .returning({
//       id: todosTable.id,
//     });

//   return result.id;
// }

// async function deleteTodoById(id) {
//   await db.delete(todosTable).where(eq(todosTable.id, id));
// }

// async function searchTodo(search) {
//   const todos = await db
//     .select()
//     .from(todosTable)
//     .where(ilike(todosTable.todo, `%${search}%`));
//   return todos;
// }

// const tools = {
//   getAllTodos: getAllTodos,
//   createTodo: createTodo,
//   deleteTodoById: deleteTodoById,
//   searchTodo: searchTodo,
// };

// const SYSTEM_PROMPT = `
//     You are an AI To-Do List Assistant with START, PLAN, ACTION, Observation and Output State.
//     Wait for the user prompt and first PLAN using available tools.
//     After Planning, take the action with appropriate tools and wait for Observation based on Action.
//     Once you get the observations, return the AI response based on start prompt and observations.

//     You can manage tasks by adding, viewing, updating, and deleting.
//     You must strictly follow the JSON output format.

//     Todo DB Schema:
//     id: Int and Primary Key
//     todo: String
//     created_at: Date Time
//     updated_at: Date Time

//     Available tools:
//     - getAllTodos(): Returns all todos from database
//     - createTodo(todo: string): Creates a new Todo in the DB and takes todo as a string and returns the id of created todo.
//     - deleteTodoById(id: string): Deleted the todo by ID given in the DB
//     - searchTodo(search: string): Searches for all todos matching the query string using "search "query

//     Example:
//     START
//     {"type": "user", "user": "Add a task for shopping groceries"}
//     {"type": "plan", "plan": "I will try to get more context on what user needs to shop."}
//     {"type": "output", "output": "Can you tell me what all items you want to shop for?"}
//     {"type": "user", "user": "I want to shop for milk, kurkure, lays and chocolates"}
//     {"type": "plan", "plan": "I will use createTodo to create a new Todo in DB."}
//     {"type": "action", "function": "createTodo, "input": {"title": "Shopping Groceries", "description": "Shopping for milk, kurkure, lays and chocolates"}}
//     {"type": "observation", "observation": "2"}
//     {"type": "output", "output": "Your todo has been added successfully"}
// `;

// const messages = [
//   {
//     role: "system",
//     content: SYSTEM_PROMPT,
//   },
// ];

// while (true) {
//   const query = readlineSync.question(">> ");
//   const userMessage = {
//     type: "user",
//     user: query,
//   };
//   messages.push({
//     role: "user",
//     content: JSON.stringify(userMessage),
//   });

//   while (true) {
//     const chat = await client.chat.completions.create({
//       model: "gpt-4o",
//       messages: messages,
//       response_format: { type: "json_object" },
//     });

//     const result = chat.choices[0].message.content;
//     messages.push({ role: "assistant", content: result });

//     console.log(`\n\n--------------- START AI -------------\n\n`);
//     console.log(result);
//     console.log(`\n\n--------------- END AI -------------\n\n`);

//     const action = JSON.parse(result);
//     if (action.type === "output") {
//       console.log(`⚛️: ${action.output}`);
//       break;
//     }

//     if (action.type === "action") {
//       const fb = tools[action.function];
//       if (!fn) throw new Error("Invalid Tool Call");

//       const observation = await fn(action.input);
//       const observationMessage = {
//         type: "observation",
//         observation: observation,
//       };

//       messages.push({
//         role: "developer",
//         content: JSON.stringify(observationMessage),
//       });
//     }
//   }
// }

import { eq, ilike } from "drizzle-orm";
import { db } from "./db/index.js";
import { todosTable } from "./db/schema.js";
import { GoogleGenAI } from "@google/genai";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output  } from "node:process";

// Initialize native async readline
const rl = readline.createInterface({ input, output });

const client = new GoogleGenAI({});

// Tools

async function getAllTodos() {
  const todos = await db.select().from(todosTable);
  return todos;
}

async function createTodo(todo) {
  const [result] = await db
    .insert(todosTable)
    .values({
      todo,
    })
    .returning({
      id: todosTable.id,
    });

  return result.id;
}

async function deleteTodoById(id) {
  await db.delete(todosTable).where(eq(todosTable.id, id));
}

async function searchTodo(search) {
  const todos = await db
    .select()
    .from(todosTable)
    .where(ilike(todosTable.todo, `%${search}%`));
  return todos;
}

const tools = {
  getAllTodos: getAllTodos,
  createTodo: createTodo,
  deleteTodoById: deleteTodoById,
  searchTodo: searchTodo,
};

const SYSTEM_PROMPT = `
    You are an AI To-Do List Assistant.
    Keep the conversation in a strict JSON format.
    Return exactly one valid JSON object per response.
    Allowed object types:
    - "plan": a short plan string
    - "action": a tool call with "function" and "input"
    - "output": a final answer for the user

    Todo DB Schema:
    id: Int and Primary Key
    todo: String
    created_at: Date Time
    updated_at: Date Time

    Available tools:
    - getAllTodos(): Returns all todos from the database
    - createTodo(todo: string): Creates a new todo and returns the created id
    - deleteTodoById(id: number): Deletes a todo by ID
    - searchTodo(search: string): Searches todos matching a query string

    Rules:
    - Use JSON only, no markdown fences or explanatory text.
    - Use "plan" before a tool call when needed.
    - When a tool call is ready, output exactly one action object.
    - After the tool result is observed, output exactly one final output object.

    Example:
    {"type":"plan","plan":"I will create a todo for the user's shopping request."}
    {"type":"action","function":"createTodo","input":{"todo":"Buy milk, kurkure, lays, and chocolates"}}
    {"type":"output","output":"Your todo was added successfully."}
`;

function parseAiResponse(rawText) {
  const text = String(rawText ?? "").trim();
  if (!text) return null;

  const sanitized = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  if (!sanitized) return null;

  const candidates = [];
  let cursor = 0;

  while (cursor < sanitized.length) {
    const start = sanitized.indexOf("{", cursor);
    if (start === -1) break;

    let depth = 0;
    let inString = false;
    let escaped = false;
    let end = -1;

    for (let i = start; i < sanitized.length; i++) {
      const char = sanitized[i];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (char === "\\") {
          escaped = true;
        } else if (char === '"') {
          inString = false;
        }
        continue;
      }

      if (char === '"') {
        inString = true;
      } else if (char === "{") {
        depth += 1;
      } else if (char === "}") {
        depth -= 1;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }

    if (end === -1) break;

    const candidate = sanitized.slice(start, end + 1);
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object" && parsed.type) {
        candidates.push(parsed);
      }
    } catch {
      // Ignore malformed fragments and keep looking for valid JSON.
    }

    cursor = end + 1;
  }

  if (candidates.length > 0) {
    const selected = [...candidates]
      .reverse()
      .find((candidate) =>
        ["plan", "action", "output", "user", "observation"].includes(
          candidate.type,
        ),
      );
    return selected ?? candidates[candidates.length - 1];
  }

  return JSON.parse(sanitized);
}

const messages = [];

function normalizeToolInput(functionName, input) {
  if (functionName === "deleteTodoById") {
    if (typeof input === "number") return input;
    if (typeof input === "string") return Number(input);
    if (input && typeof input === "object") {
      if (typeof input.id !== "undefined") return Number(input.id);
      if (typeof input.value !== "undefined") return Number(input.value);
    }
    return Number.NaN;
  }

  if (functionName === "searchTodo") {
    if (typeof input === "string") return input;
    if (input && typeof input === "object") {
      if (typeof input.search === "string") return input.search;
      if (typeof input.query === "string") return input.query;
    }
    return "";
  }

  if (functionName === "createTodo") {
    if (typeof input === "string") return input;
    if (input && typeof input === "object") {
      if (typeof input.todo === "string") return input.todo;
      if (typeof input.title === "string") return input.title;
      if (typeof input.task === "string") return input.task;
    }
    return "";
  }

  return input;
}

async function processUserTurn(query) {
  const userMessage = {
    type: "user",
    user: query,
  };

  messages.push({
    role: "user",
    parts: [{ text: JSON.stringify(userMessage) }],
  });

  while (true) {
    const chat = await client.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: messages,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
      },
    });

    const result = chat.text;
    messages.push({ role: "model", parts: [{ text: result }] });

    const action = parseAiResponse(result);

    if (!action || typeof action !== "object" || !action.type) {
      messages.push({
        role: "user",
        parts: [
          {
            text: JSON.stringify({
              type: "error",
              error:
                "Invalid JSON format. Please return plan, action, or output.",
            }),
          },
        ],
      });
      continue;
    }

    if (action.type === "plan") {
      messages.push({
        role: "user",
        parts: [
          {
            text: JSON.stringify({
              type: "observation",
              observation: "Plan acknowledged. Proceed with action or output.",
            }),
          },
        ],
      });
      continue;
    }

    if (action.type === "output") {
      console.log(`⚛️: ${action.output}`);
      return;
    }

    if (action.type === "action") {
      const fn = tools[action.function];
      let observationMessage;

      if (!fn) {
        observationMessage = {
          type: "error",
          error: `Tool ${action.function} does not exist.`,
        };
      } else {
        const normalizedInput = normalizeToolInput(
          action.function,
          action.input,
        );
        const observation = await fn(normalizedInput);
        observationMessage = { type: "observation", observation: observation };
      }

      messages.push({
        role: "user",
        parts: [{ text: JSON.stringify(observationMessage) }],
      });
      continue;
    }

    messages.push({
      role: "user",
      parts: [
        {
          text: JSON.stringify({
            type: "error",
            error: `Unexpected type: ${action.type}. Expected plan, action, or output.`,
          }),
        },
      ],
    });
  }
}

while (true) {
  const query = await rl.question(">> ");
  if (!query || !query.trim()) continue;

  await processUserTurn(query.trim());
}
