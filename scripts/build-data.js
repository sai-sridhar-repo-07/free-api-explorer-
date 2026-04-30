const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const sourcePath = path.join(root, "data", "upstream-public-apis.md");
const outputPath = path.join(root, "data", "apis.json");
const markdown = fs.readFileSync(sourcePath, "utf8");

const entries = [];
let currentCategory = "";

for (const line of markdown.split(/\r?\n/)) {
  const categoryMatch = line.match(/^###\s+(.+?)\s*$/);
  if (categoryMatch) {
    currentCategory = categoryMatch[1].trim();
    continue;
  }

  if (!currentCategory || currentCategory === "APILayer APIs") continue;
  if (!line.startsWith("| [")) continue;
  if (line.includes("|:---") || line.includes("| API |")) continue;

  const columns = splitMarkdownRow(line);
  if (columns.length < 5) continue;

  const linkMatch = columns[0].match(/^\[([^\]]+)\]\(([^)]+)\)$/);
  if (!linkMatch) continue;

  entries.push({
    API: cleanText(linkMatch[1]),
    Description: cleanText(columns[1]),
    Auth: cleanAuth(columns[2]),
    HTTPS: cleanText(columns[3]).toLowerCase() === "yes",
    Cors: cleanText(columns[4]).toLowerCase(),
    Link: linkMatch[2].trim(),
    Category: currentCategory
  });
}

const payload = {
  source: "https://github.com/public-apis/public-apis",
  generatedAt: new Date().toISOString(),
  count: entries.length,
  entries
};

fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Wrote ${entries.length} entries to ${path.relative(root, outputPath)}`);

function splitMarkdownRow(row) {
  return row
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split(" | ")
    .map((column) => column.trim());
}

function cleanAuth(value) {
  const auth = cleanText(value);
  return auth || "No";
}

function cleanText(value) {
  return String(value)
    .replace(/`/g, "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
