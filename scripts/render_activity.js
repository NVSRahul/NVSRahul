import fs from "fs";

const data = JSON.parse(fs.readFileSync("data/metrics.json", "utf8"));

const total = data.activity?.commits || 0;
const streak = data.activity?.streak?.current || 0;
const best = data.activity?.streak?.max || 0;

const progress = Math.min((streak / 30) * 360, 360);

const svg = `
<svg width="600" height="140" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: JetBrains Mono, monospace; fill: #c9d1d9; }
    .label { font-size: 12px; opacity: .7 }
    .value { font-size: 22px; fill: #fff }
    .ring { fill: none; stroke: #58a6ff; stroke-width: 8;
            stroke-dasharray: ${progress} 360;
            transform: rotate(-90deg);
            transform-origin: 50% 50%; }
  </style>

  <text x="20" y="24" fill="#58a6ff">Activity</text>

  <text x="20" y="60" class="label">Total</text>
  <text x="20" y="84" class="value">${total}</text>

  <text x="140" y="60" class="label">Current streak</text>
  <text x="140" y="84" class="value">${streak} days</text>

  <text x="280" y="60" class="label">Best</text>
  <text x="280" y="84" class="value">${best} days</text>

  <circle cx="520" cy="70" r="40" stroke="#21262d" stroke-width="8" fill="none"/>
  <circle cx="520" cy="70" r="40" class="ring"/>
</svg>
`;

fs.writeFileSync("assets/activity.svg", svg);
