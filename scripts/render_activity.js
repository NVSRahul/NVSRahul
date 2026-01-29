import fs from "fs";

const token = process.env.GITHUB_TOKEN;
const user = "NVSRahul";

const query = `
query {
  user(login: "${user}") {
    repositories(privacy: PUBLIC, isFork: false) {
      totalCount
    }
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

const calendar =
  json.data.user.contributionsCollection.contributionCalendar;

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

const totalContributions = calendar.totalContributions;
const totalRepos = json.data.user.repositories.totalCount;

// ring math
const radius = 42;
const circumference = 2 * Math.PI * radius;
const progress = Math.min(current / 30, 1);
const dash = circumference * progress;

const svg = `
<svg width="720" height="160" xmlns="http://www.w3.org/2000/svg">
<style>
  text {
    font-family: JetBrains Mono, monospace;
    fill: #c9d1d9;
  }
  .title {
    font-size: 16px;
    fill: #58a6ff;
  }
  .label {
    font-size: 12px;
    opacity: .7;
  }
  .value {
    font-size: 22px;
    fill: #ffffff;
  }
  .ring-bg {
    fill: none;
    stroke: #21262d;
    stroke-width: 8;
  }
  .ring {
    fill: none;
    stroke: #58a6ff;
    stroke-width: 8;
    stroke-linecap: round;
    stroke-dasharray: ${dash} ${circumference};
    animation: draw 1.6s ease-out forwards;
    transform: rotate(-90deg);
    transform-origin: 50% 50%;
  }
  @keyframes draw {
    from {
      stroke-dasharray: 0 ${circumference};
    }
    to {
      stroke-dasharray: ${dash} ${circumference};
    }
  }
</style>

<text x="24" y="26" class="title">Activity</text>

<text x="24" y="64" class="label">Total contributions</text>
<text x="24" y="92" class="value">${totalContributions}</text>

<text x="200" y="64" class="label">Repositories</text>
<text x="200" y="92" class="value">${totalRepos}</text>

<text x="360" y="64" class="label">Current streak</text>
<text x="360" y="92" class="value">${current} days</text>

<text x="520" y="64" class="label">Best streak</text>
<text x="520" y="92" class="value">${best} days</text>

<circle cx="640" cy="88" r="${radius}" class="ring-bg"/>
<circle cx="640" cy="88" r="${radius}" class="ring"/>

</svg>
`;

fs.writeFileSync("assets/activity.svg", svg);
