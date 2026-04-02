const pdfParse = require('pdf-parse');

const { chunkText, normalizeWhitespace } = require('../utils/textUtils');

async function extractTextFromFile(file) {
  const mimeType = file.mimetype || '';
  const extension = (file.originalname || '').toLowerCase();

  if (mimeType === 'application/pdf' || extension.endsWith('.pdf')) {
    const parsedPdf = await pdfParse(file.buffer);
    return parsedPdf.text || '';
  }

  if (
    mimeType.startsWith('text/') ||
    extension.endsWith('.txt') ||
    extension.endsWith('.md')
  ) {
    return file.buffer.toString('utf8');
  }

  throw new Error('Unsupported file type. Upload a PDF, TXT, or MD file.');
}

async function processDocument(file) {
  if (!file) {
    throw new Error('No file uploaded.');
  }

  const extractedText = await extractTextFromFile(file);
  const normalizedText = normalizeWhitespace(extractedText);

  if (!normalizedText) {
    throw new Error('The uploaded document did not contain readable text.');
  }

  return {
    filename: file.originalname,
    text: normalizedText,
    chunks: chunkText(normalizedText),
  };
}

module.exports = {
  processDocument,
};
