const { chromium } = require('playwright');
const out = process.argv[2];
const logo = (bg, scale) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">${bg ? '<rect width="120" height="120" fill="#0b63b8"/>' : ''}<g transform="translate(60 60) scale(${scale}) translate(-60 -60)">${bg ? '' : '<rect x="4" y="4" width="112" height="112" rx="28" fill="#0b63b8"/>'}<path d="M30 44 L74 28 a7 7 0 0 1 9.5 6.5 V44" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><rect x="26" y="42" width="68" height="46" rx="12" fill="#fff"/><circle cx="78" cy="65" r="9" fill="#ffc72c"/><circle cx="78" cy="65" r="3" fill="#0a3f7a"/></g></svg>`;
(async () => {
  const b = await chromium.launch(); 
  const jobs = [['icon-192.png', 192, false, 1], ['icon-512.png', 512, false, 1], ['icon-maskable-512.png', 512, true, 0.78], ['apple-touch-icon.png', 180, true, 0.92]];
  for (const [name, size, full, sc] of jobs) {
    const p = await b.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    await p.setContent(`<body style="margin:0;background:${full ? '#0b63b8' : 'transparent'}">${logo(full, sc)}</body>`);
    await p.screenshot({ path: out + '/' + name, omitBackground: !full });
    await p.close();
  }
  await b.close();
})();
