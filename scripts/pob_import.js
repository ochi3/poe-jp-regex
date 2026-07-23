/**
 * Path of Building 共有コード / pobb.in URL のデコードとジェム抽出
 */

const POB_CLASS_TO_JP = {
  Witch: 'ウィッチ',
  Marauder: 'マローダー',
  Ranger: 'レンジャー',
  Duelist: 'デュエリスト',
  Shadow: 'シャドウ',
  Templar: 'テンプラー',
  Scion: 'サイオン',
};

const POB_FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/plain,text/html,*/*',
};

/** PoB 共有コードらしい文字列か */
function isPobShareCode(text) {
  const t = String(text || '').trim().replace(/\s+/g, '');
  return t.length >= 20 && /^eN[a-zA-Z0-9+/=_-]+$/.test(t);
}

/** pobb.in ページ HTML からビルドコードを抽出 */
function extractCodeFromPobbInHtml(html) {
  const source = String(html || '');
  const textareaMatch = source.match(
    /aria-label="Path of Building buildcode"[^>]*>\s*(eN[a-zA-Z0-9+/=_-]+)/,
  );
  if (textareaMatch) return textareaMatch[1].trim();

  const readonlyMatch = source.match(/readonly="">\s*(eN[a-zA-Z0-9+/=_-]+)/);
  if (readonlyMatch) return readonlyMatch[1].trim();

  return null;
}

/** jina.ai リーダー応答からビルドコードを抽出 */
function extractCodeFromJinaMarkdown(text) {
  const source = String(text || '');
  const mdMatch = source.match(/Markdown Content:\s*(eN[a-zA-Z0-9+/=_-]+)/);
  if (mdMatch) return mdMatch[1].trim();

  return extractLoosePobCode(source) || extractCodeFromPobbInHtml(source);
}

/** 応答テキストから最長の PoB コード候補を探す */
function extractLoosePobCode(text) {
  const matches = String(text || '').match(/eN[a-zA-Z0-9+/=_-]{20,}={0,2}/g);
  if (!matches?.length) return null;
  const longest = matches.reduce((best, current) => (
    current.length > best.length ? current : best
  ));
  return isPobShareCode(longest) ? longest.replace(/\s+/g, '') : null;
}

/** 取得テキストから PoB コードを取り出す */
function extractPobCodeFromFetchedText(text, sourceKind) {
  const trimmed = String(text || '').trim();
  if (!trimmed) return null;

  if (sourceKind === 'jina') {
    const fromJina = extractCodeFromJinaMarkdown(trimmed);
    if (fromJina) return fromJina.replace(/\s+/g, '');
  }

  if (isPobShareCode(trimmed)) return trimmed.replace(/\s+/g, '');

  const fromHtml = extractCodeFromPobbInHtml(trimmed);
  if (fromHtml) return fromHtml.replace(/\s+/g, '');

  const loose = extractLoosePobCode(trimmed);
  if (loose) return loose;

  return null;
}

async function fetchAlloriginsRaw(targetUrl, label) {
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
  const response = await fetch(proxyUrl);
  if (!response.ok) {
    throw new Error(`${label}: HTTP ${response.status}`);
  }
  const text = await response.text();
  const code = extractPobCodeFromFetchedText(text, 'raw');
  if (!code) {
    throw new Error(`${label}: PoB コードを抽出できませんでした`);
  }
  return code;
}

async function fetchAlloriginsGet(targetUrl, label) {
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
  const response = await fetch(proxyUrl);
  if (!response.ok) {
    throw new Error(`${label}: HTTP ${response.status}`);
  }
  const data = await response.json();
  const text = data?.contents || '';
  const code = extractPobCodeFromFetchedText(text, 'raw');
  if (!code) {
    throw new Error(`${label}: PoB コードを抽出できませんでした`);
  }
  return code;
}

async function fetchJinaProxy(targetUrl, label) {
  const proxyUrl = `https://r.jina.ai/${targetUrl}`;
  const response = await fetch(proxyUrl, { headers: POB_FETCH_HEADERS });
  if (!response.ok) {
    throw new Error(`${label}: HTTP ${response.status}`);
  }
  const text = await response.text();
  const code = extractPobCodeFromFetchedText(text, 'jina');
  if (!code) {
    throw new Error(`${label}: PoB コードを抽出できませんでした`);
  }
  return code;
}

