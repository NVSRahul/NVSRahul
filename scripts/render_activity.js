import fs from "fs";

const token = process.env.GITHUB_TOKEN;
const user = "NVSRahul";

const query = `
query {
  user(login: "${user}") {
    repositories(privacy: PUBLIC, isFork: false, first: 100) {
      totalCount
      nodes {
        stargazerCount
        languages(first: 5) {
          edges {
            size
            node { name }
          }
        }
      }
    }
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            contributionCount
          }
        }
      }
    }
  }
}
`;

const res = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ query })
});

const data = (await res.json()).data.user;

/* ---------- commits + streaks ---------- */

const calendar = data.contributionsCollection.contributionCalendar;
const days = calendar.weeks.flatMap(w => w.contributionDays);

let current = 0, best = 0, temp = 0;
for (let i = days.length - 1; i >= 0; i--) {
  if (days[i].contributionCount > 0) {
    temp++;
    best = Math.max(best, temp);
  } else {
    if (current === 0) current = temp;
    temp = 0;
  }
}
if (current === 0) current = temp;

/* ---------- repos + stars ---------- */

const repos = data.repositories.totalCount;
const stars = data.repositories.nodes.reduce(
  (sum, r) => sum + r.stargazerCount, 0
);

/* ---------- languages ---------- */

const langMap = {};
for (const repo of data.repositories.nodes) {
  for (const l of repo.languages.edges) {
    langMap[l.node.name] = (langMap[l.node.name] || 0) + l.size;
  }
}

const topLanguages = Object.entries(langMap)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([name]) => name)
  .join(" · ");

/* ---------- SVG ---------- */

const svg = `
<svg width="760" height="160" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#0d1117"/>

  <text x="24" y="28" font-size="16" fill="#58a6ff"
    font-family="JetBrains Mono">Overview</text>

  <text x="24" y="64" font-size="12" fill="#8b949e"
    font-family="JetBrains Mono">Commits</text>
  <text x="24" y="94" font-size="22" fill="#ffffff"
    font-family="JetBrains Mono">${calendar.totalContributions}</text>

  <text x="140" y="64" font-size="12" fill="#8b949e"
    font-family="JetBrains Mono">Repositories</text>
  <text x="140" y="94" font-size="22" fill="#ffffff"
    font-family="JetBrains Mono">${repos}</text>

  <text x="300" y="64" font-size="12" fill="#8b949e"
    font-family="JetBrains Mono">Stars</text>
  <text x="300" y="94" font-size="22" fill="#ffffff"
    font-family="JetBrains Mono">${stars}</text>

  <text x="420" y="64" font-size="12" fill="#8b949e"
    font-family="JetBrains Mono">Streak</text>
  <text x="420" y="94" font-size="22" fill="#ffffff"
    font-family="JetBrains Mono">${current} / ${best} days</text>

  <text x="24" y="132" font-size="12" fill="#8b949e"
    font-family="JetBrains Mono">Languages</text>
  <text x="110" y="132" font-size="12" fill="#c9d1d9"
    font-family="JetBrains Mono">${topLanguages}</text>
</svg>
`;

fs.writeFileSync("assets/activity.svg", svg);
