import { antigravityBot } from "./index";

function testSanitize(text: string) {
    // Note: sanitzeMarkdown est interne à index.ts, je vais la tester via une copie ici pour validation
    const sanitized = text.replace(/([^\\])_/g, "$1\\_");
    console.log(`Original: ${text}`);
    console.log(`Sanitized: ${sanitized}`);
    console.log("---");
}

console.log("=== Test Sanitize Markdown ===");
testSanitize("Hello_world");
testSanitize("Usage: click_here_to_start");
testSanitize("Complex\\_case_already\\_escaped");
testSanitize("No underscores here");
