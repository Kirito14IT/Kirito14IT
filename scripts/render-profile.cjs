const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'output', 'profile');
const assets = path.join(root, 'assets');
const frameCount = 80;
const tau = Math.PI * 2;
const green = '#00ff41';
const amber = '#ffb000';

function orbit(theta, rotation, rx = 155, ry = 59) {
  const x = rx * Math.cos(theta);
  const y = ry * Math.sin(theta);
  return [950 + x * Math.cos(rotation) - y * Math.sin(rotation),
    170 + x * Math.sin(rotation) + y * Math.cos(rotation)];
}

function line(points) {
  return points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
}

function waves(phase, base, amplitude, count = 5) {
  return Array.from({ length: count }, (_, layer) => {
    const points = Array.from({ length: 121 }, (_, i) => {
      const x = i * 10;
      const y = base + layer * 7 + amplitude * Math.sin(x / 220 + phase + layer * 0.18)
        + amplitude * 0.4 * Math.cos(x / 137 - phase + layer * 0.15);
      return [x, y];
    });
    return `<path d="${line(points)}" fill="none" stroke="url(#signal)" stroke-width="${layer === 1 ? 1.8 : 0.8}" opacity="${0.65 - layer * 0.1}"/>`;
  }).join('');
}

function orbitNetwork(phase) {
  let result = '';
  for (let ring = 0; ring < 3; ring++) {
    const rotation = -0.4 + ring * 1.0;
    const points = Array.from({ length: 101 }, (_, i) => orbit(i / 100 * tau, rotation));
    result += `<path d="${line(points)}" fill="none" stroke="${ring === 2 ? amber : green}" stroke-width="1" opacity="0.26"/>`;
    for (let tail = 12; tail >= 0; tail--) {
      const [x, y] = orbit(phase + ring * 2.1 - tail * 0.028, rotation);
      result += `<circle cx="${x}" cy="${y}" r="${tail === 0 ? 4.5 : 2.1}" fill="${ring === 2 ? amber : green}" opacity="${0.9 * (1 - tail / 13)}"/>`;
    }
  }

  const nodes = Array.from({ length: 6 }, (_, i) => {
    const theta = i / 6 * tau - Math.PI / 2;
    const radius = 82 + 3 * Math.sin(phase + i * 0.6);
    return [950 + radius * Math.cos(theta), 170 + radius * Math.sin(theta)];
  });
  result += `<path d="${line([...nodes, nodes[0]])}" stroke="${green}" stroke-width="1" opacity="0.22" fill="none"/>`;
  nodes.forEach(([x, y], i) => {
    const pulse = 0.65 + 0.3 * Math.cos(phase + i);
    result += `<path d="M950,170 L${x},${y}" stroke="${green}" opacity="0.1"/>
      <circle cx="${x}" cy="${y}" r="9" fill="#071b1b" stroke="${green}" stroke-opacity="${pulse}"/>
      <circle cx="${x}" cy="${y}" r="2.5" fill="${green}" opacity="${pulse}"/>`;
  });
  return result;
}

