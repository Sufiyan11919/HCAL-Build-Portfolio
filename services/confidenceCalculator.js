const { tokenizeText } = require('../utils/textUtils');
const { clamp, roundTo } = require('../utils/vectorUtils');
const retrievalService = require('./retrievalService');

const STOP_WORDS = new Set([
  'about', 'after', 'again', 'because', 'before', 'being', 'could', 'every',
  'from', 'have', 'into', 'just', 'more', 'most', 'only', 'other', 'same',
  'some', 'such', 'than', 'that', 'them', 'then', 'there', 'these', 'they',
  'this', 'those', 'very', 'what', 'when', 'where', 'which', 'while', 'with',
  'would', 'your',
]);

function normalizeScore(score, retrievalMethod, topScore) {
  if (!score) {
    return 0;
  }

  if (retrievalService.normalizeMethod(retrievalMethod) === 'semantic') {
    return clamp(score);
  }

  const safeTopScore = topScore || score;
  const relativeScore = safeTopScore ? score / safeTopScore : 0;
  const saturatedScore = score / (score + 1);
  return clamp((relativeScore * 0.6) + (saturatedScore * 0.4));
}

function calculateResponseConfidence(responseText, retrievedDocuments) {
  if (!responseText || !retrievedDocuments.length) {
    return null;
  }

  const evidenceTokens = new Set(
    tokenizeText(retrievedDocuments.map(document => document.chunkText).join(' '))
      .filter(token => !STOP_WORDS.has(token))
  );

  const responseTokens = tokenizeText(responseText).filter(token => !STOP_WORDS.has(token));
  if (!responseTokens.length || !evidenceTokens.size) {
    return 0;
  }

  const overlapCount = responseTokens.filter(token => evidenceTokens.has(token)).length;
  return roundTo(overlapCount / responseTokens.length);
}

function calculateConfidenceMetrics({ retrievedDocuments = [], retrievalMethod = 'semantic', responseText = '' }) {
  const scores = retrievedDocuments.map(document => document.relevanceScore || 0);
  const topScore = scores[0] || 0;
  const normalizedScores = scores.map(score => normalizeScore(score, retrievalMethod, topScore));
  const averageScore = normalizedScores.length
    ? normalizedScores.reduce((sum, score) => sum + score, 0) / normalizedScores.length
    : 0;
  const evidenceCoverage = clamp(retrievedDocuments.length / 4);
  const retrievalConfidence = roundTo((averageScore * 0.8) + (evidenceCoverage * 0.2));
  const responseConfidence = calculateResponseConfidence(responseText, retrievedDocuments);
  const overallConfidence = roundTo(
    responseConfidence === null
      ? retrievalConfidence
      : (retrievalConfidence * 0.7) + (responseConfidence * 0.3)
  );

  return {
    overallConfidence,
    retrievalConfidence,
    responseConfidence,
    retrievalMethod: retrievalService.normalizeMethod(retrievalMethod),
  };
}

module.exports = {
  calculateConfidenceMetrics,
};
