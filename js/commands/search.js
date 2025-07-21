/**
 * @file js/commands/search.js
 * Implements a smarter fuzzy search functionality.
 */

import { getLevenshteinDistance } from "../utils.js";

/**
 * Calculates a relevance score for a search term against a candidate string.
 * A lower score is better.
 * Prioritizes substring matches over fuzzy (Levenshtein) matches.
 * @param {string} searchTerm The user's input.
 * @param {string} candidate The string to compare against.
 * @returns {number} The relevance score.
 */
function getRelevanceScore(searchTerm, candidate) {
  const lowerSearch = searchTerm.toLowerCase();
  const lowerCandidate = candidate.toLowerCase();

  // 1. Prioritize substring matches heavily
  if (lowerCandidate.includes(lowerSearch)) {
    // Score is based on how much longer the candidate is.
    // A perfect match ("gui" vs "gui") gets a score of 0.
    // A substring match ("gui" vs "guitar") gets a small penalty.
    return (lowerCandidate.length - lowerSearch.length) * 0.1;
  }

  // 2. If not a substring, use normalized Levenshtein distance
  const distance = getLevenshteinDistance(lowerSearch, lowerCandidate);
  // Normalize the distance by the length of the candidate string
  const normalizedDistance = distance / lowerCandidate.length;

  // Add 1 to ensure fuzzy matches are always scored worse than substring matches
  return 1 + normalizedDistance;
}

/**
 * Performs a fuzzy search across commands, skills, and hobbies.
 * @param {string[]} args - The arguments passed to the command.
 * @param {object} context - The application context.
 * @returns {void} This command outputs directly to the terminal.
 */
export default async function searchCommand(args, context) {
  const { appendToTerminal, manPages, skillsData, hobbiesData } = context;
  const searchTerm = args[0];

  if (!searchTerm) {
    appendToTerminal("Usage: search &lt;term&gt;");
    return;
  }

  let results = [];
  const scoreThreshold = 1.5; // Stricter threshold for the new scoring system. Lower is stricter.

  const processItem = (name, type, description = "") => {
    const score = getRelevanceScore(searchTerm, name);
    if (score < scoreThreshold) {
      results.push({ type, name, description, score });
    }
  };

  // 1. Search through commands
  if (manPages) {
    Object.keys(manPages).forEach((commandName) => {
      processItem(commandName, "COMMAND", manPages[commandName].description);
    });
  }

  // 2. Search through skills
  if (skillsData && skillsData.children) {
    const findSkills = (node) => {
      if (!node.children) return;
      node.children.forEach((item) => {
        processItem(item.name, "SKILL", `Category: ${node.name || "Root"}`);
        findSkills(item); // Recurse
      });
    };
    findSkills(skillsData);
  }

  // 3. Search through hobbies
  if (hobbiesData && Array.isArray(hobbiesData.hobbies)) {
    hobbiesData.hobbies.forEach((hobby) => {
      processItem(hobby, "HOBBY");
    });
  }

  if (results.length === 0) {
    appendToTerminal(`No results found for "${searchTerm}".`);
    return;
  }

  // Sort results by score (most relevant first)
  results.sort((a, b) => a.score - b.score);

  // Format the output
  let output = `Search results for "<span class="highlight">${searchTerm}</span>":\n\n`;
  results.forEach((res) => {
    output += `[${res.type}] - <b>${res.name}</b>\n`;
    if (res.description) {
      output += `  <span class="comment">${res.description}</span>\n`;
    }
  });

  appendToTerminal(output);
}
