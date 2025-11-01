// backend/scoring.js

/**
 * Validates if word contains all required letters
 */
function containsAllLetters(word, letters) {
  const wordLower = word.toLowerCase();
  const lettersLower = letters.map(l => l.toLowerCase());
  
  for (const letter of lettersLower) {
    if (!wordLower.includes(letter)) {
      return false;
    }
  }
  return true;
}

/**
 * Validates word against dictionary
 */
function validateWord(word, dictionary) {
  const normalized = word.toLowerCase().trim();
  if (normalized.length < 3) return false;
  if (!/^[a-z]+$/.test(normalized)) return false;
  return dictionary.has(normalized);
}

/**
 * Calculates round score based on all criteria
 * 
 * @param {Object} params
 * @param {string} params.word - Submitted word
 * @param {Array<string>} params.letters - Required letters
 * @param {Set} params.dictionary - Dictionary set
 * @param {number} params.timeElapsed - Time taken to submit (seconds)
 * @param {number} params.totalTime - Total round duration (seconds)
 * @param {boolean} params.isDuplicate - Is word submitted by multiple players
 * @param {boolean} params.isFirstDuplicate - Is this the first submission of duplicate
 * @returns {Object} Score breakdown
 */
function calculateScore({
  word,
  letters,
  dictionary,
  timeElapsed,
  totalTime,
  isDuplicate = false,
  isFirstDuplicate = false
}) {
  const breakdown = {
    isValid: false,
    validWord: 0,
    containsAll: 0,
    lengthBonus: 0,
    speedBonus: 0,
    originalityBonus: 0,
    timeMultiplier: 1.0,
    basePoints: 0,
    roundPoints: 0
  };
  
  const normalizedWord = word.toLowerCase().trim();
  
  // Validate word exists in dictionary
  const isValidWord = validateWord(normalizedWord, dictionary);
  if (!isValidWord) {
    return breakdown;
  }
  breakdown.validWord = 5;
  
  // Check contains all required letters
  const hasAllLetters = containsAllLetters(normalizedWord, letters);
  if (!hasAllLetters) {
    return breakdown; // Must contain all letters
  }
  breakdown.containsAll = 3;
  breakdown.isValid = true;
  
  // Length bonus: +1 per letter beyond 5
  breakdown.lengthBonus = Math.max(0, normalizedWord.length - 5);
  
  // Speed bonus: +2 if submitted in first half of time
  if (timeElapsed <= (totalTime / 2)) {
    breakdown.speedBonus = 2;
  }
  
  // Originality bonus: +5 if first to submit a duplicate word
  if (isFirstDuplicate) {
    breakdown.originalityBonus = 5;
  }
  
  // Calculate base points
  breakdown.basePoints = 
    breakdown.validWord +
    breakdown.containsAll +
    breakdown.lengthBonus +
    breakdown.speedBonus +
    breakdown.originalityBonus;
  
  // Time multiplier (10% max bonus for instant submission)
  const remainingTime = Math.max(0, totalTime - timeElapsed);
  breakdown.timeMultiplier = 1 + (remainingTime / totalTime) * 0.1;
  
  // Final round points
  breakdown.roundPoints = Math.round(breakdown.basePoints * breakdown.timeMultiplier * 100) / 100;
  
  return breakdown;
}

module.exports = {
  calculateScore,
  validateWord,
  containsAllLetters
};