// js/utils.js

/**
 * A collection of generic utility functions for the application.
 */

/**
 * Calculates the Levenshtein distance between two strings for fuzzy searching.
 * @param {string} s1 The first string.
 * @param {string} s2 The second string.
 * @returns {number} The Levenshtein distance.
 */
export function getLevenshteinDistance(s1, s2) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) {
      costs[s2.length] = lastValue;
    }
  }
  return costs[s2.length];
}

/**
 * Renders a hierarchical data structure as a text-based tree.
 * Originally from js/commands/skilltree.js
 * @param {object} node - The current node in the data structure.
 * @param {string} prefix - The prefix for the current line of the tree.
 * @returns {string} The formatted tree string.
 */
export function renderTree(node, prefix = "") {
  let result = "";
  const keys = Object.keys(node);
  keys.forEach((key, index) => {
    const isLast = index === keys.length - 1;
    const connector = isLast ? "└── " : "├── ";
    result += `${prefix}${connector}${key}\n`;
    if (typeof node[key] === "object" && node[key] !== null) {
      const newPrefix = prefix + (isLast ? "    " : "│   ");
      result += renderTree(node[key], newPrefix);
    }
  });
  return result;
}

/**
 * Creates a debounced function that delays invoking the provided function
 * until after `wait` milliseconds have elapsed since the last time it was invoked.
 * Originally from js/rain/engine.js
 * @param {Function} func - The function to debounce.
 * @param {number} wait - The number of milliseconds to delay.
 * @returns {Function} The new debounced function.
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Triggers a file download in the browser.
 * Originally from js/commands/download.js
 * @param {string} url - The URL of the file to download.
 * @param {string} fileName - The desired name for the downloaded file.
 */
export function downloadFile(url, fileName) {
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