/** 複数プロキシを並列試行し、最初に成功した時点で返す */
async function fetchPobCodeFromProxies(fetchers) {
  const errors = [];

  return new Promise((resolve, reject) => {
    if (!fetchers.length) {
      reject(new Error('取得経路がありません'));
      return;
    }

    let pending = fetchers.length;
    let settled = false;

    fetchers.forEach((fetcher) => {
      fetcher()
        .then((code) => {
          if (!settled && code) {
            settled = true;
            resolve(code);
          }
        })
        .catch((error) => {
          errors.push(error.message || String(error));
          pending -= 1;
          if (!settled && pending === 0) {
            reject(new Error(errors.join(' / ') || '取得に失敗しました'));
          }
        });
    });
  });
}

/** PoB 共有コードを XML 文字列にデコード */
function decodePobShareCode(code) {
  if (typeof pako === 'undefined') {
    throw new Error('pako が読み込まれていません');
  }

  let normalized = String(code || '').trim().replace(/\s+/g, '');
  if (!normalized) {
    throw new Error('PoB コードが空です');
  }

  normalized = normalized.replace(/-/g, '+').replace(/_/g, '/');
  while (normalized.length % 4 !== 0) {
    normalized += '=';
  }

  let binary;
  try {
    binary = atob(normalized);
  } catch {
    throw new Error('PoB コードの Base64 形式が不正です');
  }

  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  try {
    return pako.inflate(bytes, { to: 'string' });
  } catch {
    throw new Error('PoB コードの解凍に失敗しました');
  }
}

