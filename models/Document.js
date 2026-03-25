const mongoose = require('mongoose');

const chunkSchema = new mongoose.Schema({
  chunkIndex: {
    type: Number,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
}, { _id: false });

const documentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  chunks: {
    type: [chunkSchema],
    default: [],
  },
  processingStatus: {
    type: String,
    default: 'processing',
  },
  processedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Document', documentSchema);
