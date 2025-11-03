// backend/scoring.js

/**
 * Validates if word can be formed from the main word's letters
 * Each letter in main word can only be used once per subword
 */
function canFormWord(subword, mainWord) {
  const mainLetters = mainWord.toLowerCase().split('');
  const subwordLetters = subword.toLowerCase().split('');
  
  for (const letter of subwordLetters) {
    const index = mainLetters.indexOf(letter);
    if (index === -1) {
      return false; // Letter not found
    }
    mainLetters.splice(index, 1); // Remove used letter
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
 * Calculates round score for subword finding game
 * 
 * @param {Object} params
 * @param {string} params.word - Submitted subword
 * @param {string} params.mainWord - The main word to find subwords from
 * @param {Set} params.dictionary - Dictionary set
 * @param {number} params.timeElapsed - Time taken to submit (seconds)
 * @param {number} params.totalTime - Total round duration (seconds)
 * @param {boolean} params.isDuplicate - Is word submitted by multiple players
 * @param {boolean} params.isFirstDuplicate - Is this the first submission of duplicate
 * @param {Array} params.allSubmittedWords - All words this player has submitted this round
 * @returns {Object} Score breakdown
 */
function calculateScore({
  word,
  mainWord,
  dictionary,
  timeElapsed,
  totalTime,
  isDuplicate = false,
  isFirstDuplicate = false,
  allSubmittedWords = []
}) {
  const breakdown = {
    isValid: false,
    validWord: 0,
    canBeFormed: 0,
    lengthBonus: 0,
    speedBonus: 0,
    uniquenessBonus: 0,
    firstToFindBonus: 0,
    basePoints: 0,
    roundPoints: 0,
    reason: ''
  };
  
  const normalizedWord = word.toLowerCase().trim();
  
  // Check minimum length
  if (normalizedWord.length < 3) {
    breakdown.reason = 'Word must be at least 3 letters';
    return breakdown;
  }
  
  // Validate word exists in dictionary
  const isValidWord = validateWord(normalizedWord, dictionary);
  if (!isValidWord) {
    breakdown.reason = 'Word not in dictionary';
    return breakdown;
  }
  breakdown.validWord = 5;
  
  // Check if word can be formed from main word
  const canBeFormed = canFormWord(normalizedWord, mainWord);
  if (!canBeFormed) {
    breakdown.reason = 'Cannot be formed from main word';
    return breakdown;
  }
  breakdown.canBeFormed = 5;
  breakdown.isValid = true;
  
  // Length bonus: exponential scoring for longer words
  // 3 letters = 0, 4 = 2, 5 = 5, 6 = 9, 7 = 14, 8+ = 20+
  const length = normalizedWord.length;
  if (length === 4) breakdown.lengthBonus = 2;
  else if (length === 5) breakdown.lengthBonus = 5;
  else if (length === 6) breakdown.lengthBonus = 9;
  else if (length === 7) breakdown.lengthBonus = 14;
  else if (length >= 8) breakdown.lengthBonus = 20 + (length - 8) * 3;
  
  // Speed bonus: +3 if submitted in first 25% of time
  if (timeElapsed <= (totalTime * 0.25)) {
    breakdown.speedBonus = 3;
  }
  
  // Uniqueness bonus: +10 if only you found it (checked after all submissions)
  if (!isDuplicate) {
    breakdown.uniquenessBonus = 10;
  }
  
  // First to find bonus: +5 if you were first to submit this word
  if (isFirstDuplicate) {
    breakdown.firstToFindBonus = 5;
  }
  
  // Calculate base points
  breakdown.basePoints = 
    breakdown.validWord +
    breakdown.canBeFormed +
    breakdown.lengthBonus +
    breakdown.speedBonus +
    breakdown.uniquenessBonus +
    breakdown.firstToFindBonus;
  
  // Final round points (no time multiplier - encourages finding more words)
  breakdown.roundPoints = breakdown.basePoints;
  
  return breakdown;
}

/**
 * Calculate total score for a player who submitted multiple words
 */
function calculateTotalScore(submissions) {
  let total = 0;
  const words = [];
  
  for (const submission of submissions) {
    total += submission.roundPoints;
    words.push({
      word: submission.word,
      points: submission.roundPoints,
      isUnique: submission.uniquenessBonus > 0
    });
  }
  
  return {
    totalPoints: total,
    wordCount: submissions.length,
    words: words.sort((a, b) => b.points - a.points) // Sort by highest points
  };
}

module.exports = {
  calculateScore,
  calculateTotalScore,
  validateWord,
  canFormWord
};