/** pobb.in URL または生コードを判別 */
function parsePobInput(input) {
  const text = String(input || '').trim().replace(/[.,;)\]}>]+$/g, '');
  if (!text) {
    return { type: 'empty' };
  }

  const userUrlMatch = text.match(/(pobb\.in\/u\/[^/\s?#]+?\/[A-Za-z0-9_-]{6,})/i);
  const directUrlMatch = text.match(/pobb\.in\/([A-Za-z0-9_-]{6,})/i);
  let id = null;
  let pagePath = null;

  if (userUrlMatch) {
    pagePath = userUrlMatch[1];
    const idMatch = pagePath.match(/\/([A-Za-z0-9_-]{6,})$/);
    id = idMatch ? idMatch[1] : null;
  } else if (directUrlMatch) {
    const candidate = directUrlMatch[1];
    if (!['raw', 'u', 'oembed'].includes(candidate.toLowerCase())) {
      id = candidate;
      pagePath = `pobb.in/${id}`;
    }
  }

  if (id && pagePath) {
    const normalizedPath = pagePath.replace(/\/raw\/?$/, '');
    return {
      type: 'url',
      id,
      pageUrl: `https://${normalizedPath}`,
      rawUrl: `https://${normalizedPath}/raw`,
    };
  }

  const compact = text.replace(/\s+/g, '');
  if (compact.length >= 20 && /^[A-Za-z0-9+/_=-]+$/.test(compact)) {
    return { type: 'code', code: compact };
  }

  return { type: 'unknown' };
}

/** pobb.in から生コードを取得（高速経路を優先） */
async function fetchPobbInRawCode(rawUrl, pageUrl) {
  const errors = [];
  const fastAttempts = [
    () => fetchAlloriginsRaw(rawUrl, 'allorigins /raw'),
    () => fetchAlloriginsGet(rawUrl, 'allorigins get /raw'),
  ];

  for (const attempt of fastAttempts) {
    try {
      return await attempt();
    } catch (error) {
      errors.push(error.message || String(error));
    }
  }

  try {
    return await fetchPobCodeFromProxies([
      () => fetchJinaProxy(rawUrl, 'jina.ai /raw'),
    ]);
  } catch (error) {
    errors.push(error.message || String(error));
  }

  throw new Error(
    `pobb.in からビルドを取得できませんでした（${errors.join(' / ')}）`,
  );
}

/** XML からビルド情報とジェム一覧を抽出 */
function parsePobBuildXml(xmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('PoB XML の解析に失敗しました');
  }

  const buildEl = doc.querySelector('Build');
  if (!buildEl) {
    throw new Error('PoB ビルドデータが見つかりません');
  }

  const className = buildEl.getAttribute('className') || '';
  const ascendClassName = buildEl.getAttribute('ascendClassName') || '';
  const level = buildEl.getAttribute('level') || '';
  const targetVersion = buildEl.getAttribute('targetVersion') || '';
  const classNameJp = POB_CLASS_TO_JP[className] || className;

  const skillsEl = doc.querySelector('Skills');
  const activeSkillSetId = skillsEl?.getAttribute('activeSkillSet') || '1';
  const skillSetElements = Array.from(doc.querySelectorAll('SkillSet'));

  const collectGemsFromSkillSetEl = (skillSetEl) => {
    const gems = [];
    const seen = new Set();
    const skillSetTitle = skillSetEl.getAttribute('title') || '';

    skillSetEl.querySelectorAll('Gem').forEach((gemEl) => {
      const enabled = gemEl.getAttribute('enabled') !== 'false';
      if (!enabled) return;

      const skillId = gemEl.getAttribute('skillId')
        || gemEl.getAttribute('variantId')
        || '';
      const nameSpec = gemEl.getAttribute('nameSpec') || '';
      const key = `${skillId}::${nameSpec}`;
      if (seen.has(key)) return;
      seen.add(key);

      gems.push({
        skillId,
        nameSpec,
        level: gemEl.getAttribute('level') || '1',
        quality: gemEl.getAttribute('quality') || '0',
        skillSetTitle,
      });
    });

    return gems;
  };

  const skillSets = skillSetElements.map((skillSetEl, index) => {
    const id = skillSetEl.getAttribute('id') || String(index + 1);
    const title = skillSetEl.getAttribute('title') || `ロードアウト ${id}`;
    return {
      id,
      title,
      gems: collectGemsFromSkillSetEl(skillSetEl),
    };
  });

  let gems = [];
  if (skillSets.length > 0) {
    const activeSet = skillSets.find((set) => set.id === activeSkillSetId) || skillSets[0];
    gems = activeSet.gems;
  } else {
    const seen = new Set();
    doc.querySelectorAll('Gem').forEach((gemEl) => {
      const enabled = gemEl.getAttribute('enabled') !== 'false';
      if (!enabled) return;
      const skillId = gemEl.getAttribute('skillId') || gemEl.getAttribute('variantId') || '';
      const nameSpec = gemEl.getAttribute('nameSpec') || '';
      const key = `${skillId}::${nameSpec}`;
      if (seen.has(key)) return;
      seen.add(key);
      gems.push({ skillId, nameSpec, level: '1', quality: '0', skillSetTitle: '' });
    });
  }

  return {
    className,
    ascendClassName,
    classNameJp,
    level,
    targetVersion,
    activeSkillSetId,
    skillSets,
    gems,
  };
}

/** 指定ロードアウトのジェム一覧を返す */
function getBuildGemsForSkillSet(build, skillSetId) {
  return getBuildGemsForSkillSets(build, [skillSetId]);
}

/** 複数ロードアウトのジェムを重複除いて結合 */
function getBuildGemsForSkillSets(build, skillSetIds) {
  if (!build) return [];

  const ids = (Array.isArray(skillSetIds) ? skillSetIds : [skillSetIds])
    .filter((id) => id != null && id !== '');

  if (!build.skillSets?.length) {
    return build.gems || [];
  }

  if (ids.length === 0) {
    const active = build.skillSets.find((set) => set.id === build.activeSkillSetId);
    return active?.gems || build.skillSets[0].gems;
  }

  const seen = new Set();
  const gems = [];

  ids.forEach((id) => {
    const set = build.skillSets.find((item) => item.id === id);
    if (!set) return;
    set.gems.forEach((gem) => {
      const key = `${gem.skillId}::${gem.nameSpec}`;
      if (seen.has(key)) return;
      seen.add(key);
      gems.push(gem);
    });
  });

  return gems;
}

function normalizeGemName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

/** gems_regex.json のエントリと PoB ジェムを照合 */
function matchPobGemToLocal(pobGem, gemData) {
  if (!pobGem || !gemData?.length) return null;

  const skillId = pobGem.skillId || '';
  const nameSpec = pobGem.nameSpec || '';
  const normName = normalizeGemName(nameSpec);

  if (skillId) {
    const byId = gemData.find((g) => g.id === skillId);
    if (byId) return byId;
  }

  if (nameSpec) {
    const byEng = gemData.find((g) => g.eng && g.eng.toLowerCase() === nameSpec.toLowerCase());
    if (byEng) return byEng;

    const byNorm = gemData.find((g) => normalizeGemName(g.eng) === normName);
    if (byNorm) return byNorm;
  }

  if (normName) {
    const partial = gemData.find((g) => {
      const engNorm = normalizeGemName(g.eng);
      return engNorm && (engNorm.includes(normName) || normName.includes(engNorm));
    });
    if (partial) return partial;
  }

  return null;
}

/** クエスト報酬の一意キー */
function getQuestRewardKey(act, quest) {
  return `${act}::${quest || ''}`;
}

/** 同じクエストに複数の選択枠がある場合の一意キー */
function getQuestRewardChoiceKey(act, quest, choiceType = 'main') {
  return `${getQuestRewardKey(act, quest)}::${choiceType}`;
}

const BREAKING_EGGS_BONUS_GEMS = new Set([
  'Dash',
  'Frostblink',
  'Shield Charge',
]);

const CAGED_BRUTE_BONUS_GEMS = new Set([
  'Clarity',
  'Faster Attacks Support',
  'Melee Splash Support',
  'Precision',
  'Vitality',
]);

/** クエストごとの追加報酬定義 */
const QUEST_BONUS_REWARD_DEFS = {
  '卵の破壊': {
    engNames: BREAKING_EGGS_BONUS_GEMS,
    sharedAllClasses: false,
  },
  '檻の中のけだもの': {
    engNames: CAGED_BRUTE_BONUS_GEMS,
    sharedAllClasses: true,
  },
};

function toQuestMemoGem(gem, act, quest) {
  return {
    regex: gem.regex,
    display_name: gem.display_name,
    eng: gem.eng,
    quest,
    classes: gem.quest_reward?.classes || [],
    act,
  };
}

/** 追加報酬ジェム一覧を取得 */
function getQuestBonusGems(gemData, quest, act, classGems, engNames, sharedAllClasses) {
  if (sharedAllClasses) {
    return gemData
      .filter((gem) => engNames.has(gem.eng))
      .map((gem) => toQuestMemoGem(gem, act, quest))
      .sort((a, b) => a.display_name.localeCompare(b.display_name, 'ja'));
  }
  return classGems.filter((gem) => engNames.has(gem.eng));
}

/** クラス向けクエスト報酬を ACT → クエスト単位に整理 */
function buildQuestRewardMemo(gemData, classNameJp) {
  const byAct = new Map();

  gemData.forEach((gem) => {
    const reward = gem.quest_reward;
    if (!reward || !reward.classes || !reward.act) return;
    if (classNameJp && !reward.classes.includes(classNameJp)) return;

    const act = reward.act;
    const quest = reward.quest || '';
    if (!byAct.has(act)) {
      byAct.set(act, new Map());
    }
    const byQuest = byAct.get(act);
    if (!byQuest.has(quest)) {
      byQuest.set(quest, []);
    }
    byQuest.get(quest).push(toQuestMemoGem(gem, act, quest));
  });

  // 全クラス共有の追加報酬クエストが、クラス報酬一覧に無い場合も枠を用意する
  Object.entries(QUEST_BONUS_REWARD_DEFS).forEach(([quest, def]) => {
    if (!def.sharedAllClasses) return;
    const sample = gemData.find((gem) => def.engNames.has(gem.eng) && gem.quest_reward?.quest === quest);
    const act = sample?.quest_reward?.act;
    if (!act) return;
    if (!byAct.has(act)) byAct.set(act, new Map());
    const byQuest = byAct.get(act);
    if (!byQuest.has(quest)) byQuest.set(quest, []);
  });

  return Array.from(byAct.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([act, questMap]) => ({
      act,
      quests: Array.from(questMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0], 'ja'))
        .map(([quest, gems]) => {
          const sortedGems = gems.sort((a, b) => a.display_name.localeCompare(b.display_name, 'ja'));
          const bonusDef = QUEST_BONUS_REWARD_DEFS[quest];
          if (!bonusDef) {
            return { quest, gems: sortedGems, bonusGems: [] };
          }

          const bonusGems = getQuestBonusGems(
            gemData,
            quest,
            act,
            sortedGems,
            bonusDef.engNames,
            bonusDef.sharedAllClasses,
          );
          const mainGems = sortedGems.filter((gem) => !bonusDef.engNames.has(gem.eng));
          return {
            quest,
            gems: mainGems,
            bonusGems,
          };
        }),
    }));
}