function header(phase) {
  const stars = Array.from({ length: 31 }, (_, i) => {
    const x = 690 + (i * 83) % 480;
    const y = 25 + (i * 53) % 275;
    return `<circle cx="${x}" cy="${y}" r="${i % 5 === 0 ? 1.4 : 0.7}" fill="${i % 7 === 0 ? amber : green}" opacity="${0.15 + 0.15 * (1 + Math.sin(phase + i))}"/>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="360" viewBox="0 0 1200 360">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#070f1a"/><stop offset="1" stop-color="#0d1b2a"/></linearGradient>
    <radialGradient id="halo"><stop stop-color="#00ff41" stop-opacity="0.12"/><stop offset="1" stop-color="#00ff41" stop-opacity="0"/></radialGradient>
    <linearGradient id="signal"><stop stop-color="#00ff41" stop-opacity="0.05"/><stop offset="0.35" stop-color="#00ff41"/><stop offset="0.8" stop-color="#00ff41"/><stop offset="1" stop-color="#ffb000"/></linearGradient>
    <pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0 3.5H4" stroke="#000" stroke-opacity="0.16"/></pattern>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#00ff41" stroke-opacity="0.035"/></pattern>
  </defs>
  <rect width="1200" height="360" rx="18" fill="url(#bg)"/>
  <rect width="1200" height="360" rx="18" fill="url(#grid)"/>
  <ellipse cx="950" cy="170" rx="248" ry="166" fill="url(#halo)"/>
  ${stars}
  <circle cx="950" cy="170" r="167" stroke="${green}" stroke-opacity="0.12" stroke-dasharray="2 13" fill="none"/>
  ${orbitNetwork(phase)}
  <circle cx="950" cy="170" r="50" fill="#0a1821" stroke="${green}" stroke-opacity="0.4"/>
  <circle cx="950" cy="170" r="58" fill="none" stroke="${green}" stroke-opacity="${0.16 + 0.06 * Math.sin(phase)}"/>
  <path d="M950 140 L974 151 V170 Q974 187 950 200 Q926 187 926 170 V151Z" fill="#00ff41" fill-opacity="0.06" stroke="${green}" stroke-width="1.8"/>
  <path d="M939 169 L947 177 L962 160" fill="none" stroke="${green}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <g font-family="Consolas, Liberation Mono, monospace">
    <path d="M54 42H82" stroke="${green}" stroke-width="3"/>
    <text x="96" y="48" fill="${green}" font-size="17">Krico / Kirito14IT</text>
    <text x="52" y="144" fill="#eef7f2" font-size="68" font-weight="700" letter-spacing="-3">Zhihua Wang</text>
    <text x="56" y="188" fill="#98afa9" font-size="20">AI Safety / LLM Agents / Software Security</text>
    <rect x="56" y="224" width="235" height="32" rx="16" fill="#00ff41" fill-opacity="0.08" stroke="#00ff41" stroke-opacity="0.3"/>
    <circle cx="73" cy="240" r="3" fill="${green}"/>
    <text x="85" y="245" fill="#a5dbb1" font-size="14">Fudan University / 2027</text>
    <path d="M56 278H370" stroke="#00ff41" stroke-opacity="0.1"/>
  </g>
  ${waves(phase, 309, 12, 5)}
  <rect width="1200" height="360" rx="18" fill="url(#scan)"/>
  </svg>`;
}

function footer(phase) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="68" viewBox="0 0 1200 68">
  <defs><linearGradient id="signal"><stop stop-color="#00ff41" stop-opacity="0"/><stop offset="0.35" stop-color="#00ff41"/><stop offset="0.7" stop-color="#00ff41"/><stop offset="1" stop-color="#ffb000" stop-opacity="0"/></linearGradient></defs>
  <rect width="1200" height="68" rx="12" fill="#091421"/>
  ${waves(phase, 20, 6, 5)}
  </svg>`;
}

async function main() {
  await fs.mkdir(assets, { recursive: true });
  for (const kind of ['header', 'footer']) {
    await fs.mkdir(path.join(output, kind), { recursive: true });
  }
  await fs.writeFile(path.join(assets, 'research-orbit.svg'), header(0));
  await sharp(Buffer.from(header(0))).png().toFile(path.join(output, 'poster.png'));
  for (let i = 0; i < frameCount; i++) {
    const phase = i / frameCount * tau;
    const filename = `${String(i).padStart(3, '0')}.png`;
    await sharp(Buffer.from(header(phase))).png().toFile(path.join(output, 'header', filename));
    await sharp(Buffer.from(footer(phase))).png().toFile(path.join(output, 'footer', filename));
    if (i % 20 === 0) console.log(`Rendered ${i}/${frameCount} frames`);
  }
  console.log(`Rendered ${frameCount} frames per animation to ${output}`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
