/**
 * @file js/commands/skills.js
 * Handles the 'skills' command, displaying a summary of key skill areas.
 */

export default function skillsCommand(args, context) {
    const { appendToTerminal, skillsData } = context;

    if (!skillsData || !skillsData.children || skillsData.children.length === 0) {
        appendToTerminal("<div class='output-error'>Skills data not loaded or is empty. Please check 'assets/skills.json'.</div>", 'output-error-wrapper');
        return;
    }

    let htmlOutput = `<div class="output-section-title"><i class="fas fa-cogs"></i> ${skillsData.name || 'CORE SKILLSET MATRIX'}</div>`;

    if (skillsData.children && skillsData.children.length > 0) {
        skillsData.children.forEach(category => {
            const categoryName = category.name ? category.name.replace(/</g, "&lt;").replace(/>/g, "&gt;") : "Unnamed Category";
            htmlOutput += `<div class="output-skills-category">${categoryName}</div>`;
            htmlOutput += `<ul class="output-skills-list">`;

            if (category.children && category.children.length > 0) {
                category.children.slice(0, 3).forEach(subCategory => {
                    const subCategoryName = subCategory.name ? subCategory.name.replace(/</g, "&lt;").replace(/>/g, "&gt;") : "Unnamed Skill";
                    htmlOutput += `<li>${subCategoryName}</li>`;
                });
                if (category.children.length > 3) {
                    // Suggest using the first alias, or derive from name for the skilltree hint
                    const aliasToSuggest = category.aliases && category.aliases.length > 0
                        ? category.aliases[0]
                        : categoryName.toLowerCase().split(' ')[0].replace(/&lt;|&gt;/g, '');
                    htmlOutput += `<li>... and more (use 'skilltree ${aliasToSuggest}')</li>`;
                }
            } else {
                htmlOutput += `<li>(Details for ${categoryName} via 'skilltree')</li>`;
            }
            htmlOutput += `</ul>`;
        });
    } else {
        htmlOutput += `<div class="output-line">No skill categories defined in skills.json.</div>`;
    }

    htmlOutput += `<br/><div>Type 'skilltree' for a detailed breakdown or 'skilltree [path]' to explore specific areas (e.g., 'skilltree ai').</div>`;
    appendToTerminal(htmlOutput, 'output-skills-wrapper');
}
