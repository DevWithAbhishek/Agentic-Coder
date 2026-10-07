import dotenv from "dotenv";
import axios from "axios";
import * as cheerio from "cheerio";
import OpenAI from "openai";
import { ChromaClient } from "chromadb";

dotenv.config();

const openai = new OpenAI();

const chromaClient = new ChromaClient({ path: `http://localhost:8000` });
chromaClient.heartbeat();

const WEB_COLLECTION = `WEB_SCAPED_DATA_COLLECTION-1`;

async function scrapeWebpage(url = "") {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const pageHead = $("head").html();
    const pageBody = $("body").html();

    const internalLinks = new Set();
    const externalLinks = new Set();

    $("a").each((_, el) => {
      const link = $(el).attr("href");
      if (link === "/") return;
      if (link.startsWith("http") || link.startsWith("https")) {
        externalLinks.add(link);
      } else {
        internalLinks.add(link);
      }
    });

    console.log("InternalLinks: ", internalLinks);

    return {
      head: pageHead,
      body: pageBody,
      internalLinks: Array.from(internalLinks),
      externalLinks: Array.from(externalLinks),
    };
  } catch (error) {
    console.log(error);
  }
}

async function generateVectorEmbeddings({ text }) {
  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text, // max input: 8191 tokens
    encoding_format: "float",
  });

  return embedding.data[0].embedding;
}

async function insertIntoDB({ embedding, url, body = "", head = "" }) {
  const collection = await chromaClient.getOrCreateCollection({
    name: WEB_COLLECTION,
  });

  collection.add({
    ids: [url],
    embeddings: [embedding],
    metadatas: [{ url, body, head }],
  });
}

async function ingest(url = "") {
  console.log("Ingesting URL ......");

  const { head, body, internalLinks } = await scrapeWebpage(url);
  const bodyChunks = chunkText(body, 1000);

  //   const headEmbedding = await generateVectorEmbeddings({ text: head });
  //   await insertIntoDB({ embedding: headEmbedding, url });

  for (const chunk of bodyChunks) {
    const bodyEmbedding = await generateVectorEmbeddings({
      text: chunk,
    });
    await insertIntoDB({ embedding: bodyEmbedding, url, body: chunk });
  }

  for (const link of internalLinks) {
    const _url = `${url}${link}`;
    await ingest(_url);
  }

  console.log("Ingesting success ......");
}

function chunkText(text, chunkSize) {
  if (!text || chunkSize <= 0) return {};

  const words = text.split(/\s+/); // Split text int words (tokens)
  const chunks = [];

  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(""));
  }

  return chunks;
}

async function chat(question = "") {
  const questionEmbedding = await generateVectorEmbeddings({ text: question });

  const collection = await chromaClient.getOrCreateCollection({
    name: WEB_COLLECTION,
  });

  const collectionResult = await collection.query({
    nResults: 3,
    queryEmbeddings: questionEmbedding,
  });

  //   const body = collectionResult.metadatas.map((e) => e);
  const body = collectionResult.metadatas
    .map((e) => e.body)
    .filter((e) => e.trim() !== "" && !!e);
  const url = collectionResult.metadatas[0]
    .map((e) => e.url)
    .filter((e) => e.trim() !== "" && !!e);

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "You are an AI support agent expert in providing support to users on behalf of a webpage. Given the context about page content, reply the user accordingly",
      },
      {
        role: "user",
        content: `
             Query: ${question}\n\n
             url: ${url.join(", ")}\n\n
             RetrievedContext: ${body.join(", ")}\n\n
            `,
      },
    ],
  });

  console.log({
    Responses: `${response.choices[0].message}`,
    url: url[0],
  });
}

// scrapeWebpage("https://www.codewithabhishek.in/").then(console.log);
ingest("https://www.codewithabhishek.in/").then(console.log);

chat("What is the cohort about?");

// prompt for chatgpt for chunking input text
// Write a JS function to get text as string and chunk it in given size tokens.
