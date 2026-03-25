const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
require('dotenv').config();
const OpenAI = require('openai');
const multer = require('multer');

const app = express();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI).then(() => console.log('Mongo Connected')).catch(err => console.error('error', err));

const Interaction = require('./models/Interaction');
const EventLog = require('./models/EventLog');
const Document = require('./models/Document');
const documentProcessor = require('./services/documentProcessor');

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: uploadDir });

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

app.post('/submit-prompt', async (req, res) => {
  try {
    const { message } = req.body;
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'user', content: message }
      ],
      max_tokens: 100,
    });

    const botResponse = response.choices[0].message.content;
    console.log(botResponse);

    await Interaction.create({ userInput: message, botResponse });

    res.json({ botResponse });
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ error: 'Failed to get a response from OpenAI.' });
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

app.post('/upload-document', upload.single('document'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const processed = await documentProcessor.processDocument(req.file);

    const newDocument = new Document({
      filename: req.file.originalname,
      text: processed.fullText,
      chunks: processed.chunks.map((chunk, index) => ({
        chunkIndex: chunk.chunkIndex ?? index,
        text: chunk.text,
      })),
      processingStatus: 'ready',
      processedAt: new Date(),
    });

    await newDocument.save();

    res.json({
      status: 'ok',
      filename: req.file.originalname,
      chunkCount: processed.chunks.length,
    });
  } catch (error) {
    console.error('Error uploading document:', error.message);
    res.status(500).json({ error: 'Failed to process document' });
  }
});

app.get('/documents', async (req, res) => {
  try {
    const docs = await Document.find()
      .select('_id filename processingStatus processedAt')
      .sort({ processedAt: -1 });

    res.json(docs);
  } catch (error) {
    console.error('Error fetching documents:', error.message);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
