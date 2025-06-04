/**
 * @file js/commands/hobbies.js
 * Handles the 'hobbies' command, displaying a summary of hobbies and interests.
 */

export default function hobbiesCommand(args, context) {
    const { appendToTerminal, hobbiesData } = context;

    if (!hobbiesData || !hobbiesData.children || hobbiesData.children.length === 0) {
        appendToTerminal("<div class='output-error'>Hobbies data not loaded or is empty. Please check 'assets/hobbies.json'.</div>", 'output-error-wrapper');
        return;
    }

    let htmlOutput = `<div class="output-section-title"><i class="fas fa-puzzle-piece"></i> ${hobbiesData.name || 'HOBBIES & INTERESTS'}</div>`;

    if (hobbiesData.children && hobbiesData.children.length > 0) {
        hobbiesData.children.forEach(category => {
            const categoryName = category.name ? category.name.replace(/</g, "&lt;").replace(/>/g, "&gt;") : "Unnamed Category";
            htmlOutput += `<div class="output-skills-category">${categoryName}</div>`; // Re-use skills styling for consistency
            htmlOutput += `<ul class="output-skills-list">`; // Re-use skills styling

            if (category.children && category.children.length > 0) {
                category.children.forEach(subCategory => { // Display all sub-categories, not just first 3 like skills
                    const subCategoryName = subCategory.name ? subCategory.name.replace(/</g, "&lt;").replace(/>/g, "&gt;") : "Unnamed Hobby";
                    htmlOutput += `<li>${subCategoryName}</li>`;
                     // If subCategory also has children, you might want to indicate that, or implement a hobbytree command
                    if (subCategory.children && subCategory.children.length > 0) {
                        htmlOutput += `<ul>`;
                        subCategory.children.forEach(item => {
                             const itemName = item.name ? item.name.replace(/</g, "&lt;").replace(/>/g, "&gt;") : "Detail";
                             htmlOutput += `<li>${itemName}</li>`;
                        });
                        htmlOutput += `</ul>`;
                    }
                });
            } else {
                 // This case might not be hit if all categories have children as per your hobbies.json structure
                const aliasToSuggest = category.aliases && category.aliases.length > 0
                    ? category.aliases[0]
                    : categoryName.toLowerCase().split(' ')[0].replace(/&lt;|&gt;/g, '');
                htmlOutput += `<li>Details for ${categoryName} (Future: use 'hobbytree ${aliasToSuggest}' for more)</li>`;
            }
            htmlOutput += `</ul>`;
        });
    } else {
        htmlOutput += `<div class="output-line">No hobby categories defined in hobbies.json.</div>`;
    }
    // Future: Add a hint for a 'hobbytree' command if you plan to implement it.
    // htmlOutput += `<br/><div>Type 'hobbytree [path]' to explore specific hobbies.</div>`;
    appendToTerminal(htmlOutput, 'output-skills-wrapper'); // Can reuse 'output-skills-wrapper' or create 'output-hobbies-wrapper'
}
