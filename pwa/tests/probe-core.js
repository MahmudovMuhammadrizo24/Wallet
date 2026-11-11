(() => {
  const parse = s => { const m = s.match(/[\d.]+/g).map(Number); return { r: m[0], g: m[1], b: m[2], a: m.length > 3 ? m[3] : 1 }; };
  const lum = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c.r) + .7152 * f(c.g) + .0722 * f(c.b); };
  const bgOf = el => { for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c.a > .9) return c; } return parse(getComputedStyle(document.body).backgroundColor); };
  let measured = 0; const failures = [];
  for (const el of document.querySelectorAll('body *')) {
    if (!el.childNodes.length || ![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
    const cs = getComputedStyle(el), r = el.getBoundingClientRect();
    if (cs.visibility === 'hidden' || cs.display === 'none' || !r.width || !r.height || el.closest('[hidden]')) continue;
    const fg = parse(cs.color), bg = bgOf(el), l1 = lum(fg), l2 = lum(bg), ratio = (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05);
    measured++; const big = parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.66 && +cs.fontWeight >= 700);
    if (ratio < (big ? 3 : 4.5)) failures.push({ text: el.textContent.trim().slice(0, 30), ratio: +ratio.toFixed(2) });
  }
  const tooSmall = [...document.querySelectorAll('button,a,input,select,summary,[role=button]')].filter(e => { const r = e.getBoundingClientRect(); return r.width && r.height && !e.closest('[hidden]') && (r.width < 24 || r.height < 24); }).map(e => e.id || e.className || e.tagName);
  return JSON.stringify({ contrast: { measured, failures }, tapTargets: { tooSmall }, layout: { horizontalOverflow: document.documentElement.scrollWidth > innerWidth ? document.documentElement.scrollWidth : null } });
})()
