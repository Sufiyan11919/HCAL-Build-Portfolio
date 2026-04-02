const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
require('dotenv').config();
const mongoose = require('mongoose');
const OpenAI = require('openai');

const Interaction = require('./models/Interaction');
const EventLog = require('./models/EventLog');
const Document = require('./models/Document');
const documentProcessor = require('./services/documentProcessor');
const embeddingService = require('./services/embeddingService');
const retrievalService = require('./services/retrievalService');
const confidenceCalculator = require('./services/confidenceCalculator');

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});
let openAIClient = null;

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

function buildEvidenceContext(retrievedDocuments = []) {
  if (!retrievedDocuments.length) {
    return 'No supporting evidence was retrieved from uploaded documents.';
  }

  return retrievedDocuments
    .map((document, index) => (
      `Evidence ${index + 1}
Document: ${document.docName}
Chunk Index: ${document.chunkIndex}
Relevance Score: ${document.relevanceScore}
Text: ${document.chunkText}`
    ))
    .join('\n\n');
}

function buildChatMessages(userInput, retrievedDocuments) {
  return [
    {
      role: 'system',
      content: [
        'You are a portfolio chatbot that answers using uploaded document evidence when available.',
        'Ground the answer in the retrieved evidence.',
        'If the documents do not provide enough information, say that clearly instead of inventing details.',
      ].join(' '),
    },
    {
      role: 'user',
      content: [
        `User question: ${userInput}`,
        '',
        'Retrieved evidence:',
        buildEvidenceContext(retrievedDocuments),
        '',
        'Write a clear answer that cites the document context naturally.',
      ].join('\n'),
    },
  ];
}

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured.');
  }

  if (!openAIClient) {
    openAIClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  return openAIClient;
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

app.get('/documents', async (req, res) => {
  try {
    const documents = await Document.find()
      .sort({ createdAt: -1 })
      .select('_id filename processingStatus processedAt createdAt');

    res.json({ documents });
  } catch (error) {
    console.error('Document listing error:', error);
    res.status(500).json({ error: 'Failed to fetch documents.' });
  }
});

app.post('/upload-document', upload.single('document'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Please upload a document file.' });
  }

  const storedDocument = await Document.create({
    filename: req.file.originalname,
    mimeType: req.file.mimetype,
    sizeBytes: req.file.size,
    processingStatus: 'processing',
  });

  try {
    const processed = await documentProcessor.processDocument(req.file);
    const chunksWithEmbeddings = await embeddingService.generateChunkEmbeddings(processed.chunks);

    storedDocument.text = processed.text;
    storedDocument.chunks = chunksWithEmbeddings;
    storedDocument.processingStatus = 'completed';
    storedDocument.processedAt = new Date();
    storedDocument.errorMessage = null;
    await storedDocument.save();

    await retrievalService.initialize();

    return res.status(201).json({
      message: 'Document uploaded and processed successfully.',
      document: {
        id: storedDocument._id,
        filename: storedDocument.filename,
        processingStatus: storedDocument.processingStatus,
        chunkCount: storedDocument.chunks.length,
      },
    });
  } catch (error) {
    storedDocument.processingStatus = 'failed';
    storedDocument.errorMessage = error.message;
    await storedDocument.save();

    console.error('Document upload error:', error);
    return res.status(500).json({ error: error.message || 'Failed to process the document.' });
  }
});

app.post('/submit-prompt', async (req, res) => {
  try {
    const userInput = (req.body.input || req.body.message || '').trim();
    const retrievalMethod = retrievalService.normalizeMethod(req.body.retrievalMethod);

    if (!userInput) {
      return res.status(400).json({ error: 'Prompt input is required.' });
    }

    const retrievedDocuments = await retrievalService.retrieveRelevantChunks(userInput, {
      method: retrievalMethod,
      limit: 4,
    });

    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: buildChatMessages(userInput, retrievedDocuments),
      max_tokens: 300,
      temperature: 0.2,
    });

    const botResponse = response.choices[0].message.content;
    const confidenceMetrics = confidenceCalculator.calculateConfidenceMetrics({
      retrievedDocuments,
      retrievalMethod,
      responseText: botResponse,
    });

    await Interaction.create({
      userInput,
      botResponse,
      retrievalMethod,
      retrievedDocuments,
      confidenceMetrics,
    });

    return res.json({
      botResponse,
      retrievedDocuments,
      confidenceMetrics,
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return res.status(500).json({ error: 'Failed to get a response from OpenAI.' });
  }
});

app.post('/log-event', async (req, res) => {
  try {
    const { eventType, elementName, timestamp } = req.body;
    await EventLog.create({ eventType, elementName, timestamp });
    res.json({ status: 'Event logged' });
  } catch (error) {
    console.error('Event logging error:', error);
    res.status(500).json({ error: 'Failed to log event' });
  }
});

const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    await retrievalService.initialize();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => console.error('Mongo connection error:', err));
