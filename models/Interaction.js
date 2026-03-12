const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema({
  userInput: String,
  botResponse: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Interaction', interactionSchema);
