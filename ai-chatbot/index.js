import dotenv from "dotenv";
import axios from "axios";
import * as cheerio from "cheerio";
import OpenAI from "openai";

dotenv.config();

async function scrapeWebpage(url = "") {
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  const pageHead = $("head").html();
  const pageBody = $("body").html();

  const internalLinks = [];
  const externalLinks = [];

  $("a").each((_, el) => {
    const link = $(el).attr("href");
    if (link === "/") return;
    if (link.startsWith("http") || link.startsWith("https")) {
      externalLinks.push(link);
    } else {
      internalLinks.push(link);
    }
  });

  return {
    head: pageHead,
    body: pageBody,
    internalLinks,
    externalLinks,
  };
}

const openai = new OpenAI();

async function generateVectorEmbeddings({ text }) {
  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text, // max input: 8191 tokens
    encoding_format: "float",
  });

  return embedding.data[0].embedding;
}

async function ingest(url = "") {
  const { head, body } = await scrapeWebpage(url);
    const headEmbedding = await generateVectorEmbeddings({ text: head });
    const bodyChunks = chunkText(body, 2000);
    for (const chunk of bodyChunks) {
        
    }
  const bodyEmbedding = await generateVectorEmbeddings({
    text: body,
  });
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

scrapeWebpage("https://www.codewithabhishek.in/").then(console.log);

// prompt for chatgpt for chunking input text
// Write a JS function to get text as string and chunk it in given size tokens.
