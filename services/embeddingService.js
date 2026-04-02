require('dotenv').config();

const OpenAI = require('openai');

const { truncateText } = require('../utils/textUtils');

const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
const BATCH_SIZE = 25;
let client = null;

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured.');
  }

  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  return client;
}

async function generateEmbedding(text) {
  const cleanText = truncateText(text || '', 6000);
  const response = await getClient().embeddings.create({
    model: EMBEDDING_MODEL,
    input: cleanText,
  });

  return response.data[0].embedding;
}

async function generateChunkEmbeddings(chunks = []) {
  const preparedChunks = chunks
    .map(chunk => (typeof chunk === 'string' ? chunk : chunk.text))
    .filter(Boolean);

  const embeddedChunks = [];

  for (let start = 0; start < preparedChunks.length; start += BATCH_SIZE) {
    const batch = preparedChunks.slice(start, start + BATCH_SIZE).map(text => truncateText(text, 6000));
    const response = await getClient().embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
    });

    response.data.forEach((item, index) => {
      const chunkIndex = start + index;
      embeddedChunks.push({
        chunkIndex,
        text: preparedChunks[chunkIndex],
        embedding: item.embedding,
      });
    });
  }

  return embeddedChunks;
}

module.exports = {
  generateEmbedding,
  generateChunkEmbeddings,
};
