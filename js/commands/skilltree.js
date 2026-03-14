/**
 * @file js/commands/skilltree.js
 * Handles the 'skilltree' command for interactively exploring skills.
 */

export default function skillTreeCommand(args, context) {
  const { appendToTerminal, skillsData, renderTree } = context; // renderTree is from js/commands/index.js

  if (!skillsData) {
    appendToTerminal(
      "<div class='output-error'>Skills data not loaded. Please check 'assets/skills.json'.</div>",
      "output-error-wrapper",
    );
    return;
  }

  const pathArg = args.join(" ").trim();
  let targetNode = skillsData; // Start with the root of the loaded skills data
  let displayPath = skillsData.name || "Skills Root"; // Use the name from JSON if available

  if (pathArg) {
    const pathParts = pathArg
      .toLowerCase()
      .split(">")
      .map((p) => p.trim())
      .filter((p) => p);
    let currentNode = skillsData;
    let currentPathForDisplayArray = [];
    let pathFound = true;

    for (const part of pathParts) {
      if (!part) continue;
      let foundNodeInChildren = null;
      if (currentNode.children) {
        foundNodeInChildren = currentNode.children.find((child) => {
          const nameMatch = child.name && child.name.toLowerCase() === part;
          const aliasMatch =
            child.aliases &&
            Array.isArray(child.aliases) &&
            child.aliases.map((a) => String(a).toLowerCase()).includes(part);
          return nameMatch || aliasMatch;
        });
      }
      if (foundNodeInChildren) {
        currentNode = foundNodeInChildren;
        currentPathForDisplayArray.push(currentNode.name);
      } else {
        const errorPathTrail =
          currentPathForDisplayArray.length > 0
            ? currentPathForDisplayArray.join(" > ") + " > "
            : "";
        const sanitizedPart = part.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const sanitizedTrail = errorPathTrail
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        appendToTerminal(
          `<div class='output-error'>Path segment not found: "${sanitizedPart}" in "${sanitizedTrail}${sanitizedPart}"</div>`,
          "output-error-wrapper",
        );
        appendToTerminal(
          `<div>Hint: Check available aliases or names. Current skill root: '${skillsData.name || "Skills"}'.</div>`,
          "output-text-wrapper",
        );
        pathFound = false;
        break;
      }
    }
    if (pathFound) {
      targetNode = currentNode;
      displayPath =
        (skillsData.name || "Skills Root") +
        (currentPathForDisplayArray.length > 0
          ? " > " + currentPathForDisplayArray.join(" > ")
          : "");
    } else {
      return; // Exit if path not found
    }
  }

  const titleHtml = `<div class="output-section-title" style="border-left: none; padding-left:0;"><i class="fas fa-sitemap"></i> Skill Pathway: ${displayPath.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`;
  let treeHtmlLines = [];

  if (targetNode === skillsData) {
    // Root call or empty path argument
    if (targetNode.children && targetNode.children.length > 0) {
      targetNode.children.forEach((child, index) =>
        renderTree(
          child,
          "  ",
          index === targetNode.children.length - 1,
          treeHtmlLines,
          false,
        ),
      );
    } else {
      treeHtmlLines.push("  (No skill categories defined under root)");
    }
  } else if (targetNode.children && targetNode.children.length > 0) {
    // Navigated to a category with children
    targetNode.children.forEach((child, index) =>
      renderTree(
        child,
        "  ",
        index === targetNode.children.length - 1,
        treeHtmlLines,
        false,
      ),
    );
  } else {
    // Navigated to a leaf node or an empty category
    treeHtmlLines.push(
      "    └── (End of this skill branch or no further sub-skills listed.)",
    );
    // Optionally, display a description if present in the leaf node
    // if (targetNode.description) { treeHtmlLines.push(`        ${targetNode.description.replace(/</g, "&lt;").replace(/>/g, "&gt;")}`); }
  }

  const fullOutput =
    titleHtml + treeHtmlLines.join("\n").replace(/\n/g, "<br/>");
  appendToTerminal(fullOutput, "output-skilltree-wrapper");

  if (!pathArg && skillsData.children && skillsData.children.length > 0) {
    appendToTerminal(
      "<div>Hint: Navigate deeper using names or aliases (e.g., `skilltree se`, `skilltree ai > genai`). Check `assets/skills.json` for defined aliases.</div>",
      "output-text-wrapper",
    );
  }
}
