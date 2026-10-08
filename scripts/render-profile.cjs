const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'output', 'profile');
const assets = path.join(root, 'assets');
const frameCount = 80;
const tau = Math.PI * 2;
const colors = ['#00f0ff', '#a879ff', '#ff4da6', '#ffb347', '#579bff'];
const cyan = colors[0];
const pink = colors[2];
const emojiFont = process.env.PROFILE_EMOJI_FONT || 'C:/Windows/Fonts/seguiemj.ttf';
if (!GlobalFonts.registerFromPath(emojiFont, 'Profile Emoji')) {
  throw new Error(`Cannot register the color emoji font: ${emojiFont}`);
}

function emojiImage(codepoint) {
  const canvas = createCanvas(160, 160);
  const context = canvas.getContext('2d');
  context.font = '128px "Profile Emoji"';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(String.fromCodePoint(codepoint), 80, 80);
  return `data:image/png;base64,${canvas.toBuffer('image/png').toString('base64')}`;
}

const emoji = {
  handshake: emojiImage(0x1f91d),
  sparkle: emojiImage(0x2728),
  planet: emojiImage(0x1fa90),
};

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
      const y = waveY(x, phase, base, amplitude, layer);
      return [x, y];
    });
    const gradient = `url(#signal-${layer % colors.length})`;
    const progress = (phase / tau + layer * 0.21) % 1;
    const x = progress * 1200;
    const y = waveY(x, phase, base, amplitude, layer);
    const opacity = Math.sin(progress * Math.PI) ** 2;
    return `<path d="${line(points)}" fill="none" stroke="${gradient}" stroke-width="7" opacity="0.06"/>
      <path d="${line(points)}" fill="none" stroke="${gradient}" stroke-width="${layer % 2 ? 1.1 : 1.8}" opacity="0.72"/>
      <circle cx="${x}" cy="${y}" r="5" fill="${colors[layer % colors.length]}" opacity="${opacity * 0.12}"/>
      <circle cx="${x}" cy="${y}" r="1.8" fill="${colors[layer % colors.length]}" opacity="${opacity * 0.9}"/>`;
  }).join('');
}

function waveY(x, phase, base, amplitude, layer) {
  return base + layer * 7 + amplitude * Math.sin(x / 220 + phase + layer * 0.3)
    + amplitude * 0.4 * Math.cos(x / 137 - phase + layer * 0.23);
}

function signalGradients() {
  return colors.map((color, i) => `<linearGradient id="signal-${i}">
    <stop stop-color="${color}" stop-opacity="0"/>
    <stop offset="0.22" stop-color="${color}"/>
    <stop offset="0.72" stop-color="${colors[(i + 1) % colors.length]}"/>
    <stop offset="1" stop-color="${colors[(i + 1) % colors.length]}" stop-opacity="0.15"/>
  </linearGradient>`).join('');
}

function constellation(phase) {
  const clusters = Array.from({ length: 7 }, (_, i) => {
    const angle = i / 7 * tau - 0.2;
    return [950 + 177 * Math.cos(angle), 170 + 118 * Math.sin(angle)];
  });
  let result = '';
  clusters.forEach(([cx, cy], cluster) => {
    const color = colors[cluster % colors.length];
    const destination = clusters[(cluster + 3) % clusters.length];
    const control = [950 + Math.sin(cluster) * 64, 170 + Math.cos(cluster) * 40];
    const curve = `M${cx},${cy} Q${control.join(',')} ${destination.join(',')}`;
    result += `<path d="${curve}" fill="none" stroke="${color}" stroke-width="0.6" opacity="0.12"/>`;
    const t = (phase / tau + cluster / 7) % 1;
    const x = (1 - t) ** 2 * cx + 2 * t * (1 - t) * control[0] + t ** 2 * destination[0];
    const y = (1 - t) ** 2 * cy + 2 * t * (1 - t) * control[1] + t ** 2 * destination[1];
    result += `<circle cx="${x}" cy="${y}" r="2" fill="${color}" opacity="${Math.sin(t * Math.PI) ** 2 * 0.8}"/>`;
    for (let particle = 0; particle < 22; particle++) {
      const angle = particle * 2.399 + cluster * 0.8;
      const radius = 4 + Math.sqrt(particle) * 5;
      const x = cx + Math.cos(angle) * radius + 2.5 * Math.sin(phase + particle * 0.9);
      const y = cy + Math.sin(angle) * radius * 0.7 + 2 * Math.cos(phase + particle * 0.6);
      const opacity = 0.2 + 0.36 * (1 + Math.sin(phase + particle + cluster)) / 2;
      result += `<circle cx="${x}" cy="${y}" r="${particle % 7 ? 0.8 : 1.4}" fill="${color}" opacity="${opacity}"/>`;
    }
  });
  return result;
}

