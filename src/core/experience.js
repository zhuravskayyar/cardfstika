// src/core/experience.js - Player experience/levels (prototype)

export const PLAYER_MAX_LEVEL = 120;

// XP needed to reach each level (from previous level).
// Level 1 is the start level (0 XP into level).
// Table source: user spec (K/M/G units).
const XP_REQ = Array.from({ length: PLAYER_MAX_LEVEL + 1 }, () => null);

XP_REQ[2] = 240;
XP_REQ[3] = 500;
XP_REQ[4] = 1000;
XP_REQ[5] = 2000;
XP_REQ[6] = 13000;
XP_REQ[7] = 31000;
XP_REQ[8] = 49500;
XP_REQ[9] = 72500;
XP_REQ[10] = 99000;
XP_REQ[11] = 140000;
XP_REQ[12] = 175000;
XP_REQ[13] = 220000;
XP_REQ[14] = 270000;
XP_REQ[15] = 330000;
XP_REQ[16] = 400000;
XP_REQ[17] = 475000;
XP_REQ[18] = 545000;
XP_REQ[19] = 620000;
XP_REQ[20] = 700000;
XP_REQ[21] = 780000;
XP_REQ[22] = 870000;
XP_REQ[23] = 970000;
XP_REQ[24] = 1070000;
XP_REQ[25] = 1170000;
XP_REQ[26] = 1280000;
XP_REQ[27] = 1420000;
XP_REQ[28] = 1550000;
XP_REQ[29] = 1700000;
XP_REQ[30] = 1850000;
XP_REQ[31] = 2010000;
XP_REQ[32] = 2170000;
XP_REQ[33] = 2330000;
XP_REQ[34] = 2500000;
XP_REQ[35] = 2680000;
XP_REQ[36] = 2880000;
XP_REQ[37] = 3060000;
XP_REQ[38] = 3240000;
XP_REQ[39] = 3440000;
XP_REQ[40] = 3620000;
XP_REQ[41] = 3820000;
XP_REQ[42] = 4020000;
XP_REQ[43] = 4240000;
XP_REQ[44] = 4440000;
XP_REQ[45] = 4680000;
XP_REQ[46] = 4920000;
XP_REQ[47] = 5180000;
XP_REQ[48] = 5420000;
XP_REQ[49] = 5680000;
XP_REQ[50] = 5960000;
XP_REQ[51] = 11630000;
XP_REQ[52] = 12910000;
XP_REQ[53] = 14310000;
XP_REQ[54] = 15760000;
XP_REQ[55] = 17260000;
XP_REQ[56] = 18810000;
XP_REQ[57] = 20410000;
XP_REQ[58] = 22050000;
XP_REQ[59] = 23750000;
XP_REQ[60] = 25500000;
XP_REQ[61] = 45000000;
XP_REQ[62] = 48900000;
XP_REQ[63] = 53000000;
XP_REQ[64] = 57200000;
XP_REQ[65] = 61500000;
XP_REQ[66] = 66000000;
XP_REQ[67] = 70500000;
XP_REQ[68] = 75000000;
XP_REQ[69] = 80000000;
XP_REQ[70] = 85000000;
XP_REQ[71] = 100000000;
XP_REQ[72] = 120000000;
XP_REQ[73] = 140000000;
XP_REQ[74] = 160000000;
XP_REQ[75] = 180000000;
XP_REQ[76] = 200000000;
XP_REQ[77] = 220000000;
XP_REQ[78] = 240000000;
XP_REQ[79] = 260000000;
XP_REQ[80] = 280000000;
XP_REQ[81] = 1000000000;
XP_REQ[82] = 1000000000;
XP_REQ[83] = 1000000000;
XP_REQ[84] = 1000000000;
XP_REQ[85] = 1000000000;
XP_REQ[86] = 1000000000;
XP_REQ[87] = 1000000000;
XP_REQ[88] = 1000000000;
XP_REQ[89] = 1000000000;
XP_REQ[90] = 1000000000;
XP_REQ[91] = 2000000000;
XP_REQ[92] = 2000000000;
XP_REQ[93] = 2000000000;
XP_REQ[94] = 2000000000;
XP_REQ[95] = 2000000000;
XP_REQ[96] = 2000000000;
XP_REQ[97] = 2000000000;
XP_REQ[98] = 2000000000;
XP_REQ[99] = 2000000000;
XP_REQ[100] = 2000000000;
XP_REQ[101] = 3000000000;
XP_REQ[102] = 3000000000;
XP_REQ[103] = 3000000000;
XP_REQ[104] = 3000000000;
XP_REQ[105] = 3000000000;
XP_REQ[106] = 3000000000;
XP_REQ[107] = 3000000000;
XP_REQ[108] = 3000000000;
XP_REQ[109] = 3000000000;
XP_REQ[110] = 3000000000;
XP_REQ[111] = 4000000000;
XP_REQ[112] = 4000000000;
XP_REQ[113] = 4000000000;
XP_REQ[114] = 4000000000;
XP_REQ[115] = 4000000000;
XP_REQ[116] = 4000000000;
XP_REQ[117] = 4000000000;
XP_REQ[118] = 4000000000;
XP_REQ[119] = 4000000000;
XP_REQ[120] = 4000000000;

export const XP_REQUIREMENTS_BY_LEVEL = XP_REQ;

export const MEDAL_LEVELS = [80, 85, 90, 95, 100, 105, 110, 115, 120];

function asNonNegInt(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

export function getLevelProgressFromTotalXp(totalXp) {
  const total = asNonNegInt(totalXp);

  let level = 1;
  let into = total;

  for (let next = 2; next <= PLAYER_MAX_LEVEL; next++) {
    const req = XP_REQUIREMENTS_BY_LEVEL[next];
    if (!Number.isFinite(req) || req <= 0) break;
    if (into < req) break;
    into -= req;
    level = next;
  }

  const nextReq = level < PLAYER_MAX_LEVEL ? XP_REQUIREMENTS_BY_LEVEL[level + 1] : null;
  const pct = nextReq ? Math.round((into / Math.max(1, nextReq)) * 100) : 100;

  return {
    level,
    xpIntoLevel: into,
    xpForNextLevel: nextReq,
    progressPercent: pct,
  };
}

export function computeLevelUps(oldTotalXp, newTotalXp) {
  const before = getLevelProgressFromTotalXp(oldTotalXp).level;
  const after = getLevelProgressFromTotalXp(newTotalXp).level;
  const levels = [];
  for (let l = before + 1; l <= after; l++) levels.push(l);
  return { before, after, levels };
}

