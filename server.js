const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
require('dotenv').config();
const OpenAI = require('openai');

const app = express();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI).then(() => console.log('Mongo Connected')).catch(err => console.error('error', err));

const Interaction = require('./models/Interaction');
const EventLog = require('./models/EventLog');

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

// app.post('/submit', (req, res) => {
//   const { name, email } = req.body;
//   console.log(`Name: ${name}, Email: ${email}`);
//   console.log('Form submission received:', req.body);
//   res.json({ confirmation: `Thank you, ${name}, for your submission!` });
// });

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

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