/** 同一クエストの各選択枠を初期化（ビルド内を優先） */
function initQuestRewardChoices(questMemo, importedRegexes) {
  const choices = {};

  questMemo.forEach(({ act, quests }) => {
    quests.forEach(({ quest, gems, bonusGems = [] }) => {
      const mainKey = getQuestRewardChoiceKey(act, quest, 'main');
      const mainInBuild = gems.filter((g) => importedRegexes.has(g.regex));
      if (mainInBuild.length > 0) {
        choices[mainKey] = mainInBuild[0].regex;
      } else if (gems.length > 0) {
        choices[mainKey] = gems[0].regex;
      }

      if (bonusGems.length > 0) {
        const bonusKey = getQuestRewardChoiceKey(act, quest, 'bonus');
        const bonusInBuild = bonusGems.filter((g) => importedRegexes.has(g.regex));
        const mainRegex = choices[mainKey];
        const distinctBonus = bonusInBuild.find((g) => g.regex !== mainRegex)
          || bonusGems.find((g) => g.regex !== mainRegex);
        choices[bonusKey] = (distinctBonus || bonusInBuild[0] || bonusGems[0]).regex;
      }
    });
  });

  return choices;
}

function isQuestRewardForClass(gemEntry, classNameJp) {
  const reward = gemEntry?.quest_reward;
  if (!reward || !classNameJp) return false;
  if (Array.isArray(reward.classes) && reward.classes.includes(classNameJp)) return true;

  // 檻の中のけだもの追加報酬は全クラス共有
  if (
    reward.quest === '檻の中のけだもの'
    && CAGED_BRUTE_BONUS_GEMS.has(gemEntry.eng)
  ) {
    return true;
  }

  return false;
}

