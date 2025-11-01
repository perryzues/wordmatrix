// backend/dictionary.js
const fs = require('fs').promises;
const path = require('path');

/**
 * Loads dictionary from words.json file into a Set for O(1) lookups
 */
async function loadDictionary() {
  try {
    const wordsPath = path.join(__dirname, 'words.json');
    const data = await fs.readFile(wordsPath, 'utf8');
    const words = JSON.parse(data);
    
    // Convert to Set for fast lookups, normalize to lowercase
    const dictionary = new Set(words.map(w => w.toLowerCase().trim()));
    
    console.log(`Loaded ${dictionary.size} words into dictionary`);
    return dictionary;
    
  } catch (error) {
    console.error('Error loading dictionary:', error);
    
    // Fallback to minimal dictionary if file not found
    console.warn('Using fallback minimal dictionary');
    return new Set([
      'cat', 'dog', 'bird', 'fish', 'tree', 'star', 'moon', 'sun',
      'color', 'water', 'earth', 'fire', 'wind', 'stone', 'metal',
      'table', 'chair', 'house', 'phone', 'computer', 'music', 'dance',
      'create', 'destroy', 'build', 'break', 'start', 'finish', 'begin',
      'apple', 'orange', 'banana', 'grape', 'lemon', 'peach', 'melon'
    ]);
  }
}

/**
 * Creates a basic English dictionary JSON file
 * Run this once to generate words.json
 */
async function generateDictionaryFile() {
  // Common English words (sample - in production, use full dictionary)
  const commonWords = [
    // 3 letter words
    'cat', 'dog', 'bat', 'hat', 'mat', 'rat', 'sat', 'fat', 'pat', 'vat',
    'car', 'bar', 'tar', 'war', 'jar', 'far', 'bit', 'fit', 'hit', 'kit',
    'lit', 'pit', 'sit', 'wit', 'box', 'fox', 'mix', 'six', 'fix', 'wax',
    'bug', 'hug', 'mug', 'rug', 'tug', 'jug', 'cup', 'pup', 'sun', 'run',
    'fun', 'gun', 'bun', 'nut', 'cut', 'hut', 'but', 'put', 'got', 'hot',
    
    // 4 letter words
    'tree', 'free', 'bird', 'word', 'cord', 'lord', 'ford', 'card', 'hard',
    'yard', 'park', 'dark', 'mark', 'bark', 'star', 'scar', 'fear', 'tear',
    'bear', 'dear', 'hear', 'near', 'year', 'gear', 'moon', 'noon', 'soon',
    'book', 'cook', 'look', 'took', 'hook', 'rock', 'lock', 'dock', 'sock',
    'back', 'pack', 'rack', 'tack', 'jack', 'black', 'track', 'crack', 'stack',
    'fish', 'dish', 'wish', 'cash', 'bash', 'wash', 'path', 'math', 'bath',
    'call', 'fall', 'ball', 'wall', 'tall', 'hall', 'mall', 'bell', 'tell',
    'well', 'sell', 'cell', 'hill', 'fill', 'mill', 'bill', 'will', 'till',
    
    // 5 letter words
    'water', 'earth', 'flame', 'stone', 'metal', 'glass', 'paper', 'table',
    'chair', 'house', 'phone', 'light', 'music', 'dance', 'paint', 'color',
    'sound', 'touch', 'smell', 'taste', 'sight', 'brain', 'heart', 'blood',
    'plant', 'fruit', 'grain', 'bread', 'wheat', 'apple', 'grape', 'lemon',
    'peach', 'cream', 'sugar', 'flour', 'spice', 'honey', 'sweet', 'salty',
    'bitter', 'sour', 'fresh', 'clean', 'dirty', 'rough', 'smooth', 'sharp',
    'blunt', 'thick', 'think', 'drink', 'blink', 'shrink', 'print', 'point',
    'joint', 'paint', 'faint', 'saint', 'claim', 'frame', 'shame', 'flame',
    
    // 6 letter words
    'create', 'delete', 'update', 'insert', 'select', 'filter', 'search',
    'change', 'chance', 'choice', 'chosen', 'frozen', 'broken', 'spoken',
    'woken', 'token', 'stolen', 'golden', 'silver', 'copper', 'bronze',
    'purple', 'orange', 'yellow', 'violet', 'indigo', 'crimson', 'emerald',
    'forest', 'desert', 'island', 'mountain', 'valley', 'stream', 'river',
    'ocean', 'planet', 'comet', 'meteor', 'galaxy', 'stellar', 'cosmic',
    'atomic', 'neural', 'mental', 'dental', 'rental', 'brutal', 'postal',
    
    // 7+ letter words
    'rainbow', 'sunshine', 'moonlight', 'starlight', 'firefly', 'butterfly',
    'elephant', 'dolphin', 'penguin', 'giraffe', 'cheetah', 'leopard',
    'computer', 'keyboard', 'monitor', 'printer', 'scanner', 'speaker',
    'telephone', 'television', 'microwave', 'refrigerator', 'furniture',
    'building', 'construction', 'foundation', 'structure', 'architecture',
    'beautiful', 'wonderful', 'fantastic', 'excellent', 'amazing', 'brilliant',
    'creative', 'innovative', 'strategic', 'tactical', 'practical', 'magical',
    'classical', 'musical', 'theatrical', 'technical', 'mechanical', 'electrical'
  ];
  
  const wordsPath = path.join(__dirname, 'words.json');
  await fs.writeFile(wordsPath, JSON.stringify(commonWords, null, 2));
  console.log(`Generated dictionary with ${commonWords.length} words`);
}

module.exports = {
  loadDictionary,
  generateDictionaryFile
};