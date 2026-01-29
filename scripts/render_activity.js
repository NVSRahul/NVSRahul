import fs from "fs";

const token = process.env.GITHUB_TOKEN;
const user = "NVSRahul";

const query = `
query {
  user(login: "${user}") {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            contributionCount
            date
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

const json = await res.json();

const days = json.data.user.contributionsCollection.contributionCalendar.weeks
  .flatMap(w => w.contributionDays)
  .map(d => d.contributionCount);

// streak calculation
let current = 0, best = 0, tmp = 0;
for (let i = days.length - 1; i >= 0; i--) {
  if (days[i] > 0) {
    tmp++;
    best = Math.max(best, tmp);
  } else {
    if (current === 0) current = tmp;
    tmp = 0;
  }
}
if (current === 0) current = tmp;

const total = json.data.user.contributionsCollection.contributionCalendar.totalContributions;

// progress ring (30-day scale)
const progress = Math.min((current / 30) * 251, 251);

const svg = `
<svg width="600" height="140" xmlns="http://www.w3.org/2000/svg">
<style>
  text { font-family: JetBrains Mono, monospace; fill: #c9d1d9; }
  .label { font-size: 12px; opacity: .7 }
  .value { font-size: 22px; fill: #fff }
  .ring { fill: none; stroke: #58a6ff; stroke-width: 8;
          stroke-dasharray: ${progress} 251;
          transform: rotate(-90deg);
          transform-origin: 50% 50%; }
</style>

<text x="20" y="24" fill="#58a6ff">Activity</text>

<text x="20" y="60" class="label">Total contributions</text>
<text x="20" y="84" class="value">${total}</text>

<text x="200" y="60" class="label">Current streak</text>
<text x="200" y="84" class="value">${current} days</text>

<text x="360" y="60" class="label">Best streak</text>
<text x="360" y="84" class="value">${best} days</text>

<circle cx="540" cy="70" r="40" stroke="#21262d" stroke-width="8" fill="none"/>
<circle cx="540" cy="70" r="40" class="ring"/>
</svg>
`;

fs.writeFileSync("assets/activity.svg", svg);
