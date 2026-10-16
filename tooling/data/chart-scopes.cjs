/** Scope-specific chart extraction shared by the Python map/chart pipeline. */
const fs=require('node:fs');
function buildChartScopes({mods,translations,previous={},affixes={}}) {
const existing=affixes;
const SKIP_STATS = new Set([
  'local_deepwater_mod_applies_to_adjacent_charts',
  'local_deepwater_mod_applies_globally',
]);

function isDisplayStat(id) {
  return id.includes('_display_stat') || id.endsWith('_hard_mode');
}

function primaryStats(stats) {
  return stats.filter((s) => !SKIP_STATS.has(s.id) && !isDisplayStat(s.id));
}

function formatValue(stats) {
  return primaryStats(stats)
    .map((s) => (s.min === s.max ? String(s.min) : `${s.min}-${s.max}`))
    .join('|');
}

function scoreTranslation(e, meaningful, scope) {
  const eids = e.ids || [];
  let score = 0;
  const overlap = meaningful.filter((id) => eids.includes(id)).length;
  if (!overlap) return -1;
  score += overlap * 20;
  const em = eids.filter((id) => !SKIP_STATS.has(id) && !isDisplayStat(id));
  score -= Math.abs(em.length - meaningful.length) * 3;
  const ja = e.ja || '';
  const en = e.en || '';
  if (scope === 'voyage') {
    if (/全ての航海|all Voyage/i.test(ja + en)) score += 15;
    if (/隣接|adjacent/i.test(ja + en) && !/全ての航海|all Voyage/i.test(ja + en)) score -= 10;
    if (e._src === 'deepwater_implicit_stat_descriptions.json') score += 5;
  } else {
    if (/隣接|adjacent/i.test(ja + en)) score += 15;
    if (/全ての航海|all Voyage/i.test(ja + en)) score -= 8;
    if ((e._src || '').includes('deepwater')) score += 3;
  }
  return score;
}

function findTranslation(statIds, scope) {
  const meaningful = primaryStats(statIds.map((id) => ({ id }))).map((s) => s.id);
  let best = null;
  for (const e of translations) {
    const score = scoreTranslation(e, meaningful, scope);
    if (score < 0) continue;
    if (!best || score > best.score) best = { e, score };
  }
  return best?.e || null;
}

function normalizeText(ja, en, scope, primaryIds) {
  let j = ja || '';
  let e = en || '';

  if (scope === 'adjacent') {
    if (primaryIds.includes('map_number_of_magic_packs_+%')) {
      j = '隣接エリアのマジックモンスターの数が#%増加する';
      e = '#% increased Magic Monsters in adjacent Areas';
    } else if (primaryIds.includes('map_number_of_rare_packs_+%')) {
      j = '隣接エリアのレアモンスターの数が#%増加する';
      e = '#% increased number of Rare Monsters in adjacent Areas';
    } else if (primaryIds.includes('map_monsters_can_be_empowered_by_x_wildwood_wisps')) {
      j = '隣接エリアのモンスターは一定確率で#体の原生林のウィスプにより強化されている';
      e = 'Monsters in adjacent Areas have a chance to be Empowered by # Wildwood Wisps';
    } else if (primaryIds.includes('map_items_drop_corrupted')) {
      j = '隣接エリアにアッツィリインフルエンス';
      e = "Atziri's Influence in adjacent Areas";
    }
  }

  if (scope === 'voyage') {
    const voyageOverrides = {
      'map_pack_size_+%': [
        '全ての航海エリアのパックサイズが#%増加する',
        '#% increased Pack Size in all Voyage Areas',
      ],
      'map_item_drop_quantity_+%': [
        '全ての航海エリアで見つかるアイテムの数量が#%増加する',
        '#% increased Quantity of Items found in all Voyage Areas',
      ],
      'map_item_drop_rarity_+%': [
        '全ての航海エリアで見つかるアイテムのレアリティが#%増加する',
        '#% increased Rarity of Items found in all Voyage Areas',
      ],
      'map_deepwater_league_resource_found_+%': [
        '全ての航海エリアで見つかる死人の硫黄が#%増加する',
        "#% increased Dead Man's Sulphur found in all Voyage Areas",
      ],
      'map_number_of_rare_packs_+%': [
        '全ての航海エリアのレアモンスターの数が#%増加する',
        '#% increased number of Rare Monsters in all Voyage Areas',
      ],
      'map_all_monster_packs_magic_and_allow_rare_chance_%': [
        '全ての航海エリアでは全てのモンスターが最低でもマジックになる',
        'Monsters in all Voyage Areas are at least Magic',
      ],
    };
    for (const [id, [jj, ee]] of Object.entries(voyageOverrides)) {
      if (primaryIds.includes(id)) {
        j = jj;
        e = ee;
        break;
      }
    }
    if (primaryIds.includes('chart_monsters_drop_no_equipment')) {
      j = '全ての航海エリアのモンスターは装備品、フラスコまたはチンキをドロップしなくなる';
      e = 'Monsters in all Voyage Areas cannot drop Equipment, Flasks or Tinctures';
    }
  }

  j = j
    .replace(/\{0\}/g, '#')
    .replace(/追加で1体出現する/g, '追加で#体出現する')
    .replace(/追加で1個出現する/g, '追加で#個出現する')
    .replace(/モッドを1個持つ/g, 'モッドを#個持つ')
    .replace(/ランタンが追加で1個/g, 'ランタンが追加で#個');
  e = e
    .replace(/\{0\}/g, '#')
    .replace(/an additional Imprisoned Monster/g, '# additional Imprisoned Monsters')
    .replace(/an additional Strongbox/g, '# additional Strongboxes')
    .replace(/an additional Message in a Bottle/g, '# additional Messages in a Bottle')
    .replace(/an additional cage of Tormented Spirits/g, '# additional cages of Tormented Spirits')
    .replace(/an additional Diviner's Strongbox/g, "# additional Diviner's Strongboxes")
    .replace(/an additional Arcanist's Strongbox/g, "# additional Arcanist's Strongboxes")
    .replace(/an additional Operative's Strongbox/g, "# additional Operative's Strongboxes")
    .replace(/an additional GoldenLanterns/g, '# additional Golden Lanterns')
    .replace(/a Pantheon Modifier/g, '# Pantheon Modifier');

  return { ja: j, en: e };
}

function applyRangePlaceholder(text, value) {
  if (!value) return text;
  if (value.split('|').some((v) => /^\d+-\d+$/.test(v))) {
    return text.replace(/#(?!%)/g, '(##)');
  }
  return text;
}

function spawnWeight(mod) {
  const w = (mod.spawn_weights || []).find((x) => x.tag === 'chart');
  return w ? w.weight : 0;
}

function bonusFields(stats) {
  const out = {
    'map_item_drop_quantity_+%': 0,
    'map_item_drop_rarity_+%': 0,
    'map_pack_size_+%': 0,
    'map_deepwater_league_resource_found_+%': 0,
  };
  for (const s of stats) {
    if (Object.prototype.hasOwnProperty.call(out, s.id)) out[s.id] = s.max;
  }
  return out;
}

const groups = new Map();
for (const [key, mod] of Object.entries(mods)) {
  if (mod.domain !== 'deepwater_chart') continue;
  if (mod.generation_type !== 'deepwater_chart') continue;

  const ids = (mod.stats || []).map((s) => s.id);
  const isVoyage = ids.includes('local_deepwater_mod_applies_globally');
  const isAdjacent = ids.includes('local_deepwater_mod_applies_to_adjacent_charts');
  if (!isVoyage && !isAdjacent) continue;

  const scope = isVoyage ? 'voyage' : 'adjacent';
  const groupKey = `${scope}::${mod.type || key.replace(/\d+$/, '')}`;
  const cur = groups.get(groupKey);
  const score = (mod.required_level || 0) * 1000 + spawnWeight(mod);
  if (!cur || score > cur.score) {
    groups.set(groupKey, { key, mod, scope, score, sourceIds:[...(cur?.sourceIds || []),key] });
  } else {
    cur.sourceIds.push(key);
  }
}

const usedJaRx = new Set();
const usedEnRx = new Set();
for (const v of Object.values(existing)) {
  if (v.Regex) usedJaRx.add(v.Regex);
  if (v.engRegex) usedEnRx.add(v.engRegex);
}

const implicitEntries = {};
const sortedGroups = [...groups.values()].sort((a, b) => {
  if (a.scope !== b.scope) return a.scope === 'adjacent' ? -1 : 1;
  return a.key.localeCompare(b.key);
});

for (const { key, mod, scope, sourceIds } of sortedGroups) {
  const stats = mod.stats || [];
  const primaryIds = primaryStats(stats).map((s) => s.id);
  const tr = findTranslation(
    stats.map((s) => s.id),
    scope,
  );
  let ja = tr?.ja || '';
  let en = tr?.en || '';
  if (!ja) {
    for (const id of primaryIds) {
      const hit = translations.find((e) => (e.ids || []).length === 1 && e.ids[0] === id && e.ja);
      if (hit) {
        ja = hit.ja;
        en = hit.en || en;
        break;
      }
    }
  }
  const norm = normalizeText(ja, en, scope, primaryIds);
  ja = norm.ja;
  en = norm.en;
  if (!ja) {
    throw new Error('海図の翻訳が見つかりません: '+key+' '+primaryIds.join(', '));
  }

  const value = formatValue(stats);
  const modJa = applyRangePlaceholder(ja, value);
  const modEn = applyRangePlaceholder(en, value);
  const prefix = scope === 'voyage' ? '(航海)' : '(隣接)';
  const engPrefix = scope === 'voyage' ? '(Voyage)' : '(Adjacent)';
  const displayJa = `${prefix} ${modJa}`;
  const displayEn = `${engPrefix} ${modEn}`;

  const matching=Object.values(previous).filter(entry=>(entry.sourceIds || []).some(id=>sourceIds.includes(id)));
  if(matching.length>1)throw new Error('海図の元Mod IDが重複しています: '+key);
  const prev=matching[0] || previous[displayJa];
  implicitEntries[displayJa] = {
    _rx_src: prev ? 'prev' : 'generated',
    mod: displayJa,
    engMod: displayEn,
    value: value || '',
    type: scope === 'voyage' ? 'Voyage' : 'Adjacent',
    weight: spawnWeight(mod),
    tier: mod.required_level || 0,
    engRegex: prev?.engRegex ?? '',
    Regex: prev?.Regex ?? '',
    tradeStatIds: prev?.tradeStatIds || [''],
    sourceIds:[...new Set(sourceIds)].sort(),
    adjacent: scope === 'adjacent',
    voyage: scope === 'voyage',
    nameJa: mod.name || '',
    nameEn: '',
    ...bonusFields(stats),
  };
}


return implicitEntries;
}
function literalRegex(text,used,english) {
  const escaped=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const words=text.replace(/\[(?:DNT)\]/g,'').match(english?/[A-Za-z']{3,}/g:/[一-龯ぁ-んァ-ヶー]{3,}/g) || [];
  for(const width of [4,5,6])for(const word of words)for(let i=0;i<=word.length-width;i++) {
    const pattern=escaped(word.slice(i,i+width));
    if(!used.has(pattern)){used.add(pattern);return pattern;}
  }
  if(!words.length)throw new Error('海図Regexの候補がありません: '+text);
  return escaped(words[0]);
}
module.exports={buildChartScopes,literalRegex};
if(require.main===module) {
  try {process.stdout.write(JSON.stringify(buildChartScopes(JSON.parse(fs.readFileSync(0,'utf8')))));}
  catch(error){console.error(error.message);process.exitCode=1;}
}