/** 入力から PoB ビルドを取得して解析 */
async function loadPobBuildFromInput(input) {
  const parsed = parsePobInput(input);
  let code = '';

  if (parsed.type === 'empty') {
    throw new Error('PoB コードまたは pobb.in URL を入力してください');
  }
  if (parsed.type === 'code') {
    code = parsed.code;
  } else if (parsed.type === 'url') {
    code = await fetchPobbInRawCode(parsed.rawUrl, parsed.pageUrl);
  } else {
    throw new Error('PoB コードまたは pobb.in URL の形式を認識できません');
  }

  const xml = decodePobShareCode(code);
  const build = parsePobBuildXml(xml);
  return build;
}

window.POB_CLASS_TO_JP = POB_CLASS_TO_JP;
window.decodePobShareCode = decodePobShareCode;
window.parsePobInput = parsePobInput;
window.isPobShareCode = isPobShareCode;
window.fetchPobbInRawCode = fetchPobbInRawCode;
window.parsePobBuildXml = parsePobBuildXml;
window.getBuildGemsForSkillSet = getBuildGemsForSkillSet;
window.getBuildGemsForSkillSets = getBuildGemsForSkillSets;
window.matchPobGemToLocal = matchPobGemToLocal;
window.buildQuestRewardMemo = buildQuestRewardMemo;
window.getQuestRewardKey = getQuestRewardKey;
window.getQuestRewardChoiceKey = getQuestRewardChoiceKey;
window.initQuestRewardChoices = initQuestRewardChoices;
window.isQuestRewardForClass = isQuestRewardForClass;
window.loadPobBuildFromInput = loadPobBuildFromInput;
