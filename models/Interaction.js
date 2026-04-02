const mongoose = require('mongoose');

const RetrievedDocumentSchema = new mongoose.Schema({
  docName: { type: String, default: '' },
  chunkIndex: { type: Number, default: 0 },
  chunkText: { type: String, default: '' },
  relevanceScore: { type: Number, default: 0 },
}, { _id: false });

const ConfidenceMetricsSchema = new mongoose.Schema({
  overallConfidence: { type: Number, default: 0 },
  retrievalConfidence: { type: Number, default: 0 },
  responseConfidence: { type: Number, default: null },
  retrievalMethod: { type: String, default: '' },
}, { _id: false });

const interactionSchema = new mongoose.Schema({
  userInput: String,
  botResponse: String,
  retrievalMethod: { type: String, default: '' },
  retrievedDocuments: { type: [RetrievedDocumentSchema], default: [] },
  confidenceMetrics: { type: ConfidenceMetricsSchema, default: null },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Interaction', interactionSchema);
