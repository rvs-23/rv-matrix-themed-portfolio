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
 * Renders a hierarchical data structure (with `name` and `children` fields)
 * as a text-based tree, pushing HTML lines into an output array.
 * @param {object} node - The current node ({ name, children?, aliases? }).
 * @param {string} prefix - The visual prefix for the current line.
 * @param {boolean} isLast - Whether this node is the last sibling.
 * @param {string[]} outputLines - Array to push formatted lines into.
 * @param {boolean} isRoot - Whether this is the root node (unused, kept for call-site compat).
 */
export function renderTree(node, prefix, isLast, outputLines, _isRoot) {
  const connector = isLast ? "└── " : "├── ";
  const name = node.name ? escapeHtml(node.name) : "Unnamed";
  outputLines.push(`${prefix}${connector}${name}`);
  if (node.children && node.children.length > 0) {
    const newPrefix = prefix + (isLast ? "    " : "│   ");
    node.children.forEach((child, index) => {
      renderTree(
        child,
        newPrefix,
        index === node.children.length - 1,
        outputLines,
        false,
      );
    });
  }
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
 * Escapes a string for safe insertion into HTML.
 * @param {string} str The string to escape.
 * @returns {string} The escaped string.
 */
export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

