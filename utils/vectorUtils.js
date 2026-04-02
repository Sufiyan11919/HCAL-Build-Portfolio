function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function roundTo(value, decimals = 4) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function cosineSimilarity(vectorA = [], vectorB = []) {
  if (!vectorA.length || !vectorB.length || vectorA.length !== vectorB.length) {
    return 0;
  }

  let dot = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let index = 0; index < vectorA.length; index += 1) {
    const valueA = vectorA[index];
    const valueB = vectorB[index];

    dot += valueA * valueB;
    magnitudeA += valueA * valueA;
    magnitudeB += valueB * valueB;
  }

  if (!magnitudeA || !magnitudeB) {
    return 0;
  }

  return dot / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

module.exports = {
  clamp,
  roundTo,
  cosineSimilarity,
};
