#!/usr/bin/env python3
"""keys.json (o'zbekcha manba matnlar) + cN.py (tarjimalar, bir xil tartibda) + extra*.json -> dict.json {til: {kalit: tarjima}}"""
import json, sys, os, glob, importlib.util
here = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, here)
keys = json.load(open(os.path.join(here, 'keys.json'), encoding='utf-8'))
LANGS = ['en', 'ru', 'tr', 'ar', 'zh']
tr = {l: [] for l in LANGS}
for n in range(0, 9):
    p = os.path.join(here, f'c{n}.py')
    if not os.path.exists(p): continue
    m = importlib.import_module(f'c{n}'); d = getattr(m, f'C{n}')
    for l in LANGS: tr[l] += d[l]
for l in LANGS: assert len(tr[l]) == len(keys), (l, len(tr[l]), len(keys))
out = {l: {} for l in LANGS}
for i, k in enumerate(keys):
    for l in LANGS: out[l][k] = tr[l][i]
# qo'shimcha (kalit -> {til: tarjima}) fayllari
for p in sorted(glob.glob(os.path.join(here, 'extra*.json'))):
    for k, v in json.load(open(p, encoding='utf-8')).items():
        for l in LANGS: out[l][k] = v[l]
json.dump(out, open(os.path.join(here, 'dict.json'), 'w', encoding='utf-8'), ensure_ascii=False)
print('dict.json:', {l: len(v) for l, v in out.items()})
