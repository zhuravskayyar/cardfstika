#!/usr/bin/env python3
import json
from pathlib import Path
p=Path('data/cards.json')
if not p.exists():
    print('cards.json not found')
    raise SystemExit(1)
js=json.load(p.open(encoding='utf-8'))
cards=js.get('cards',[])
missing=[]
for idx,c in enumerate(cards):
    title=c.get('title')
    art=c.get('artFile')
    if title is None or (isinstance(title,str) and title.strip()==""):
        missing.append({'idx':idx,'id':c.get('id'),'artFile':art,'raw':c})
print(f'Total cards: {len(cards)}')
print(f'Cards with missing/empty title: {len(missing)}')
if missing:
    for m in missing[:200]:
        print(m['idx'], m['id'], m['artFile'])
    if len(missing)>200:
        print('... (truncated)')
