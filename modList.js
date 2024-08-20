const originalModList = {
 "モンスターは元素ダメージの#%を反射する": {
   mod: "モンスターは元素ダメージの#%を反射する",
   engMod: "Monsters reflect #% of Elemental Damage",
   tier: 1000,
   engRegex: "tal d",
   Regex: "素.*反",
   modTier17: false,
 },
 "モンスターは物理ダメージの#%を反射する": {
   mod: "モンスターは物理ダメージの#%を反射する",
   engMod: "Monsters reflect #% of Physical Damage",
   tier: 1000,
   engRegex: "f ph",
   Regex: "物.*反",
   modTier17: false,
 },
 "全てのプレイヤーはスキルによる呪い以外のオーラの効果が#%減少する": {
   mod: "全てのプレイヤーはスキルによる呪い以外のオーラの効果が#%減少する",
   engMod: "Players have #% reduced effect of Non-Curse Auras from Skills",
   tier: 990,
   engRegex: "non",
   Regex: "ーラ",
   modTier17: false,
 },
 "プレイヤーの全ての耐性の最大値 (-12–-9)%": {
   mod: "プレイヤーの全ての耐性の最大値 (-12–-9)%",
   engMod: "Players have (-12--9)% to all maximum Resistances",
   tier: 980,
   engRegex: "o al",
   Regex: "性の最",
   modTier17: false,
 },
 "全てのプレイヤーはライフ、マナおよびエナジーシールドを自動回復することができない": {
   mod: "全てのプレイヤーはライフ、マナおよびエナジーシールドを自動回復することができない",
   engMod: "Players cannot Regenerate Life, Mana or Energy Shield",
   tier: 700,
   engRegex: "gen",
   Regex: "動回",
   modTier17: false,
 },
 "全てのプレイヤーのライフとエナジーシールドの回復レートが#%低下する": {
   mod: "全てのプレイヤーのライフとエナジーシールドの回復レートが#%低下する",
   engMod: "Players have #% less Recovery Rate of Life and Energy Shield",
   tier: 650,
   engRegex: "s rec",
   Regex: "復レ",
   modTier17: false,
 },
 "モンスターからリーチできない": {
   mod: "モンスターからリーチできない",
   engMod: "Monsters cannot be Leeched from",
   tier: 600,
   engRegex: "eec",
   Regex: "リー",
   modTier17: false,
 },
 "モンスターのクリティカル率が#%増加する モンスターのクリティカルダメージ倍率 +#%": {
   mod: "モンスターのクリティカル率が#%増加する モンスターのクリティカルダメージ倍率 +#%",
   engMod: "Monsters have #% increased Critical Strike Chance|+#% to Monster Critical Strike Multiplier",
   tier: 500,
   engRegex: "tip",
   Regex: "倍",
   modTier17: false,
 },
 "モンスターは物理ダメージの#%を追加冷気ダメージとして与える": {
   mod: "モンスターは物理ダメージの#%を追加冷気ダメージとして与える",
   engMod: "Monsters deal #% extra Physical Damage as Cold",
   tier: 450,
   engRegex: "old$",
   Regex: "加冷",
   modTier17: false,
 },
 "モンスターは物理ダメージの#%を追加火ダメージとして与える": {
   mod: "モンスターは物理ダメージの#%を追加火ダメージとして与える",
   engMod: "Monsters deal #% extra Physical Damage as Fire",
   tier: 450,
   engRegex: "fire$",
   Regex: "加火",
   modTier17: false,
 },
 "モンスターは物理ダメージの#%を追加雷ダメージとして与える": {
   mod: "モンスターは物理ダメージの#%を追加雷ダメージとして与える",
   engMod: "Monsters deal #% extra Physical Damage as Lightning",
   tier: 450,
   engRegex: "as l",
   Regex: "加雷",
   modTier17: false,
 },
 "モンスターはその物理ダメージの#%を追加混沌ダメージとして獲得する|モンスターによるヒット時に衰弱を2秒間付与する": {
   mod: "モンスターはその物理ダメージの#%を追加混沌ダメージとして獲得する|モンスターによるヒット時に衰弱を2秒間付与する",
   engMod: "Monsters gain #% of their Physical Damage as Extra Chaos Damage|Monsters Inflict Withered for 2 seconds on Hit",
   tier: 450,
   engRegex: "hered",
   Regex: "衰",
   modTier17: false,
 },
 "モンスターは投射物を追加で2個放つ": {
   mod: "モンスターは投射物を追加で2個放つ",
   engMod: "Monsters fire 2 additional Projectiles",
   tier: 440,
   engRegex: "oj",
   Regex: "放つ",
   modTier17: false,
 },
 "モンスターの移動スピードが#%増加する|モンスターのアタックスピードが#%増加する|モンスターのキャストスピードが%増加する": {
   mod: "モンスターの移動スピードが#%増加する|モンスターのアタックスピードが#%増加する|モンスターのキャストスピードが%増加する",
   engMod: "#% increased Monster Movement Speed|#% increased Monster Attack Speed|% increased Monster Cast Speed",
   tier: 420,
   engRegex: "r at",
   Regex: "ーのキ",
   modTier17: false,
 },
 "ユニークボスのダメージが#%増加する|ユニークボスのアタックスピードおよびキャストスピードが#%増加する": {
   mod: "ユニークボスのダメージが#%増加する|ユニークボスのアタックスピードおよびキャストスピードが#%増加する",
   engMod: "Unique Boss deals #% increased Damage|Unique Boss has #% increased Attack and Cast Speed",
   tier: 420,
   engRegex: "d at",
   Regex: "ボ.*範",
   modTier17: false,
 },
 "モンスターの効果範囲が#%増加する": {
   mod: "モンスターの効果範囲が#%増加する",
   engMod: "Monsters have #% increased Area of Effect",
   tier: 400,
   engRegex: "e \\d+% increased ar",
   Regex: "ターの効",
   modTier17: false,
 },
 "ユニークボスのライフが#%増加する|ユニークボスの効果範囲が#%増加する": {
   mod: "ユニークボスのライフが#%増加する|ユニークボスの効果範囲が#%増加する",
   engMod: "Unique Boss has #% increased Life|Unique Boss has #% increased Area of Effect",
   tier: 400,
   engRegex: "d li",
   Regex: "ボ.*範",
   modTier17: false,
 },
 "モンスターはヒット時に毒を付与する": {
   mod: "モンスターはヒット時に毒を付与する",
   engMod: "Monsters Poison on Hit",
   tier: 390,
   engRegex: "son o",
   Regex: "に毒",
   modTier17: false,
 },
 "モンスターは#%の確率で毒、串刺しおよび出血を無効化する": {
   mod: "モンスターは#%の確率で毒、串刺しおよび出血を無効化する",
   engMod: "Monsters have a #% chance to avoid Poison, Impale, and Bleeding",
   tier: 390,
   engRegex: "on,",
   Regex: "で毒,",
   modTier17: false,
 },
 "モンスターのスキルは追加で2回連鎖する": {
   mod: "モンスターのスキルは追加で2回連鎖する",
   engMod: "Monsters' skills Chain 2 additional times",
   tier: 380,
   engRegex: "tim",
   Regex: "鎖",
   modTier17: false,
 },
 "モンスターのダメージが#%増加する": {
   mod: "モンスターのダメージが#%増加する",
   engMod: "#% increased Monster Damage",
   tier: 370,
   engRegex: "r damage$",
   Regex: "ターのダ.*増",
   modTier17: false,
 },
 "モンスターの命中力が#%増加する|全てのプレイヤーはスペルダメージを抑制して防ぐダメージ割合が-#%される": {
   mod: "モンスターの命中力が#%増加する|全てのプレイヤーはスペルダメージを抑制して防ぐダメージ割合が-#%される",
   engMod: "Monsters have #% increased Accuracy Rating|Players have -#% to amount of Suppressed Spell Damage Prevented",
   tier: 365,
   engRegex: "rev",
   Regex: "を抑",
   modTier17: false,
 },
 "モンスターに対する呪いの効果が#%低下する": {
   mod: "モンスターに対する呪いの効果が#%低下する",
   engMod: "#% less effect of Curses on Monsters",
   tier: 363,
   engRegex: "rses",
   Regex: "いの効",
   modTier17: false,
 },
 "プレイヤーはエレメンタルウィークネスの呪いを受ける": {
   mod: "プレイヤーはエレメンタルウィークネスの呪いを受ける",
   engMod: "Players are Cursed with Elemental Weakness",
   tier: 360,
   engRegex: "h el",
   Regex: "ルウ",
   modTier17: false,
 },
 "プレイヤーはエンフィーブルの呪いを受ける": {
   mod: "プレイヤーはエンフィーブルの呪いを受ける",
   engMod: "Players are Cursed with Enfeeble",
   tier: 360,
   engRegex: "eble$",
   Regex: "ンフ",
   modTier17: false,
 },
 "プレイヤーはテンポラルチェーンの呪いを受ける": {
   mod: "プレイヤーはテンポラルチェーンの呪いを受ける",
   engMod: "Players are Cursed with Temporal Chains",
   tier: 360,
   engRegex: "h tem",
   Regex: "ンポ",
   modTier17: false,
 },
 "プレイヤーはヴァルネラビリティの呪いを受ける": {
   mod: "プレイヤーはヴァルネラビリティの呪いを受ける",
   engMod: "Players are Cursed with Vulnerability",
   tier: 360,
   engRegex: "h vu",
   Regex: "ラビ",
   modTier17: false,
 },
 "エリアには燃焼領域がまだらに存在する": {
   mod: "エリアには燃焼領域がまだらに存在する",
   engMod: "Area has patches of Burning Ground",
   tier: 310,
   engRegex: "f bur",
   Regex: "燃",
   modTier17: false,
 },
 "エリアには冷却領域がまだらに存在する": {
   mod: "エリアには冷却領域がまだらに存在する",
   engMod: "Area has patches of Chilled Ground",
   tier: 310,
   engRegex: "hil",
   Regex: "却",
   modTier17: false,
 },
 "エリアにはまだら状に神聖領域がある": {
   mod: "エリアにはまだら状に神聖領域がある",
   engMod: "Area has patches of Consecrated Ground",
   tier: 310,
   engRegex: "nsecrate",
   Regex: "に神",
   modTier17: false,
 },
 "エリアには感電領域がまだらに存在し受けるダメージを#%増加させる": {
   mod: "エリアには感電領域がまだらに存在し受けるダメージを#%増加させる",
   engMod: "Area has patches of Shocked Ground which increase Damage taken by #%",
   tier: 310,
   engRegex: "ked",
   Regex: "電領",
   modTier17: false,
 },
 "エリアには冒涜領域がまだらに存在する": {
   mod: "エリアには冒涜領域がまだらに存在する",
   engMod: "Area has patches of desecrated ground",
   tier: 310,
   engRegex: "s of d",
   Regex: "は冒",
   modTier17: false,
 },
 "全てのプレイヤーのアーマーが#%低下する|全てのプレイヤーのブロック率が#%減少する": {
   mod: "全てのプレイヤーのアーマーが#%低下する|全てのプレイヤーのブロック率が#%減少する",
   engMod: "Players have #% less Armour|Players have #% reduced Chance to Block",
   tier: 295,
   engRegex: "ur$",
   Regex: "ク率",
   modTier17: false,
 },
 "モンスターのスペルダメージ抑制確率 +#%": {
   mod: "モンスターのスペルダメージ抑制確率 +#%",
   engMod: "Monsters have +#% chance to Suppress Spell Damage",
   tier: 290,
   engRegex: "o su",
   Regex: "ジ抑",
   modTier17: false,
 },
 "モンスターがクリティカルストライクから受ける追加ダメージが#%減少する": {
   mod: "モンスターがクリティカルストライクから受ける追加ダメージが#%減少する",
   engMod: "Monsters take #% reduced Extra Damage from Critical Strikes",
   tier: 250,
   engRegex: "kes",
   Regex: "クか",
   modTier17: false,
 },
 "モンスターは最大ライフの#%を追加最大エナジーシールドとして獲得する": {
   mod: "モンスターは最大ライフの#%を追加最大エナジーシールドとして獲得する",
   engMod: "Monsters gain #% of Maximum Life as Extra Maximum Energy Shield",
   tier: 240,
   engRegex: "m li",
   Regex: "加最",
   modTier17: false,
 },
 "全てのプレイヤーの獲得フラスコチャージが#%減少する": {
   mod: "全てのプレイヤーの獲得フラスコチャージが#%減少する",
   engMod: "Players gain #% reduced Flask Charges",
   tier: 210,
   engRegex: "ask",
   Regex: "コチ",
   modTier17: false,
 },
 "モンスターの物理ダメージ軽減率 +#%": {
   mod: "モンスターの物理ダメージ軽減率 +#%",
   engMod: "+#% Monster Physical Damage Reduction",
   tier: 150,
   engRegex: "uct",
   Regex: "軽",
   modTier17: false,
 },
 "モンスターは呪術無効化を持つ": {
   mod: "モンスターは呪術無効化を持つ",
   engMod: "Monsters are Hexproof",
   tier: 150,
   engRegex: "re he",
   Regex: "術無",
   modTier17: false,
 },
 "モンスターは#%の確率で元素系状態異常を無効化する": {
   mod: "モンスターは#%の確率で元素系状態異常を無効化する",
   engMod: "Monsters have #% chance to Avoid Elemental Ailments",
   tier: 150,
   engRegex: "ail",
   Regex: "系状",
   modTier17: false,
 },
 "プレイヤーは曝露を付与することができない": {
   mod: "プレイヤーは曝露を付与することができない",
   engMod: "Players cannot inflict Exposure",
   tier: 150,
   engRegex: "ot i",
   Regex: "曝",
   modTier17: false,
 },
 "モンスターのライフが#%上昇する|モンスターはスタンを受けることがない": {
   mod: "モンスターのライフが#%上昇する|モンスターはスタンを受けることがない",
   engMod: "#% more Monster Life|Monsters cannot be Stunned",
   tier: 100,
   engRegex: "tun",
   Regex: "ンを受",
   modTier17: false,
 },
 "モンスターのライフが#%上昇する": {
   mod: "モンスターのライフが#%上昇する",
   engMod: "#% more Monster Life",
   tier: 100,
   engRegex: "r li",
   Regex: "ラ.*上",
   modTier17: false,
 },
 "モンスターの混沌耐性 +#%|モンスターの元素耐性 +#%": {
   mod: "モンスターの混沌耐性 +#%|モンスターの元素耐性 +#%",
   engMod: "+#% Monster Chaos Resistance|+#% Monster Elemental Resistances",
   tier: 100,
   engRegex: "r el",
   Regex: "性 +",
   modTier17: false,
 },
 "モンスターの全てのダメージにより発火が付与される": {
   mod: "モンスターの全てのダメージにより発火が付与される",
   engMod: "All Monster Damage from Hits always Ignites",
   tier: 99,
   engRegex: "lw",
   Regex: "り発",
   modTier17: false,
 },
 "モンスターはヒット時に#%の確率で発火、凍結および感電を付与する": {
   mod: "モンスターはヒット時に#%の確率で発火、凍結および感電を付与する",
   engMod: "Monsters have a #% chance to Ignite, Freeze and Shock on Hit",
   tier: 98,
   engRegex: "te,",
   Regex: "、凍",
   modTier17: false,
 },
 "モンスターアタックはヒット時に#%の確率で串刺しを付与する": {
   mod: "モンスターアタックはヒット時に#%の確率で串刺しを付与する",
   engMod: "Monsters' Attacks have #% chance to Impale on Hit",
   tier: 98,
   engRegex: "' at",
   Regex: "で串",
   modTier17: false,
 },
 "全てのプレイヤーに対するバフは#%速く消える": {
   mod: "全てのプレイヤーに対するバフは#%速く消える",
   engMod: "Buffs on Players expire #% faster",
   tier: 96,
   engRegex: "fs",
   Regex: "イ.*速",
   modTier17: false,
 },
 "全てのプレイヤーのクールダウン解消レートが#%低下する": {
   mod: "全てのプレイヤーのクールダウン解消レートが#%低下する",
   engMod: "Players have #% less Cooldown Recovery Rate",
   tier: 94,
   engRegex: "coo",
   Regex: "解",
   modTier17: false,
 },
 "エリアには2体のユニークボスがいる": {
   mod: "エリアには2体のユニークボスがいる",
   engMod: "Area contains two Unique Bosses",
   tier: 90,
   engRegex: "two",
   Regex: "体の",
   modTier17: false,
 },
 "ユニークボスは取り憑かれている": {
   mod: "ユニークボスは取り憑かれている",
   engMod: "Unique Bosses are Possessed",
   tier: 90,
   engRegex: "poss",
   Regex: "憑",
   modTier17: false,
 },
 "モンスターは挑発を受けることがない|モンスターのアクションスピードは基礎値よりも低く修正されることがない|モンスターの移動スピードは基礎値よりも低く修正されることがない": {
   mod: "モンスターは挑発を受けることがない|モンスターのアクションスピードは基礎値よりも低く修正されることがない|モンスターの移動スピードは基礎値よりも低く修正されることがない",
   engMod: "Monsters cannot be Taunted|Monsters' Action Speed cannot be modified to below Base engMod|Monsters' Movement Speed cannot be modified to below Base engMod",
   tier: 89,
   engRegex: "elo",
   Regex: "挑",
   modTier17: false,
 },
 "全てのプレイヤーの命中力が#%低下する": {
   mod: "全てのプレイヤーの命中力が#%低下する",
   engMod: "Players have #% less Accuracy Rating",
   tier: 85,
   engRegex: "s ac",
   Regex: "命.*低",
   modTier17: false,
 },
 "モンスターはヒット時にフレンジーチャージを1個獲得する": {
   mod: "モンスターはヒット時にフレンジーチャージを1個獲得する",
   engMod: "Monsters gain a Frenzy Charge on Hit",
   tier: 80,
   engRegex: "zy c",
   Regex: "にフレ",
   modTier17: false,
 },
 "モンスターはヒット時にパワーチャージを1個獲得する": {
   mod: "モンスターはヒット時にパワーチャージを1個獲得する",
   engMod: "Monsters gain a Power Charge on Hit",
   tier: 80,
   engRegex: "a pow",
   Regex: "パ.*時",
   modTier17: false,
 },
 "モンスターはヒット時にエンデュランスチャージを1個獲得する": {
   mod: "モンスターはヒット時にエンデュランスチャージを1個獲得する",
   engMod: "Monsters gain an Endurance Charge on Hit",
   tier: 80,
   engRegex: "an en",
   Regex: "にエ",
   modTier17: false,
 },
 "モンスターはヒット時にパワーチャージ、フレンジーチャージおよびエンデュランスチャージのスタックを盗む": {
   mod: "モンスターはヒット時にパワーチャージ、フレンジーチャージおよびエンデュランスチャージのスタックを盗む",
   engMod: "Monsters steal Power, Frenzy and Endurance charges on Hit",
   tier: 80,
   engRegex: "er,",
   Regex: "盗",
   modTier17: false,
 },
 "全てのプレイヤーの効果範囲が#%低下する": {
   mod: "全てのプレイヤーの効果範囲が#%低下する",
   engMod: "Players have #% less Area of Effect",
   tier: 60,
   engRegex: "ss are",
   Regex: "範.*低",
   modTier17: false,
 },
 "モンスターはヒット時に盲目を付与する": {
   mod: "モンスターはヒット時に盲目を付与する",
   engMod: "Monsters Blind on Hit",
   tier: 50,
   engRegex: "s bli",
   Regex: "盲",
   modTier17: false,
 },
 "モンスターはスペルによるヒット時に阻害を付与する": {
   mod: "モンスターはスペルによるヒット時に阻害を付与する",
   engMod: "Monsters Hinder on Hit with Spells",
   tier: 50,
   engRegex: "hind",
   Regex: "阻",
   modTier17: false,
 },
 "モンスターはアタックによるヒット時に重傷を付与する": {
   mod: "モンスターはアタックによるヒット時に重傷を付与する",
   engMod: "Monsters Maim on Hit with Attacks",
   tier: 50,
   engRegex: "aim",
   Regex: "重",
   modTier17: false,
 },
 "エリアには多数のトーテムが出現する": {
   mod: "エリアには多数のトーテムが出現する",
   engMod: "Area contains many Totems",
   tier: 9,
   engRegex: "tot",
   Regex: "数の",
   modTier17: false,
 },
 "エリアのモンスターの種類が増える": {
   mod: "エリアのモンスターの種類が増える",
   engMod: "Area has increased monster variety",
   tier: 8,
   engRegex: "ety",
   Regex: "の種",
   modTier17: false,
 },
 "エリアにはアボミネーションが出現する": {
   mod: "エリアにはアボミネーションが出現する",
   engMod: "Area is inhabited by Abominations",
   tier: 4,
   engRegex: "bom",
   Regex: "ミネ",
   modTier17: false,
 },
 "エリアには動物が生息している": {
   mod: "エリアには動物が生息している",
   engMod: "Area is inhabited by Animals",
   tier: 4,
   engRegex: "nim",
   Regex: "動物",
   modTier17: false,
 },
 "エリアにはキタヴァの崇拝者が出現する": {
   mod: "エリアにはキタヴァの崇拝者が出現する",
   engMod: "Area is inhabited by Cultists of Kitava",
   tier: 4,
   engRegex: "cul",
   Regex: "タヴ",
   modTier17: false,
 },
 "エリアにはデーモンが生息している": {
   mod: "エリアにはデーモンが生息している",
   engMod: "Area is inhabited by Demons",
   tier: 4,
   engRegex: "emons",
   Regex: "デー",
   modTier17: false,
 },
 "エリアにはゴーストが出現する": {
   mod: "エリアにはゴーストが出現する",
   engMod: "Area is inhabited by Ghosts",
   tier: 4,
   engRegex: "osts",
   Regex: "ース",
   modTier17: false,
 },
 "エリアにはゴートマンが生息している": {
   mod: "エリアにはゴートマンが生息している",
   engMod: "Area is inhabited by Goatmen",
   tier: 4,
   engRegex: "oa",
   Regex: "トマ",
   modTier17: false,
 },
 "エリアにはヒューマノイドが生息している": {
   mod: "エリアにはヒューマノイドが生息している",
   engMod: "Area is inhabited by Humanoids",
   tier: 4,
   engRegex: "hum",
   Regex: "マノ",
   modTier17: false,
 },
 "エリアにはソラリスの狂信者が出現する": {
   mod: "エリアにはソラリスの狂信者が出現する",
   engMod: "Area is inhabited by Lunaris fanatics",
   tier: 4,
   engRegex: "unari",
   Regex: "ラリ",
   modTier17: false,
 },
 "エリアにはシーウィッチとその幼体が生息している": {
   mod: "エリアにはシーウィッチとその幼体が生息している",
   engMod: "Area is inhabited by Sea Witches and their Spawn",
   tier: 4,
   engRegex: "itc",
   Regex: "ーウ",
   modTier17: false,
 },
 "エリアにはスケルトンが生息している": {
   mod: "エリアにはスケルトンが生息している",
   engMod: "Area is inhabited by Skeletons",
   tier: 4,
   engRegex: "eto",
   Regex: "スケ",
   modTier17: false,
 },
 "エリアにはルナリスの狂信者が出現する": {
   mod: "エリアにはルナリスの狂信者が出現する",
   engMod: "Area is inhabited by Solaris fanatics",
   tier: 4,
   engRegex: "laris",
   Regex: "ナリ",
   modTier17: false,
 },
 "エリアにはアンデッドが生息している": {
   mod: "エリアにはアンデッドが生息している",
   engMod: "Area is inhabited by Undead",
   tier: 4,
   engRegex: "by un",
   Regex: "デッ",
   modTier17: false,
 },
 "エリアには遠距離攻撃を行うモンスターが生息している": {
   mod: "エリアには遠距離攻撃を行うモンスターが生息している",
   engMod: "Area is inhabited by ranged monsters",
   tier: 4,
   engRegex: "rang",
   Regex: "離",
   modTier17: false,
 },
 "レアモンスターの数が#%増加する": {
   mod: "レアモンスターの数が#%増加する",
   engMod: "#% increased number of Rare Monsters",
   tier: 1,
   engRegex: "nu",
   Regex: "アモ.*数",
   modTier17: false,
 },
 "マジックモンスターの数が#%増加する": {
   mod: "マジックモンスターの数が#%増加する",
   engMod: "#% increased Magic Monsters",
   tier: 0,
   engRegex: "d mag",
   Regex: "マ.*増",
   modTier17: false,
 },
 "(T17) モンスターのスキルは追加で3回連鎖する|モンスターの投射物は地形と衝突した時に連鎖することができる": {
   mod: "(T17) モンスターのスキルは追加で3回連鎖する|モンスターの投射物は地形と衝突した時に連鎖することができる",
   engMod: "(T17) Monsters' skills Chain 3 additional times|Monsters' Projectiles can Chain when colliding with Terrain",
   tier: 1111,
   engRegex: "lid",
   Regex: "に連",
   modTier17: true,
 },
 "(T17) プレイヤーとそのミニオンは10秒ごとに4秒間ダメージを与えられない": {
   mod: "(T17) プレイヤーとそのミニオンは10秒ごとに4秒間ダメージを与えられない",
   engMod: "(T17) Players and their Minions deal no damage for 4 out of every 10 seconds",
   tier: 1111,
   engRegex: "ever",
   Regex: "を与",
   modTier17: true,
 },
 "(T17) モンスターの効果範囲が#%増加する|モンスターは投射物を追加で4個放つ": {
   mod: "(T17) モンスターの効果範囲が#%増加する|モンスターは投射物を追加で4個放つ",
   engMod: "(T17) Monsters have #% increased Area of Effect|Monsters fire 4 additional Projectiles",
   tier: 1111,
   engRegex: "tiles$",
   Regex: "ターの効",
   modTier17: true,
 },
 "(T17) モンスターのダメージが#%増加する": {
   mod: "(T17) モンスターのダメージが#%増加する",
   engMod: "(T17) #% increased Monster Damage",
   tier: 1111,
   engRegex: "r damage$",
   Regex: "ターのダ.*増"",
   modTier17: true,
 },
 "(T17) モンスターは最大ライフの#%を追加最大エナジーシールドとして獲得する": {
   mod: "(T17) モンスターは最大ライフの#%を追加最大エナジーシールドとして獲得する",
   engMod: "(T17) Monsters gain #% of Maximum Life as Extra Maximum Energy Shield",
   tier: 1111,
   engRegex: "m li",
   Regex: "加最",
   modTier17: true,
 },
 "(T17) ユニークボスは取り憑かれている": {
   mod: "(T17) ユニークボスは取り憑かれている",
   engMod: "(T17) Unique Bosses are Possessed",
   tier: 1111,
   engRegex: "poss",
   Regex: "憑",
   modTier17: true,
 },
 "(T17) モンスターのスペルダメージ抑制確率 +#%": {
   mod: "(T17) モンスターのスペルダメージ抑制確率 +#%",
   engMod: "(T17) Monsters have +#% chance to Suppress Spell Damage",
   tier: 1111,
   engRegex: "o su",
   Regex: "ジ抑",
   modTier17: true,
 },
 "(T17) モンスターのアタックダメージブロック確率 +#%": {
   mod: "(T17) モンスターのアタックダメージブロック確率 +#%",
   engMod: "(T17) Monsters have +#% Chance to Block Attack Damage",
   tier: 1111,
   engRegex: "k at",
   Regex: "ジブ",
   modTier17: true,
 },
 "(T17) モンスターは物理ダメージの#%を反射する": {
   mod: "(T17) モンスターは物理ダメージの#%を反射する",
   engMod: "(T17) Monsters reflect #% of Physical Damage",
   tier: 1111,
   engRegex: "f ph",
   Regex: "物.*反",
   modTier17: true,
 },
 "(T17) モンスターは元素ダメージの#%を反射する": {
   mod: "(T17) モンスターは元素ダメージの#%を反射する",
   engMod: "(T17) Monsters reflect #% of Elemental Damage",
   tier: 1111,
   engRegex: "tal d",
   Regex: "素.*反",
   modTier17: true,
 },
 "(T17) モンスターのライフが#%上昇する": {
   mod: "(T17) モンスターのライフが#%上昇す",
   engMod: "(T17) #% more Monster Life",
   tier: 1111,
   engRegex: "r li",
   Regex: "ラ.*上",
   modTier17: true,
 },
 "(T17) レアモンスターの数が(35–45)%増加する それぞれのレアモンスターはモッドを追加で2個持つ": {
   mod: "(T17) レアモンスターの数が(35–45)%増加する それぞれのレアモンスターはモッドを追加で2個持つ",
   engMod: "(T17) #% increased number of Rare Monsters|Rare Monsters each have 2 additional Modifiers",
   tier: 1111,
   engRegex: "iers$",
   Regex: "はモ",
   modTier17: true,
 },
 "(T17) モンスターはヒット時に束縛する蔓を2スタック付与する": {
   mod: "(T17) モンスターはヒット時に束縛する蔓を2スタック付与する",
   engMod: "(T17) Monsters inflict 2 Grasping Vines on Hit",
   tier: 1111,
   engRegex: "pin",
   Regex: "に束",
   modTier17: true,
 },
 "(T17) レアモンスターはボラタイルコアを持つ": {
   mod: "(T17) レアモンスターはボラタイルコアを持つ",
   engMod: "(T17) Rare Monsters have Volatile Cores",
   tier: 1111,
   engRegex: "cores",
   Regex: "ラタ",
   modTier17: true,
 },
 "(T17) モンスターはその物理ダメージの(180–200)%をランダムな元素属性の追加ダメージとして獲得する": {
   mod: "(T17) モンスターはその物理ダメージの(180–200)%をランダムな元素属性の追加ダメージとして獲得する",
   engMod: "(T17) Monsters gain #% of their Physical Damage as Extra Damage of a random Element",
   tier: 1111,
   engRegex: "om e",
   Regex: "な元",
   modTier17: true,
 },
 "(T17) モンスターはその物理ダメージの(80–100)%を追加混沌ダメージとして獲得する": {
   mod: "(T17) モンスターはその物理ダメージの(80–100)%を追加混沌ダメージとして獲得する",
   engMod: "(T17) Monsters gain #% of their Physical Damage as Extra Chaos Damage",
   tier: 1111,
   engRegex: "ra c",
   Regex: "沌ダ",
   modTier17: true,
 },
 "(T17) モンスターの移動スピードが#%増加する|モンスターのアタックスピードが#%増加する|モンスターのキャストスピードが%増加する": {
   mod: "(T17) モンスターの移動スピードが#%増加する|モンスターのアタックスピードが#%増加する|モンスターのキャストスピードが%増加する",
   engMod: "(T17) #% increased Monster Movement Speed|#% increased Monster Attack Speed|#% increased Monster Cast Speed",
   tier: 1111,
   engRegex: "\\d+% increased monster c",
   Regex: "ーのキ",
   modTier17: true,
 },
 "(T17) プレイヤーは血塗れのノコギリに襲われる": {
   mod: "(T17) プレイヤーは血塗れのノコギリに襲われる",
   engMod: "(T17) Players are assaulted by Bloodstained Sawblades",
   tier: 1111,
   engRegex: "wb",
   Regex: "塗",
   modTier17: true,
 },
 "(T17) エリアには溺死のオーブが出現する": {
   mod: "(T17) エリアには溺死のオーブが出現する",
   engMod: "(T17) Area contains Drowning Orbs",
   tier: 1111,
   engRegex: "wni",
   Regex: "溺",
   modTier17: true,
 },
 "(T17) モンスターに対する呪いの効果が#%減少する": {
   mod: "(T17) モンスターに対する呪いの効果が#%減少する",
   engMod: "(T17) #% reduced Effect of Curses on Monsters",
   tier: 1111,
   engRegex: "d effect of c",
   Regex: "いの効",
   modTier17: true,
 },
 "(T17) モンスターの物理ダメージ軽減率 +#%": {
   mod: "(T17) モンスターの物理ダメージ軽減率 +#%",
   engMod: "(T17) +#% Monster Physical Damage Reduction",
   tier: 1111,
   engRegex: "uct",
   Regex: "軽",
   modTier17: true,
 },
 "(T17) モンスターの混沌耐性 +#%|モンスターの元素耐性 +#%": {
   mod: "(T17) モンスターの混沌耐性 +#%|モンスターの元素耐性 +#%",
   engMod: "(T17) +#% Monster Chaos Resistance|+#% Monster Elemental Resistances",
   tier: 1111,
   engRegex: "r el",
   Regex: "性 +",
   modTier17: true,
 },
 "(T17) モンスターは全てのダメージで発火、凍結および感電を付与できる|モンスターはヒット時に確率で発火、凍結および感電を付与する": {
   mod: "(T17) モンスターは全てのダメージで発火、凍結および感電を付与できる|モンスターはヒット時に確率で発火、凍結および感電を付与する",
   engMod: "(T17) All Monster Damage can Ignite, Freeze and Shock|Monsters Ignite, Freeze and Shock on Hit",
   tier: 1111,
   engRegex: "hock$",
   Regex: "、凍",
   modTier17: true,
 },
 "(T17) プレイヤーはレアまたはユニークのモンスターを倒した後 10秒間死の呪印を受ける": {
   mod: "(T17) プレイヤーはレアまたはユニークのモンスターを倒した後 10秒間死の呪印を受ける",
   engMod: "(T17) Players are Marked for Death for 10 seconds after killing a Rare or Unique monster",
   tier: 1111,
   engRegex: "rke",
   Regex: "印",
   modTier17: true,
 },
 "(T17) レアまたはユニークのモンスターはヒット時にプレイヤーまたはミニオンからライフ、マナおよびエナジーシールドの#%を取り除く": {
   mod: "(T17) レアまたはユニークのモンスターはヒット時にプレイヤーまたはミニオンからライフ、マナおよびエナジーシールドの#%を取り除く",
   engMod: "(T17) Rare and Unique Monsters remove #% of Life, Mana and Energy Shield on hit",
   tier: 1111,
   engRegex: "na a",
   Regex: "はミ",
   modTier17: true,
 },
 "(T17) モンスターアタックはヒット時に串刺しを付与する|プレイヤーに5スタック目の串刺しが付与された時に、串刺しは取り除かれプレイヤーと1.8m以内の味方に残りのヒット回数を乗じた物理ダメ―ジを反射する": {
   mod: "(T17) モンスターアタックはヒット時に串刺しを付与する|プレイヤーに5スタック目の串刺しが付与された時に、串刺しは取り除かれプレイヤーと1.8m以内の味方に残りのヒット回数を乗じた物理ダメ―ジを反射する",
   engMod: "(T17) Monsters' Attacks Impale on Hit|When a fifth Impale is inflicted on a Player, Impales are removed to Reflect thier Physical Damage multiplied by their remaining Hits to that Player and their Allies within 1.8 metres",
   tier: 1111,
   engRegex: "fif",
   Regex: "の串",
   modTier17: true,
 },
 "(T17) エリアのレアモンスターはシェイパーに触れられている": {
   mod: "(T17) エリアのレアモンスターはシェイパーに触れられている",
   engMod: "(T17) Rare monsters in area are Shaper-Touched",
   tier: 1111,
   engRegex: "hap",
   Regex: "に触",
   modTier17: true,
 },
 "(T17) プレイヤーのトーテムの最大召喚数 -2体": {
   mod: "(T17) プレイヤーのトーテムの最大召喚数 -2体",
   engMod: "(T17) Players have -2 to maximum number of Summoned Totems",
   tier: 1111,
   engRegex: "moned",
   Regex: "大召",
   modTier17: true,
 },
 "(T17) マインを投げるプレイヤーのスキルのマインが1個少なくなる|トラップを投げるプレイヤーのスキルのトラップが1個少なくなる": {
   mod: "(T17) マインを投げるプレイヤーのスキルのマインが1個少なくなる|トラップを投げるプレイヤーのスキルのトラップが1個少なくなる",
   engMod: "(T17) Player Skills which Throw Mines throw 1 fewer Mine|Player Skills which Throw Traps throw 1 fewer Trap",
   tier: 1111,
   engRegex: "hro",
   Regex: "マイ",
   modTier17: true,
 },
 "(T17) プレイヤーのトーテムがヒットから受けたダメージの#%を代わりに召喚者のライフで受ける": {
   mod: "(T17) プレイヤーのトーテムがヒットから受けたダメージの#%を代わりに召喚者のライフで受ける",
   engMod: "(T17) #% of Damage Players' Totems take from Hits is taken from their Summoner's Life instead",
   tier: 1111,
   engRegex: "oner",
   Regex: "で受",
   modTier17: true,
 },
 "(T17) エリアにいるプレイヤーは近くの味方1体ごとに受けるダメージが#%増加する": {
   mod: "(T17) エリアにいるプレイヤーは近くの味方1体ごとに受けるダメージが#%増加する",
   engMod: "(T17) Players in Area take #% increased Damage per nearby Ally",
   tier: 1111,
   engRegex: "rby",
   Regex: "くの",
   modTier17: true,
 },
 "(T17) マップボスはシンセシスボスを伴う": {
   mod: "(T17) マップボスはシンセシスボスを伴う",
   engMod: "(T17) Map Boss is accompanied by a Synthesis Boss",
   tier: 1111,
   engRegex: "yn",
   Regex: "スボ",
   modTier17: true,
 },
 "(T17) エリアには灼熱の代行者のルーンが出現する": {
   mod: "(T17) エリアには灼熱の代行者のルーンが出現する",
   engMod: "(T17) Area contains Runes of the Searing Exarch",
   tier: 1111,
   engRegex: "ch$",
   Regex: "灼",
   modTier17: true,
 },
 // "(T17) All Magic and Normal Monsters in Area are in a Union of Souls": {
 //   mod: "",
 //   engMod: "(T17) All Magic and Normal Monsters in Area are in a Union of Souls",
 //   tier: 1111,
 //   engRegex: "sou",
 //   Regex: "魂",
 //   modTier17: true,
 // },
 "(T17) モンスターの最大パワーチャージ数が+1される|モンスターはヒット時にパワーチャージを1個獲得する": {
   mod: "(T17) モンスターの最大パワーチャージ数が+1される|モンスターはヒット時にパワーチャージを1個獲得する",
   engMod: "(T17) Monsters have +1 to Maximum Power Charges|Monsters gain a Power Charge on Hit",
   tier: 1111,
   engRegex: "mum p",
   Regex: "大パ",
   modTier17: true,
 },
 "(T17) モンスターの最大フレンジーチャージ数が+1される|モンスターはヒット時にフレンジーチャージを1個獲得する": {
   mod: "(T17) モンスターの最大フレンジーチャージ数が+1される|モンスターはヒット時にフレンジーチャージを1個獲得する",
   engMod: "(T17) Monsters have +1 to Maximum Frenzy Charges|Monsters gain a Frenzy Charge on Hit",
   tier: 1111,
   engRegex: "mum f",
   Regex: "大フ",
   modTier17: true,
 },
 "(T17) モンスターの最大エンデュランスチャージ数が+1される|モンスターはヒットを受けた時にエンデュランスチャージを1個獲得する": {
   mod: "(T17) モンスターの最大エンデュランスチャージ数が+1される|モンスターはヒットを受けた時にエンデュランスチャージを1個獲得する",
   engMod: "(T17) Monsters have +1 to Maximum Endurance Charges|Monsters gain an Endurance Charge when hit",
   tier: 1111,
   engRegex: "m end",
   Regex: "にエ",
   modTier17: true,
 },
 "(T17) プレイヤーの全ての耐性の最大値 -#%": {
   mod: "(T17) プレイヤーの全ての耐性の最大値 -#%",
   engMod: "(T17) Players have -#% to all maximum Resistances",
   tier: 1111,
   engRegex: "\\d+% to al",
   Regex: "性の最",
   modTier17: true,
 },
 "(T17) モンスターのクリティカル率が#%増加する|モンスターのクリティカルダメージ倍率 +#%": {
   mod: "(T17) モンスターのクリティカル率が#%増加する|モンスターのクリティカルダメージ倍率 +#%",
   engMod: "(T17) Monsters have #% increased Critical Strike Chance|+#% to Monster Critical Strike Multiplier",
   tier: 1111,
   engRegex: "lier",
   Regex: "倍",
   modTier17: true,
 },
 "(T17) モンスターはヒット時に毒を付与する|モンスターによる全てのダメージが毒を付与できる モンスターによる毒の持続時間が#%増加する": {
   mod: "(T17) モンスターはヒット時に毒を付与する|モンスターによる全てのダメージが毒を付与できる モンスターによる毒の持続時間が#%増加する",
   engMod: "(T17) Monsters Poison on Hit|All Damage from Monsters' Hits can Poison",
   tier: 1111,
   engRegex: "son$",
   Regex: "に毒",
   modTier17: true,
 },
 "(T17) モンスターからリーチできない": {
   mod: "(T17) モンスターからリーチできない",
   engMod: "(T17) Monsters cannot be Leeched from",
   tier: 1111,
   engRegex: "eec",
   Regex: "リー",
   modTier17: true,
 },
 "(T17) プレイヤーはヴァルネラビリティの呪いを受ける": {
   mod: "(T17) プレイヤーはヴァルネラビリティの呪いを受ける",
   engMod: "(T17) Players are Cursed with Vulnerability",
   tier: 1111,
   engRegex: "h vu",
   Regex: "ラビ",
   modTier17: true,
 },
 "(T17) 全てのプレイヤーの効果範囲が#%低下する": {
   mod: "(T17) 全てのプレイヤーの効果範囲が#%低下する",
   engMod: "(T17) Players have #% less Area of Effect",
   tier: 1111,
   engRegex: "ss are",
   Regex: "範.*低",
   modTier17: true,
 },
 "(T17) モンスターがクリティカルストライクから受ける追加ダメージが#%減少する": {
   mod: "(T17) モンスターがクリティカルストライクから受ける追加ダメージが#%減少する",
   engMod: "(T17) Monsters take #% reduced Extra Damage from Critical Strikes",
   tier: 1111,
   engRegex: "kes",
   Regex: "クか",
   modTier17: true,
 },
 "(T17) ユニークモンスターはランダムなシュラインバフを1個持つ": {
   mod: "(T17) ユニークモンスターはランダムなシュラインバフを1個持つ",
   engMod: "(T17) Unique Monsters have a random Shrine Buff",
   tier: 1111,
   engRegex: "ff$",
   Regex: "フを",
   modTier17: true,
 },
 "(T17) エリアには石化の像が出現する": {
   mod: "(T17) エリアには石化の像が出現する",
   engMod: "(T17) Area contains Petrification Statues",
   tier: 1111,
   engRegex: "pet",
   Regex: "像",
   modTier17: true,
 },
 // "(T17) Area contains (30-40) additional Clusters of Highly Volatile Barrels": {
 //   mod: "",
 //   engMod: "(T17) Area contains (30-40) additional Clusters of Highly Volatile Barrels",
 //   tier: 1111,
 //   engRegex: "hl",
 //   Regex: "hl",
 //   modTier17: true,
 // },
 "(T17) 全てのプレイヤーはエンデュランスチャージを獲得することができない|全てのプレイヤーはフレンジーチャージを獲得することができない|全てのプレイヤーはパワーチャージを獲得することができない": {
   mod: "(T17) 全てのプレイヤーはエンデュランスチャージを獲得することができない|全てのプレイヤーはフレンジーチャージを獲得することができない|全てのプレイヤーはパワーチャージを獲得することができない",
   engMod: "(T17) Players cannot gain Endurance Charges|Players cannot gain Frenzy Charges|Players cannot gain Power Charges",
   tier: 1111,
   engRegex: "ot g",
   Regex: "を獲",
   modTier17: true,
 },
 "(T17) モンスターはスタンを受けることがない|モンスターのアクションスピードは基礎値よりも低く修正されることがない|モンスターの移動スピードは基礎値よりも低く修正されることがない": {
   mod: "(T17) モンスターはスタンを受けることがない|モンスターのアクションスピードは基礎値よりも低く修正されることがない|モンスターの移動スピードは基礎値よりも低く修正されることがない",
   engMod: "(T17) Monsters cannot be Stunned|Monsters' Action Speed cannot be modified to below Base engMod|Monsters' Movement Speed cannot be modified to below Base engMod",
   tier: 1111,
   engRegex: "tun",
   Regex: "礎",
   modTier17: true,
 },
 "(T17) プレイヤーはフラスコを使用した時に隕石の対象となる": {
   mod: "(T17) プレイヤーはフラスコを使用した時に隕石の対象となる",
   engMod: "(T17) Players are targeted by a Meteor when they use a Flask",
   tier: 1111,
   engRegex: "get",
   Regex: "隕",
   modTier17: true,
 },
 "(T17) プレイヤーの防御力が#%低下する": {
   mod: "(T17) プレイヤーの防御力が#%低下する",
   engMod: "(T17) Players have #% less Defences",
   tier: 1111,
   engRegex: "efe",
   Regex: "御",
   modTier17: true,
 },
 "(T17) プレイヤーはエナジーシールドをリチャージできない": {
   mod: "(T17) プレイヤーはエナジーシールドをリチャージできない",
   engMod: "(T17) Players cannot Recharge Energy Shield",
   tier: 1111,
   engRegex: "rech",
   Regex: "リチ",
   modTier17: true,
 },
 "(T17) プレイヤーはブロックできない": {
   mod: "(T17) プレイヤーはブロックできない",
   engMod: "(T17) Players cannot Block",
   tier: 1111,
   engRegex: "t bl",
   Regex: "クで",
   modTier17: true,
 },
 "(T17) プレイヤーはスペルダメージを抑制することができない": {
   mod: "(T17) プレイヤーはスペルダメージを抑制することができない",
   engMod: "Players cannot Suppress Spell Damage",
   tier: 1111,
   engRegex: "ot s",
   Regex: "制す",
   modTier17: true,
 },
 "(T17) 全てのプレイヤーはスキルによる呪い以外のオーラの効果が#%減少する": {
   mod: "(T17) 全てのプレイヤーはスキルによる呪い以外のオーラの効果が#%減少する",
   engMod: "(T17) Players have #% reduced effect of Non-Curse Auras from Skills",
   tier: 1111,
   engRegex: "non",
   Regex: "ーラ",
   modTier17: true,
 },
 "(T17) 全てのプレイヤーはライフ、マナおよびエナジーシールドを自動回復することができない": {
   mod: "(T17) 全てのプレイヤーはライフ、マナおよびエナジーシールドを自動回復することができない",
   engMod: "(T17) Players have #% less Recovery Rate of Life and Energy Shield",
   tier: 1111,
   engRegex: "s rec",
   Regex: "動回",
   modTier17: true,
 },
 "(T17) 全てのプレイヤーに対するバフは#%速く消える": {
   mod: "(T17) 全てのプレイヤーに対するバフは#%速く消える",
   engMod: "(T17) Buffs on Players expire #% faster",
   tier: 1111,
   engRegex: "n pl",
   Regex: "イ.*速",
   modTier17: true,
 },
 "(T17) モンスターのダメージは15%の元素耐性を突破する": {
   mod: "(T17) モンスターのダメージは15%の元素耐性を突破する",
   engMod: "(T17) Monster Damage Penetrates #% Elemental Resistances",
   tier: 1111,
   engRegex: "net",
   Regex: "破す",
   modTier17: true,
 },
 "(T17) プレイヤーは直近使用したスキルの回数ごとにアクションスピードが#%減少する": {
   mod: "(T17) プレイヤーは直近使用したスキルの回数ごとにアクションスピードが#%減少する",
   engMod: "(T17) Players have #% reduced Action Speed for each time they've used a Skill Recently",
   tier: 1111,
   engRegex: "'v",
   Regex: "数ご",
   modTier17: true,
 },
 "(T17) エリアには不安定な触手の悪魔が出現する": {
   mod: "(T17) エリアには不安定な触手の悪魔が出現する",
   engMod: "(T17) Area contains Unstable Tentacle Fiends",
   tier: 1111,
   engRegex: "tab",
   Regex: "手",
   modTier17: true,
 },
 "(T17) エリアには覚醒者の荒廃が斑状に出現する": {
   mod: "(T17) エリアには覚醒者の荒廃が斑状に出現する",
   engMod: "(T17) Area has patches of Awakeners' Desolation",
   tier: 1111,
   engRegex: "wak",
   Regex: "廃",
   modTier17: true,
 },
 "(T17) プレイヤーのミニオンのアタックスピードが#%低下する|プレイヤーのミニオンのキャストスピードが#%低下する|プレイヤーのミニオンの移動スピードが#%低下する": {
   mod: "(T17) プレイヤーのミニオンのアタックスピードが#%低下する|プレイヤーのミニオンのキャストスピードが#%低下する|プレイヤーのミニオンの移動スピードが#%低下する",
   engMod: "(T17) Players' Minions have #% less Attack Speed|Players' Minions have #% less Cast Speed|Players' Minions have #% less Movement Speed",
   tier: 1111,
   engRegex: "' mi",
   Regex: "キ.*低",
   modTier17: true,
 },
 "(T17) モンスターに対するデバフは#%速く消える": {
   mod: "(T17) モンスターに対するデバフは#%速く消える",
   engMod: "(T17) Debuffs on Monsters expire #% faster",
   tier: 1111,
   engRegex: "deb",
   Regex: "ス.*速",
   modTier17: true,
 },
 "(T17) メイヴェンはプレイヤーに干渉する": {
   mod: "(T17) メイヴェンはプレイヤーに干渉する",
   engMod: "(T17) The Maven interferes with Players",
   tier: 1111,
   engRegex: "mav",
   Regex: "干",
   modTier17: true,
 },
 "(T17) 25%の確率でレアモンスターは死亡時にフラクチャー化する": {
   mod: "(T17) 25%の確率でレアモンスターは死亡時にフラクチャー化する",
   engMod: "(T17) 25% chance for Rare Monsters to Fracture on death",
   tier: 1111,
   engRegex: "o F",
   Regex: "亡時",
   modTier17: true,
 },
};