function orbitNetwork(phase) {
  let result = '';
  for (let ring = 0; ring < 4; ring++) {
    const rotation = -0.4 + ring * 0.83;
    const color = colors[ring];
    const points = Array.from({ length: 101 }, (_, i) => orbit(i / 100 * tau, rotation));
    result += `<path d="${line(points)}" fill="none" stroke="${color}" stroke-width="5" opacity="0.04"/>
      <path d="${line(points)}" fill="none" stroke="${color}" stroke-width="1" opacity="0.37"/>`;
    for (let tail = 18; tail >= 0; tail--) {
      const [x, y] = orbit(phase + ring * 1.7 - tail * 0.023, rotation);
      result += `<circle cx="${x}" cy="${y}" r="${tail === 0 ? 3.8 : 1.6}" fill="${color}" opacity="${0.95 * (1 - tail / 19)}"/>`;
      if (tail === 0) result += `<circle cx="${x}" cy="${y}" r="9" fill="${color}" opacity="0.1"/>`;
    }
  }

  const nodes = Array.from({ length: 6 }, (_, i) => {
    const theta = i / 6 * tau - Math.PI / 2;
    const radius = 82 + 3 * Math.sin(phase + i * 0.6);
    return [950 + radius * Math.cos(theta), 170 + radius * Math.sin(theta)];
  });
  result += `<path d="${line([...nodes, nodes[0]])}" stroke="url(#neon)" stroke-width="1" opacity="0.4" fill="none"/>`;
  nodes.forEach(([x, y], i) => {
    const pulse = 0.6 + 0.25 * Math.cos(phase + i);
    const color = colors[i % colors.length];
    result += `<path d="M950,170 L${x},${y}" stroke="${color}" opacity="0.16"/>
      <circle cx="${x}" cy="${y}" r="14" fill="${color}" opacity="${pulse * 0.055}"/>
      <circle cx="${x}" cy="${y}" r="8" fill="#101027" stroke="${color}" stroke-opacity="${pulse}"/>
      <circle cx="${x}" cy="${y}" r="2.5" fill="${color}" opacity="${pulse}"/>`;
  });
  return result;
}

