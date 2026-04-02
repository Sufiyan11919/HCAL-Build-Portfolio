const WORD_SPLIT_REGEX = /\s+/;

function normalizeWhitespace(text = '') {
  return text.replace(/\s+/g, ' ').trim();
}

function truncateText(text = '', maxChars = 6000) {
  if (text.length <= maxChars) {
    return text;
  }

  return `${text.slice(0, maxChars)}...`;
}

function chunkText(text, options = {}) {
  const {
    chunkSize = 220,
    overlap = 40,
  } = options;

  const normalized = normalizeWhitespace(text);
  if (!normalized) {
    return [];
  }

  const words = normalized.split(WORD_SPLIT_REGEX).filter(Boolean);
  if (words.length <= chunkSize) {
    return [normalized];
  }

  const chunks = [];
  const step = Math.max(1, chunkSize - overlap);

  for (let index = 0; index < words.length; index += step) {
    const chunkWords = words.slice(index, index + chunkSize);
    if (!chunkWords.length) {
      continue;
    }

    chunks.push(chunkWords.join(' '));

    if (index + chunkSize >= words.length) {
      break;
    }
  }

  return chunks;
}

function tokenizeText(text = '') {
  return normalizeWhitespace(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(WORD_SPLIT_REGEX)
    .filter(token => token.length > 2);
}

module.exports = {
  normalizeWhitespace,
  truncateText,
  chunkText,
  tokenizeText,
};