// map name
// 展望台のマップ
// 砂浜のマップ
// 墓場のマップ
// 地下牢のマップ
// 鋳造工場のマップ
// 路地のマップ
// 刑務所のマップ
// 砂漠のマップ
// 枯れた湖のマップ
// 水没鉱山のマップ
// 沼地のマップ
// 氷山のマップ
// 檻のマップ
// 真菌の空洞のマップ
// 採掘場のマップ
// レイラインのマップ
// 半島のマップ
// 港湾のマップ
// 埋葬室のマップ
// 監房のマップ
// 拱廊のマップ
// 街の広場のマップ
// 遺物保管室のマップ
// 裁判所のマップ
// 岸辺のマップ
// シャトーのマップ
// 洞窟のマップ
// 氷河のマップ
// 火山のマップ
// 灯台のマップ
// 峡谷のマップ
// 凍結した船室のマップ
// 谷間の墓地のマップ
// 深紅の町のマップ
// 分岐した川のマップ
// 凍てついた川のマップ
// 禁じられた森のマップ
// 温室のマップ
// 硫黄噴出孔のマップ
// 幽霊屋敷のマップ
// 迷路のマップ
// 水道のマップ
// 有毒な下水道のマップ
// 古代都市のマップ
//象牙の寺院のマップ
// 蜘蛛の巣のマップ
// 古墳のマップ
// 霊廟のマップ
// 農地のマップ
// ジャングルバレーのマップ
// ファンタズマゴリアのマップ
// 学院のマップ
// 密林のマップ
// 埠頭のマップ
// 灰の森のマップ
// 環礁のマップ
// 墓地のマップ
// 地底海のマップ
// 火口のマップ
// 珊瑚の遺跡のマップ
// 溶岩溜まりのマップ
// 邸宅のマップ
// 城壁のマップ
// 砂丘のマップ
// 遺骨安置所のマップ
// 地下河川のマップ
// 庭園のマップ
// アラクニドの巣のマップ
// バザールのマップ
// 研究所のマップ
// 害虫の谷のマップ
// 根に覆われた遺跡のマップ
// ヴァールピラミッドのマップ
// 晶洞のマップ
// 武器庫のマップ
// 中庭のマップ
// 泥の間欠泉のマップ
// 岸のマップ
// 熱帯の島のマップ
// 鉱泉のマップ
// 月の寺院のマップ
// 地下墓所のマップ
// 塔のマップ
// 汚水槽のマップ
// 高原のマップ
// 河口のマップ
// 金庫室のマップ
// 寺院のマップ
// 闘技場のマップ
// 博物館のマップ
// 写字室のマップ
// 包囲された街のマップ
// シンセシスのマップ
// 造船所のマップ
// 鐘楼のマップ
// アラクニドの墓のマップ
// 荒野のマップ
// 貧民街のマップ
// 湿原のマップ
// 桟橋のマップ
// 呪われた地下聖堂のマップ
// 果樹園のマップ
// 遊歩道のマップ
// 根城のマップ
// 列柱広場のマップ
// 原初の水溜まりのマップ
// 蜘蛛の森のマップ
// 入り江のマップ
// 水路のマップ
// 工場のマップ
// 台地のマップ
// 闘拳場のマップ
// 干上がった海のマップ
// 冒涜された大聖堂のマップ
// 山頂のマップ
// 根に覆われた神殿のマップ
// 城跡のマップ
// 水晶鉱山のマップ
// 別荘のマップ
// 原初の建築群のマップ
// 死者の都のマップ
// 競走路のマップ
// カルデラのマップ
// ゲットーのマップ
// 公園のマップ
// 奇形の体内のマップ
// テラスのマップ
// 神殿のマップ
// 兵器庫のマップ
// 砂漠の泉のマップ
// コアのマップ
// コロシアムのマップ
// 酸の洞窟のマップ
// 暗い森のマップ
// 深紅の寺院のマップ
// 広場のマップ
// 発掘現場のマップ
// 宮殿のマップ
// 溶岩湖のマップ
// 聖堂のマップ
// 水没都市のマップ
// 岩礁のマップ
// 死骸のマップ
// 淀みのマップ
// 茨の谷のマップ
// サイロのマップ
// キメラの闘拳場のマップ
// ヒュドラの巣のマップ
// ミノタウロスの迷宮のマップ
// フェニックスの鍛冶場のマップ
// シェイパーの領域
// ヴァールテンプルのマップ
// ハービンジャーのマップ
// 刻み込まれたアルティメイタム
// 聖域のマップ
// 城塞のマップ
// 要塞のマップ
// 醜態のマップ
// ジッグラトのマップ

