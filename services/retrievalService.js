const natural = require('natural');

const Document = require('../models/Document');
const embeddingService = require('./embeddingService');
const { cosineSimilarity, roundTo } = require('../utils/vectorUtils');

let tfidf = new natural.TfIdf();
let indexedChunks = [];

function normalizeMethod(method = 'semantic') {
  const normalized = String(method).toLowerCase();
  if (normalized === 'tf-idf' || normalized === 'tfidf' || normalized === 'keyword') {
    return 'tfidf';
  }

  return 'semantic';
}

function buildIndex(documents = []) {
  tfidf = new natural.TfIdf();
  indexedChunks = [];

  documents.forEach(document => {
    (document.chunks || []).forEach(chunk => {
      if (!chunk.text) {
        return;
      }

      tfidf.addDocument(chunk.text);
      indexedChunks.push({
        documentId: String(document._id),
        docName: document.filename,
        chunkIndex: chunk.chunkIndex,
        chunkText: chunk.text,
        embedding: Array.isArray(chunk.embedding) ? chunk.embedding : [],
      });
    });
  });
}

async function initialize() {
  const documents = await Document.find({
    processingStatus: { $in: ['completed', 'ready'] },
  }).lean();
  buildIndex(documents);
}

async function retrieveByTfIdf(query, limit = 4) {
  if (!query || !indexedChunks.length) {
    return [];
  }

  const results = indexedChunks
    .map((chunk, index) => ({
      docName: chunk.docName,
      chunkIndex: chunk.chunkIndex,
      chunkText: chunk.chunkText,
      relevanceScore: roundTo(tfidf.tfidf(query, index)),
    }))
    .filter(chunk => chunk.relevanceScore > 0);

  return results
    .sort((left, right) => right.relevanceScore - left.relevanceScore)
    .slice(0, limit);
}

async function retrieveSemantically(query, limit = 4) {
  if (!query || !indexedChunks.length) {
    return [];
  }

  const queryEmbedding = await embeddingService.generateEmbedding(query);

  return indexedChunks
    .filter(chunk => chunk.embedding.length)
    .map(chunk => ({
      docName: chunk.docName,
      chunkIndex: chunk.chunkIndex,
      chunkText: chunk.chunkText,
      relevanceScore: roundTo(Math.max(0, cosineSimilarity(queryEmbedding, chunk.embedding))),
    }))
    .filter(chunk => chunk.relevanceScore > 0)
    .sort((left, right) => right.relevanceScore - left.relevanceScore)
    .slice(0, limit);
}

async function retrieveRelevantChunks(query, options = {}) {
  const { method = 'semantic', limit = 4 } = options;
  const normalizedMethod = normalizeMethod(method);

  if (normalizedMethod === 'tfidf') {
    return retrieveByTfIdf(query, limit);
  }

  return retrieveSemantically(query, limit);
}

module.exports = {
  initialize,
  buildIndex,
  retrieveRelevantChunks,
  normalizeMethod,
};
