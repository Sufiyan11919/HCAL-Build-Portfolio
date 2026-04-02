const mongoose = require('mongoose');

const ChunkSchema = new mongoose.Schema({
  chunkIndex: { type: Number, required: true },
  text: { type: String, required: true },
  embedding: { type: [Number], default: [] },
}, { _id: false });

const DocumentSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  mimeType: { type: String, default: '' },
  sizeBytes: { type: Number, default: 0 },
  text: { type: String, default: '' },
  chunks: { type: [ChunkSchema], default: [] },
  processingStatus: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing',
  },
  errorMessage: { type: String, default: null },
  processedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Document', DocumentSchema);