function header(phase) {
  const stars = Array.from({ length: 43 }, (_, i) => {
    const x = 650 + (i * 83) % 520;
    const y = 25 + (i * 53) % 275;
    return `<circle cx="${x}" cy="${y}" r="${i % 5 === 0 ? 1.4 : 0.7}" fill="${colors[i % colors.length]}" opacity="${0.16 + 0.12 * (1 + Math.sin(phase + i))}"/>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="360" viewBox="0 0 1200 360">
  <title>Hi, I'm Krico. AI Safety, LLM Agents and Software Security.</title>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#080b19"/><stop offset="0.55" stop-color="#160b27"/><stop offset="1" stop-color="#071e2b"/></linearGradient>
    <linearGradient id="neon"><stop stop-color="${cyan}"/><stop offset="0.5" stop-color="${colors[1]}"/><stop offset="1" stop-color="${pink}"/></linearGradient>
    <radialGradient id="violet-halo"><stop stop-color="#a879ff" stop-opacity="0.19"/><stop offset="1" stop-color="#a879ff" stop-opacity="0"/></radialGradient>
    <radialGradient id="cyan-halo"><stop stop-color="${cyan}" stop-opacity="0.14"/><stop offset="1" stop-color="${cyan}" stop-opacity="0"/></radialGradient>
    <radialGradient id="pink-halo"><stop stop-color="${pink}" stop-opacity="0.11"/><stop offset="1" stop-color="${pink}" stop-opacity="0"/></radialGradient>
    ${signalGradients()}
    <pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0 3.5H4" stroke="#000" stroke-opacity="0.11"/></pattern>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#b7b7ff" stroke-opacity="0.028"/></pattern>
  </defs>
  <rect width="1200" height="360" rx="18" fill="url(#bg)"/>
  <ellipse cx="790" cy="80" rx="400" ry="195" fill="url(#violet-halo)"/>
  <ellipse cx="1090" cy="265" rx="270" ry="190" fill="url(#cyan-halo)"/>
  <ellipse cx="360" cy="330" rx="470" ry="150" fill="url(#pink-halo)"/>
  <rect width="1200" height="360" rx="18" fill="url(#grid)"/>
  ${stars}
  ${constellation(phase)}
  <circle cx="950" cy="170" r="167" stroke="url(#neon)" stroke-opacity="0.25" stroke-dasharray="2 13" fill="none"/>
  ${orbitNetwork(phase)}
  <circle cx="950" cy="170" r="50" fill="#100e25" stroke="url(#neon)" stroke-opacity="0.8"/>
  <circle cx="950" cy="170" r="58" fill="none" stroke="${pink}" stroke-opacity="${0.25 + 0.07 * Math.sin(phase)}"/>
  <path d="M950 140 L974 151 V170 Q974 187 950 200 Q926 187 926 170 V151Z" fill="${cyan}" fill-opacity="0.07" stroke="url(#neon)" stroke-width="2"/>
  <path d="M939 169 L947 177 L962 160" fill="none" stroke="#c0faff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <g font-family="Consolas, Liberation Mono, monospace">
    <path d="M54 42H82" stroke="${cyan}" stroke-width="3"/>
    <text x="96" y="48" fill="#98eaff" font-size="17">Krico / Kirito14IT</text>
    <text x="50.7" y="144" fill="${cyan}" opacity="0.25" font-size="64" font-weight="700" letter-spacing="-3">Hi, I'm Krico</text>
    <text x="53.3" y="144" fill="${pink}" opacity="0.25" font-size="64" font-weight="700" letter-spacing="-3">Hi, I'm Krico</text>
    <text x="52" y="144" fill="#f4f1ff" font-size="64" font-weight="700" letter-spacing="-3">Hi, I'm Krico</text>
    <text x="56" y="188" fill="#b6bbda" font-size="20">AI Safety / LLM Agents / Software Security</text>
    <rect x="56" y="224" width="235" height="32" rx="16" fill="#a879ff" fill-opacity="0.11" stroke="url(#neon)" stroke-opacity="0.65"/>
    <circle cx="73" cy="240" r="3" fill="${cyan}"/>
    <text x="85" y="245" fill="#d6caff" font-size="14">Fudan University / 2027</text>
    <path d="M56 278H370" stroke="${pink}" stroke-opacity="0.32"/>
  </g>
  <g transform="rotate(${(3 * Math.sin(phase)).toFixed(2)} 562 118)">
    <image href="${emoji.handshake}" x="522" y="78" width="80" height="80"/>
  </g>
  <image href="${emoji.sparkle}" x="617" y="${84 + 3 * Math.sin(phase)}" width="34" height="34" opacity="${0.8 + 0.2 * Math.cos(phase)}"/>
  <image href="${emoji.planet}" x="302" y="${23 + 2 * Math.sin(phase)}" width="30" height="30"/>
  ${waves(phase, 304, 12, 5)}
  <rect width="1200" height="360" rx="18" fill="url(#scan)"/>
  </svg>`;
}

function footer(phase) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="68" viewBox="0 0 1200 68">
  <defs>
    ${signalGradients()}
    <linearGradient id="footer-bg"><stop stop-color="#070e1c"/><stop offset="0.5" stop-color="#170d25"/><stop offset="1" stop-color="#071a24"/></linearGradient>
  </defs>
  <rect width="1200" height="68" rx="12" fill="url(#footer-bg)"/>
  ${waves(phase, 20, 6, 5)}
  </svg>`;
}

async function main() {
  await fs.mkdir(assets, { recursive: true });
  for (const kind of ['header', 'footer']) {
    await fs.mkdir(path.join(output, kind), { recursive: true });
  }
  await fs.writeFile(path.join(assets, 'research-greeting-neon.svg'), header(0));
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
