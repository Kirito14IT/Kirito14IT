const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
// Google Scholar geometry is from Simple Icons, licensed under CC0 1.0.
const scholarPath = 'M5.242 13.769L0 9.5 12 0l12 9.5-5.242 4.269C17.548 11.249 14.978 9.5 12 9.5c-2.977 0-5.548 1.748-6.758 4.269zM12 10a7 7 0 1 0 0 14 7 7 0 0 0 0-14z';
const globe = `<circle cx="12" cy="12" r="9.2"/>
  <ellipse cx="12" cy="12" rx="4.2" ry="9.2"/>
  <path d="M3 12H21M4.6 6.9Q12 10 19.4 6.9M4.6 17.1Q12 14 19.4 17.1"/>`;
const envelope = `<rect x="2" y="4.5" width="20" height="15" rx="3"/>
  <path d="M3 6L12 12.8L21 6M3 18L8.5 12.2M21 18L15.5 12.2"/>`;
const badges = [
  { file: 'academic-homepage', label: 'Academic Homepage', width: 260,
    colors: ['#087e9b', '#2262dc'], icon: globe },
  { file: 'google-scholar', label: 'Google Scholar', width: 232,
    colors: ['#7032d9', '#b02c99'], icon: `<path d="${scholarPath}" fill="white" stroke="none"/>` },
  { file: 'email', label: 'Email', width: 156,
    colors: ['#ce286f', '#bd481d'], icon: envelope },
];

function render({ label, width, colors, icon }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="44" viewBox="0 0 ${width} 44" role="img" aria-label="${label}">
  <title>${label}</title>
  <defs>
    <linearGradient id="face" x1="0" y1="0" x2="1" y2="0.9"><stop stop-color="${colors[0]}"/><stop offset="1" stop-color="${colors[1]}"/></linearGradient>
    <linearGradient id="shine" x1="0" y1="0" x2="0" y2="1"><stop stop-color="white" stop-opacity="0.2"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient>
    <linearGradient id="edge"><stop stop-color="#b1f6ff"/><stop offset="0.55" stop-color="#f5c5ff"/><stop offset="1" stop-color="#ffc7ba"/></linearGradient>
  </defs>
  <rect x="0.5" y="0.5" width="${width - 1}" height="43" rx="10" fill="url(#face)"/>
  <rect x="0.5" y="0.5" width="${width - 1}" height="22" rx="10" fill="url(#shine)"/>
  <rect x="1" y="1" width="${width - 2}" height="42" rx="9.5" fill="none" stroke="url(#edge)" stroke-opacity="0.7"/>
  <path d="M12 41H${width - 12}" stroke="white" stroke-opacity="0.13"/>
  <circle cx="25" cy="22" r="16" fill="white" fill-opacity="0.1"/>
  <g transform="translate(13 10)" fill="none" stroke="white" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round">${icon}</g>
  <text x="50" y="27.5" fill="white" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="650">${label}</text>
  <path d="M${width - 23} 25L${width - 16} 18M${width - 23} 18H${width - 16}V25" fill="none" stroke="white" stroke-width="1.6" stroke-opacity="0.75" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

async function main() {
  const assets = path.join(root, 'assets');
  const previews = path.join(root, 'output', 'profile');
  await fs.mkdir(assets, { recursive: true });
  await fs.mkdir(previews, { recursive: true });
  for (const badge of badges) {
    const svg = render(badge);
    const name = `${badge.file}-neon.svg`;
    await fs.writeFile(path.join(assets, name), svg);
    await sharp(Buffer.from(svg)).png().toFile(path.join(previews, `${badge.file}-neon.png`));
    console.log(`${name}: ${badge.width}x44`);
  }
  const composite = await Promise.all(badges.map(async (badge, i) => ({
    input: await sharp(Buffer.from(render(badge))).png().toBuffer(),
    left: 20 + badges.slice(0, i).reduce((sum, previous) => sum + previous.width + 12, 0),
    top: 20,
  })));
  await sharp({ create: { width: 712, height: 84, channels: 4, background: '#0d1117' } })
    .composite(composite).png().toFile(path.join(previews, 'contact-badges.png'));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
