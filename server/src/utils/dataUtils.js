const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');

/**
 * Read data from a JSON file
 * @param {string} filename - Name of the JSON file (without path)
 * @returns {Array|Object} Parsed JSON data
 */
const readData = (filename) => {
  try {
    const filePath = path.join(dataDir, filename);
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error.message);
    return [];
  }
};

/**
 * Write data to a JSON file
 * @param {string} filename - Name of the JSON file (without path)
 * @param {Array|Object} data - Data to write
 * @returns {boolean} Success status
 */
const writeData = (filename, data) => {
  try {
    const filePath = path.join(dataDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing ${filename}:`, error.message);
    return false;
  }
};

/**
 * Generate a new unique ID for a collection
 * @param {Array} collection - Array of items with id property
 * @returns {number} New unique ID
 */
const generateId = (collection) => {
  if (!collection || collection.length === 0) return 1;
  const maxId = Math.max(...collection.map(item => item.id || 0));
  return maxId + 1;
};

module.exports = {
  readData,
  writeData,
  generateId
};