// Mapの上に付いてる変なやつ
// 放置された鉄格子
// 恐怖の中心部
// 塹壕の空洞
// 禁断の深部
// 苦しむ墓所
// 混沌の泥沼
// 焼き付く束縛
// 寂れた土牢
// 刻まれた墓所
// 猛烈な深淵
// 呪われたジグラート
// 囁く領土
// 破壊された底
// 塹壕のアルコーブ
// 隠れた堅塁
// 荒れ狂う底
// 隠れた秘所
// 鉄の貯蔵所
// 夢の孤独
// 死の遺跡
// 亡霊の墓所
// 荒らされた営舎
// 痛みの大洞窟
// 有害な残骸
// 死の営舎
// 悪魔の聖所
// 鉄の回廊
// 拷問用の泥沼
// 狂気の深淵
// 宿命の営舎
// 不浄な名残
// 鋼鉄の大洞窟
// 混乱させる領土
// 地下の領域
// いびつな底
// 悪夢の墓所
// 冒涜されたジグラート
// みすぼらしい泥沼
// 難攻不落の檻
// 放置された暗部
// 策謀の根城
// 穢れた貯蔵所
// 囁く悪所
// 拷問用の沼地
// 籠城の天底
// 威嚇する巣窟
// 邪悪な根城
// 穢れた鉄格子
// いびつな独房
// 破壊された土牢
// 走り回る遺跡
// 狂気の掌握
// 隠された牢屋
// 憎悪の貯蔵所
// 死の巣窟
// 萎れさせる暗部
// 宿命の底
// 幽霊の悪所
// 呪われたアルコーブ
// 残酷な悪所
// 死の鉄格子
// 不安な営舎
// 誘惑的な底
// 生霊の営舎
// サイクロプスの沼地
// 宿命の悪所
// 地下の深淵
// 死の墓所
// 闇の悪所
// 狂気の根城
// 浪費された掌握
// 焼き付く檻
// 籠城の中心部
