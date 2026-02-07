let _win1251CharToByte = null;

function getWin1251CharToByte() {
  if (_win1251CharToByte) return _win1251CharToByte;

  try {
    const dec1251 = new TextDecoder("windows-1251");
    const bytes = new Uint8Array(256);
    for (let i = 0; i < 256; i++) bytes[i] = i;
    const chars = dec1251.decode(bytes);
    const map = new Map();
    for (let i = 0; i < chars.length; i++) map.set(chars[i], i);
    _win1251CharToByte = map;
    return map;
  } catch {
    _win1251CharToByte = null;
    return null;
  }
}

const MOJIBAKE_MARKERS_RE =
  /(вЂ|рџ|[ЉЊЋЌЏђѓєѕїјљњћќџЂ]|[‘’“”•–—…™€‹›¤])/;

function isLikelyMojibake(s) {
  const str = String(s || "");
  if (!str) return false;
  if (MOJIBAKE_MARKERS_RE.test(str)) return true;

  const rs = (str.match(/[РС]/g) || []).length;
  if (rs >= 4 && rs / Math.max(1, str.length) > 0.15) return true;
  if (rs >= 3 && str.includes("Р") && str.includes("С")) return true;

  return false;
}

function countMarkers(s) {
  const str = String(s || "");
  const m = str.match(/вЂ|рџ|[ЉЊЋЌЏђѓєѕїјљњћќџЂ]|[‘’“”•–—…™€‹›¤]/g);
  return m ? m.length : 0;
}

export function fixMojibake(input) {
  const s = String(input ?? "");
  if (!isLikelyMojibake(s)) return s;

  const map = getWin1251CharToByte();
  if (!map) return s;

  const bytes = [];
  for (const ch of s) {
    const b = map.get(ch);
    if (b == null) return s;
    bytes.push(b);
  }

  let fixed = "";
  try {
    fixed = new TextDecoder("utf-8").decode(Uint8Array.from(bytes));
  } catch {
    return s;
  }

  if (!fixed || fixed === s) return s;
  if (fixed.includes("\uFFFD")) return s;
  if (countMarkers(fixed) >= countMarkers(s)) return s;

  return fixed;
}

function shouldSkipTextNode(node) {
  const p = node?.parentNode;
  if (!p || p.nodeType !== 1) return false;
  const tag = String(p.tagName || "").toUpperCase();
  return tag === "SCRIPT" || tag === "STYLE" || tag === "TEXTAREA";
}

function repairTextNode(node) {
  if (!node || node.nodeType !== 3) return;
  if (shouldSkipTextNode(node)) return;
  const before = node.nodeValue;
  const after = fixMojibake(before);
  if (after !== before) node.nodeValue = after;
}

function repairSubtreeText(root) {
  if (!root) return;

  try {
    document.title = fixMojibake(document.title);
  } catch {
    // ignore
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n = walker.nextNode();
  while (n) {
    repairTextNode(n);
    n = walker.nextNode();
  }
}

export function installMojibakeRepairer(root = document.body) {
  if (!root) return null;

  repairSubtreeText(root);

  const obs = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === "characterData") {
        repairTextNode(m.target);
        continue;
      }

      if (m.type === "childList") {
        for (const node of m.addedNodes) {
          if (!node) continue;
          if (node.nodeType === 3) {
            repairTextNode(node);
            continue;
          }
          if (node.nodeType === 1) repairSubtreeText(node);
        }
      }
    }
  });

  try {
    obs.observe(root, { subtree: true, childList: true, characterData: true });
  } catch {
    // ignore
  }

  return obs;
}
