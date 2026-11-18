/* Aktivlar endi tarmoq sahifalariga bo'lingan (#/net/ID). Eski testlar uchun yassi ro'yxat: har tarmoq -> {id, head, rows:[{name,text,id,act}]} */
exports.flat = async pg => {
  const hs = await pg.$$eval('#net-list a', e => e.map(a => a.getAttribute('href')));
  const out = [];
  for (const h of hs) {
    await pg.evaluate(h => { location.hash = h; }, h);
    await pg.waitForSelector('#pg-net:not([hidden]) #net-sum .a-n'); await pg.waitForTimeout(150);
    out.push(await pg.evaluate(h => ({
      id: h.split('/').pop(), head: document.querySelector('#net-sum .a-n').textContent,
      rows: [...document.querySelectorAll('#list li')].map(li => { const b = li.querySelector('.rowbtn'); return { name: li.querySelector('.a-n').innerText.replace(/\s+/g, ' '), text: li.innerText.replace(/\s+/g, ' '), id: b.dataset.id, act: b.dataset.act }; })
    }), h));
  }
  await pg.evaluate(() => { location.hash = '#/assets'; }); await pg.waitForSelector('#net-list li');
  return out;
};
exports.struct = async pg => (await exports.flat(pg)).flatMap(g => ['## ' + g.head, ...g.rows.map(r => '   ' + r.name)]);

exports.goNet = async (pg, id) => { await pg.evaluate(id => { location.hash = '#/net/' + id; }, id); await pg.waitForSelector('#pg-net:not([hidden]) #net-sum .a-n'); await pg.waitForTimeout(150); };
exports.coins = async (pg, id) => { await exports.goNet(pg, id); return pg.$$eval('#list .rowbtn', b => b.map(x => data.items.find(i => i.id === x.dataset.id).coin)); };
exports.pickers = async pg => { const nets = await pg.$$eval('#net-list a', e => e.map(a => a.getAttribute('href').split('/').pop())); const o = {}; for (const n of nets) { await exports.goNet(pg, n); if (await pg.$eval('#net-add', e => e.hidden)) continue; await pg.click('#net-add'); await pg.waitForSelector('#tk-sheet'); o[n] = await pg.$$eval('#sh-l button[data-k]', e => e.map(b => b.dataset.k)); await pg.keyboard.press('Escape'); await pg.waitForSelector('#tk-sheet', { state: 'detached' }); } return o; };
exports.pick = async (pg, n, k) => { await exports.goNet(pg, n); await pg.click('#net-add'); await pg.waitForSelector('#tk-sheet'); await pg.click('#sh-l button[data-k=' + k + ']'); await pg.waitForSelector('#tk-sheet', { state: 'detached' }); };
