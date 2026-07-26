// tools/extract_chart_mods.py によって自動生成されました (source: poe-db)
const chartModList = {
  "モンスターは#%の確率で元素系状態異常を無効化する": {
    "mod": "モンスターは#%の確率で元素系状態異常を無効化する",
    "engMod": "Monsters have #% chance to Avoid Elemental Ailments",
    "value": "80",
    "type": "Suffix",
    "weight": 700,
    "tier": 0,
    "engRegex": "ail",
    "Regex": "系状",
    "tradeStatIds": [
      "explicit.stat_322206271"
    ],
    "adjacent": false,
    "nameJa": "絶縁体の",
    "nameEn": "of Insulation",
    "map_item_drop_quantity_+%": 45,
    "map_item_drop_rarity_+%": 0,
    "map_pack_size_+%": 0,
    "map_deepwater_league_resource_found_+%": 0
  },
  "モンスターの物理ダメージ軽減率 +(##)%": {
    "mod": "モンスターの物理ダメージ軽減率 +(##)%",
    "engMod": "+(##)% Monster Physical Damage Reduction",
    "value": "21-35",
    "type": "Prefix",
    "weight": 1000,
    "tier": 0,
    "engRegex": "uct",
    "Regex": "ジ軽",
    "tradeStatIds": [
      "explicit.stat_839186746"
    ],
    "adjacent": false,
    "nameJa": "装甲付き",
    "nameEn": "Armoured",
    "map_item_drop_quantity_+%": 45,
    "map_item_drop_rarity_+%": 0,
    "map_pack_size_+%": 0,
    "map_deepwater_league_resource_found_+%": 0
  },
  "モンスターはスタンを受けることがない|モンスターのライフが(##)%上昇する": {
    "mod": "モンスターはスタンを受けることがない|モンスターのライフが(##)%上昇する",
    "engMod": "Monsters cannot be Stunned|(##)% more Monster Life",
    "value": "|10-20",
    "type": "Prefix",
    "weight": 700,
    "tier": 0,
    "engRegex": "r li",
    "Regex": "ンを受",
    "tradeStatIds": [
      "explicit.stat_1041951480",
      "explicit.stat_95249895"
    ],
    "adjacent": false,
    "nameJa": "揺るがぬ",
    "nameEn": "Unwavering",
    "map_item_drop_quantity_+%": 20,
    "map_item_drop_rarity_+%": 0,
    "map_pack_size_+%": 0,
    "map_deepwater_league_resource_found_+%": 0
  },
  "モンスターのライフが(##)%上昇する": {
    "mod": "モンスターのライフが(##)%上昇する",
    "engMod": "(##)% more Monster Life",
    "value": "46-60",
    "type": "Prefix",
    "weight": 1000,
    "tier": 0,
    "engRegex": "r li",
    "Regex": "フが.*上",
    "tradeStatIds": [
      "explicit.stat_95249895"
    ],
    "adjacent": false,
    "nameJa": "豊かな",
    "nameEn": "Fecund",
    "map_item_drop_quantity_+%": 45,
    "map_item_drop_rarity_+%": 0,
    "map_pack_size_+%": 0,
    "map_deepwater_league_resource_found_+%": 0
  },
  "モンスターのダメージが(##)%増加する": {
    "mod": "モンスターのダメージが(##)%増加する",
    "engMod": "(##)% increased Monster Damage",
    "value": "26-35",
    "type": "Prefix",
    "weight": 1000,
    "tier": 0,
    "engRegex": "r damage$",
    "Regex": "ターのダ.*増",
    "tradeStatIds": [
      "explicit.stat_1890519597"
    ],
    "adjacent": false,
    "nameJa": "獰猛な",
    "nameEn": "Savage",
    "map_item_drop_quantity_+%": 0,
    "map_item_drop_rarity_+%": 0,
    "map_pack_size_+%": 0,
    "map_deepwater_league_resource_found_+%": 45
  },
  "モンスターは物理ダメージの(##)%を追加火ダメージとして与える": {
    "mod": "モンスターは物理ダメージの(##)%を追加火ダメージとして与える",
    "engMod": "Monsters deal (##)% extra Physical Damage as Fire",
    "value": "21-35",
    "type": "Prefix",
    "weight": 700,
    "tier": 0,
    "engRegex": "fire$",
    "Regex": "加火",
    "tradeStatIds": [
      "explicit.stat_1497673356"
    ],
    "adjacent": false,
    "nameJa": "燃える",
    "nameEn": "Burning",
    "map_item_drop_quantity_+%": 0,
    "map_item_drop_rarity_+%": 30,
    "map_pack_size_+%": 0,
    "map_deepwater_league_resource_found_+%": 0
  },
  "モンスターは物理ダメージの(##)%を追加冷気ダメージとして与える": {
    "mod": "モンスターは物理ダメージの(##)%を追加冷気ダメージとして与える",
    "engMod": "Monsters deal (##)% extra Physical Damage as Cold",
    "value": "21-35",
    "type": "Prefix",
    "weight": 700,
    "tier": 0,
    "engRegex": "old$",
    "Regex": "加冷",
    "tradeStatIds": [
      "explicit.stat_3448216135"
    ],
    "adjacent": false,
    "nameJa": "凍りつく",
    "nameEn": "Freezing",
    "map_item_drop_quantity_+%": 0,
    "map_item_drop_rarity_+%": 30,
    "map_pack_size_+%": 0,
    "map_deepwater_league_resource_found_+%": 0
  },
  "モンスターは物理ダメージの(##)%を追加雷ダメージとして与える": {
    "mod": "モンスターは物理ダメージの(##)%を追加雷ダメージとして与える",
    "engMod": "Monsters deal (##)% extra Physical Damage as Lightning",
    "value": "21-35",
    "type": "Prefix",
    "weight": 700,
    "tier": 0,
    "engRegex": "as l",
    "Regex": "加雷",
    "tradeStatIds": [
      "explicit.stat_3416853625"
    ],
    "adjacent": false,
    "nameJa": "電撃の",
    "nameEn": "Shocking",
    "map_item_drop_quantity_+%": 0,
    "map_item_drop_rarity_+%": 30,
    "map_pack_size_+%": 0,
    "map_deepwater_league_resource_found_+%": 0
  },
  "モンスターの移動スピードが#%増加する|モンスターのアタックスピードが#%増加する|モンスターのキャストスピードが#%増加する": {
    "mod": "モンスターの移動スピードが#%増加する|モンスターのアタックスピードが#%増加する|モンスターのキャストスピードが#%増加する",
    "engMod": "#% increased Monster Movement Speed|#% increased Monster Attack Speed|#% increased Monster Cast Speed",
    "value": "30|30|30",
    "type": "Prefix",
    "weight": 300,
    "tier": 0,
    "engRegex": "r at",
    "Regex": "ーのキ",
    "tradeStatIds": [
      "explicit.stat_2306522833",
      "explicit.stat_1913583994",
      "explicit.stat_2488361432"
    ],
    "adjacent": false,
    "nameJa": "素早い",
    "nameEn": "Fleet",
    "map_item_drop_quantity_+%": 0,
    "map_item_drop_rarity_+%": 0,
    "map_pack_size_+%": 18,
    "map_deepwater_league_resource_found_+%": 0
  },
  "モンスターは投射物を追加で#個放つ": {
    "mod": "モンスターは投射物を追加で#個放つ",
    "engMod": "Monsters fire # additional Projectiles",
    "value": "2",
    "type": "Prefix",
    "weight": 300,
    "tier": 0,
    "engRegex": "oj",
    "Regex": "放つ",
    "tradeStatIds": [
      "explicit.stat_1309819744"
    ],
    "adjacent": false,
    "nameJa": "分裂する",
    "nameEn": "Splitting",
    "map_item_drop_quantity_+%": 0,
    "map_item_drop_rarity_+%": 0,
    "map_pack_size_+%": 18,
    "map_deepwater_league_resource_found_+%": 0
  },
  "モンスターの効果範囲が(##)%増加する": {
    "mod": "モンスターの効果範囲が(##)%増加する",
    "engMod": "Monsters have (##)% increased Area of Effect",
    "value": "46-60",
    "type": "Suffix",
    "weight": 700,
    "tier": 0,
    "engRegex": "e \\\\d+% increased ar",
    "Regex": "ターの効",
    "tradeStatIds": [
      "explicit.stat_1708461270"
    ],
    "adjacent": false,
    "nameJa": "巨人の",
    "nameEn": "of Giants",
    "map_item_drop_quantity_+%": 0,
    "map_item_drop_rarity_+%": 0,
    "map_pack_size_+%": 18,
    "map_deepwater_league_resource_found_+%": 0
  },
  "モンスターのクリティカル率が(##)%増加する|モンスターのクリティカルダメージ倍率 +(##)%": {
    "mod": "モンスターのクリティカル率が(##)%増加する|モンスターのクリティカルダメージ倍率 +(##)%",
    "engMod": "Monsters have (##)% increased Critical Strike Chance|+(##)% to Monster Critical Strike Multiplier",
    "value": "242-350|41-45",
    "type": "Suffix",
    "weight": 700,
    "tier": 0,
    "engRegex": "tip",
    "Regex": "ジ倍",
    "tradeStatIds": [
      "explicit.stat_2753083623",
      "explicit.stat_57326096"
    ],
    "adjacent": false,
    "nameJa": "危険の",
    "nameEn": "of Deadliness",
    "map_item_drop_quantity_+%": 0,
    "map_item_drop_rarity_+%": 0,
    "map_pack_size_+%": 18,
    "map_deepwater_league_resource_found_+%": 0
  },
  "エリアには冷却領域がまだらに存在する": {
    "mod": "エリアには冷却領域がまだらに存在する",
    "engMod": "Area has patches of Chilled Ground",
    "value": "",
    "type": "Suffix",
    "weight": 300,
    "tier": 0,
    "engRegex": "hil",
    "Regex": "は冷却",
    "tradeStatIds": [
      "explicit.stat_349586058"
    ],
    "adjacent": false,
    "nameJa": "氷雪の",
    "nameEn": "of Ice",
    "map_item_drop_quantity_+%": 0,
    "map_item_drop_rarity_+%": 0,
    "map_pack_size_+%": 0,
    "map_deepwater_league_resource_found_+%": 0
  },
  "エリアには感電領域がまだらに存在し受けるダメージを#%増加させる": {
    "mod": "エリアには感電領域がまだらに存在し受けるダメージを#%増加させる",
    "engMod": "Area has patches of Shocked Ground which increase Damage taken by #%",
    "value": "10",
    "type": "Suffix",
    "weight": 300,
    "tier": 0,
    "engRegex": "ked",
    "Regex": "電領",
    "tradeStatIds": [
      "explicit.stat_3246076198"
    ],
    "adjacent": false,
    "nameJa": "雷の",
    "nameEn": "of Lightning",
    "map_item_drop_quantity_+%": 0,
    "map_item_drop_rarity_+%": 0,
    "map_pack_size_+%": 0,
    "map_deepwater_league_resource_found_+%": 0
  },
  "モンスターがクリティカルストライクから受ける追加ダメージが(##)%減少する": {
    "mod": "モンスターがクリティカルストライクから受ける追加ダメージが(##)%減少する",
    "engMod": "Monsters take (##)% reduced Extra Damage from Critical Strikes",
    "value": "30-45",
    "type": "Suffix",
    "weight": 700,
    "tier": 0,
    "engRegex": "kes",
    "Regex": "クか",
    "tradeStatIds": [
      "explicit.stat_337935900"
    ],
    "adjacent": false,
    "nameJa": "頑健性の",
    "nameEn": "of Toughness",
    "map_item_drop_quantity_+%": 32,
    "map_item_drop_rarity_+%": 0,
    "map_pack_size_+%": 0,
    "map_deepwater_league_resource_found_+%": 0
  },
  "モンスターに対する呪いの効果が#%低下する": {
    "mod": "モンスターに対する呪いの効果が#%低下する",
    "engMod": "#% less effect of Curses on Monsters",
    "value": "50",
    "type": "Prefix",
    "weight": 300,
    "tier": 0,
    "engRegex": "rses",
    "Regex": "いの効",
    "tradeStatIds": [
      "explicit.stat_3796523155"
    ],
    "adjacent": false,
    "nameJa": "防呪された",
    "nameEn": "Hexwarded",
    "map_item_drop_quantity_+%": 32,
    "map_item_drop_rarity_+%": 0,
    "map_pack_size_+%": 0,
    "map_deepwater_league_resource_found_+%": 0
  },
  "モンスターのアクションスピードは基礎値よりも低く修正されることがない|モンスターの移動スピードは基礎値よりも低く修正されることがない|モンスターは挑発を受けることがない": {
    "mod": "モンスターのアクションスピードは基礎値よりも低く修正されることがない|モンスターの移動スピードは基礎値よりも低く修正されることがない|モンスターは挑発を受けることがない",
    "engMod": "Monsters' Action Speed cannot be modified to below Base Value|Monsters' Movement Speed cannot be modified to below Base Value|Monsters cannot be Taunted",
    "value": "||",
    "type": "Prefix",
    "weight": 300,
    "tier": 0,
    "engRegex": "elo",
    "Regex": "は挑",
    "tradeStatIds": [
      "explicit.stat_2758454849",
      "explicit.stat_777421120",
      "explicit.stat_1106651798"
    ],
    "adjacent": false,
    "nameJa": "止まらぬ",
    "nameEn": "Unstoppable",
    "map_item_drop_quantity_+%": 28,
    "map_item_drop_rarity_+%": 0,
    "map_pack_size_+%": 0,
    "map_deepwater_league_resource_found_+%": 0
  },
  "モンスターの混沌耐性 +(##)%|モンスターの元素耐性 +(##)%": {
    "mod": "モンスターの混沌耐性 +(##)%|モンスターの元素耐性 +(##)%",
    "engMod": "+(##)% Monster Chaos Resistance|+(##)% Monster Elemental Resistances",
    "value": "26-40|26-40",
    "type": "Prefix",
    "weight": 1000,
    "tier": 0,
    "engRegex": "r el",
    "Regex": "性 +",
    "tradeStatIds": [
      "explicit.stat_365540634",
      "explicit.stat_1054098949"
    ],
    "adjacent": false,
    "nameJa": "抵抗の",
    "nameEn": "Resistant",
    "map_item_drop_quantity_+%": 45,
    "map_item_drop_rarity_+%": 0,
    "map_pack_size_+%": 0,
    "map_deepwater_league_resource_found_+%": 0
  },
  "モンスターの元素耐性 +(##)%": {
    "mod": "モンスターの元素耐性 +(##)%",
    "engMod": "+(##)% Monster Elemental Resistances",
    "value": "5-10",
    "type": "Prefix",
    "weight": 1000,
    "tier": 0,
    "engRegex": "terE",
    "Regex": "ーの元",
    "tradeStatIds": [
      "explicit.stat_1054098949"
    ],
    "adjacent": false,
    "nameJa": "抵抗の",
    "nameEn": "Resistant",
    "map_item_drop_quantity_+%": 20,
    "map_item_drop_rarity_+%": 0,
    "map_pack_size_+%": 0,
    "map_deepwater_league_resource_found_+%": 0
  },
  "モンスターは#%の確率で毒、串刺しおよび出血を無効化する": {
    "mod": "モンスターは#%の確率で毒、串刺しおよび出血を無効化する",
    "engMod": "Monsters have a #% chance to avoid Poison, Impale, and Bleeding",
    "value": "40",
    "type": "Prefix",
    "weight": 300,
    "tier": 0,
    "engRegex": "on,",
    "Regex": "で毒、",
    "tradeStatIds": [
      "explicit.stat_144665660"
    ],
    "adjacent": false,
    "nameJa": "無効化する",
    "nameEn": "Impervious",
    "map_item_drop_quantity_+%": 28,
    "map_item_drop_rarity_+%": 0,
    "map_pack_size_+%": 0,
    "map_deepwater_league_resource_found_+%": 0
  },
  "モンスターはヒット時に毒を付与する": {
    "mod": "モンスターはヒット時に毒を付与する",
    "engMod": "Monsters Poison on Hit",
    "value": "",
    "type": "Suffix",
    "weight": 700,
    "tier": 0,
    "engRegex": "son o",
    "Regex": "に毒を",
    "tradeStatIds": [
      "explicit.stat_3350803563"
    ],
    "adjacent": false,
    "nameJa": "毒液の",
    "nameEn": "of Venom",
    "map_item_drop_quantity_+%": 0,
    "map_item_drop_rarity_+%": 0,
    "map_pack_size_+%": 0,
    "map_deepwater_league_resource_found_+%": 30
  },
  "モンスターのスキルは追加で#回連鎖する": {
    "mod": "モンスターのスキルは追加で#回連鎖する",
    "engMod": "Monsters' skills Chain # additional times",
    "value": "2",
    "type": "Prefix",
    "weight": 300,
    "tier": 0,
    "engRegex": "' s",
    "Regex": "連鎖す",
    "tradeStatIds": [
      "explicit.stat_3183973644"
    ],
    "adjacent": false,
    "nameJa": "連鎖する",
    "nameEn": "Chaining",
    "map_item_drop_quantity_+%": 0,
    "map_item_drop_rarity_+%": 0,
    "map_pack_size_+%": 0,
    "map_deepwater_league_resource_found_+%": 30
  },
  "モンスターはヘックスプルーフを持つ": {
    "mod": "モンスターはヘックスプルーフを持つ",
    "engMod": "Monsters are Hexproof",
    "value": "",
    "type": "Prefix",
    "weight": 300,
    "tier": 0,
    "engRegex": "re he",
    "Regex": "フを持",
    "tradeStatIds": [
      "explicit.stat_4154059009"
    ],
    "adjacent": false,
    "nameJa": "耐呪の",
    "nameEn": "Hexproof",
    "map_item_drop_quantity_+%": 0,
    "map_item_drop_rarity_+%": 0,
    "map_pack_size_+%": 0,
    "map_deepwater_league_resource_found_+%": 30
  },
  "モンスターはヒット時にフレンジーチャージを#個獲得する": {
    "mod": "モンスターはヒット時にフレンジーチャージを#個獲得する",
    "engMod": "Monsters gain a Frenzy Charge on Hit",
    "value": "",
    "type": "Suffix",
    "weight": 150,
    "tier": 0,
    "engRegex": "mum f",
    "Regex": "にフレ",
    "tradeStatIds": [
      "explicit.stat_1742567045"
    ],
    "adjacent": false,
    "nameJa": "狂乱の",
    "nameEn": "of Frenzy",
    "map_item_drop_quantity_+%": 0,
    "map_item_drop_rarity_+%": 0,
    "map_pack_size_+%": 0,
    "map_deepwater_league_resource_found_+%": 0
  },
  "モンスターはヒット時に#%の確率でフレンジーチャージを#個獲得する": {
    "mod": "モンスターはヒット時に#%の確率でフレンジーチャージを#個獲得する",
    "engMod": "Monsters have #% chance to gain a Frenzy Charge on Hit",
    "value": "50",
    "type": "Suffix",
    "weight": 150,
    "tier": 0,
    "engRegex": "avec",
    "Regex": "ヒット",
    "tradeStatIds": [
      "explicit.stat_1742567045"
    ],
    "adjacent": false,
    "nameJa": "狂乱の",
    "nameEn": "of Frenzy",
    "map_item_drop_quantity_+%": 0,
    "map_item_drop_rarity_+%": 0,
    "map_pack_size_+%": 0,
    "map_deepwater_league_resource_found_+%": 0
  },
  "モンスターはヒット時にエンデュランスチャージを#個獲得する": {
    "mod": "モンスターはヒット時にエンデュランスチャージを#個獲得する",
    "engMod": "Monsters gain an Endurance Charge on Hit",
    "value": "",
    "type": "Suffix",
    "weight": 150,
    "tier": 0,
    "engRegex": "e charge o",
    "Regex": "にエ",
    "tradeStatIds": [
      "explicit.stat_687813731"
    ],
    "adjacent": false,
    "nameJa": "耐久力の",
    "nameEn": "of Endurance",
    "map_item_drop_quantity_+%": 0,
    "map_item_drop_rarity_+%": 0,
    "map_pack_size_+%": 0,
    "map_deepwater_league_resource_found_+%": 0
  },
  "モンスターはヒット時に#%の確率でエンデュランスチャージを#個獲得する": {
    "mod": "モンスターはヒット時に#%の確率でエンデュランスチャージを#個獲得する",
    "engMod": "Monsters have #% chance to gain an Endurance Charge on Hit",
    "value": "50",
    "type": "Suffix",
    "weight": 150,
    "tier": 0,
    "engRegex": "vech",
    "Regex": "ト時に",
    "tradeStatIds": [
      "explicit.stat_687813731"
    ],
    "adjacent": false,
    "nameJa": "耐久力の",
    "nameEn": "of Endurance",
    "map_item_drop_quantity_+%": 0,
    "map_item_drop_rarity_+%": 0,
    "map_pack_size_+%": 0,
    "map_deepwater_league_resource_found_+%": 0
  },
  "モンスターはヒット時にパワーチャージを#個獲得する": {
    "mod": "モンスターはヒット時にパワーチャージを#個獲得する",
    "engMod": "Monsters gain a Power Charge on Hit",
    "value": "",
    "type": "Suffix",
    "weight": 150,
    "tier": 0,
    "engRegex": "mum p",
    "Regex": "パ.*時",
    "tradeStatIds": [
      "explicit.stat_406353061"
    ],
    "adjacent": false,
    "nameJa": "力強さの",
    "nameEn": "of Power",
    "map_item_drop_quantity_+%": 0,
    "map_item_drop_rarity_+%": 0,
    "map_pack_size_+%": 0,
    "map_deepwater_league_resource_found_+%": 0
  },
  "モンスターはヒット時に#%の確率でパワーチャージを#個獲得する": {
    "mod": "モンスターはヒット時に#%の確率でパワーチャージを#個獲得する",
    "engMod": "Monsters have #% chance to gain a Power Charge on Hit",
    "value": "50",
    "type": "Suffix",
    "weight": 150,
    "tier": 0,
    "engRegex": "echa",
    "Regex": "時にの",
    "tradeStatIds": [
      "explicit.stat_406353061"
    ],
    "adjacent": false,
    "nameJa": "力強さの",
    "nameEn": "of Power",
    "map_item_drop_quantity_+%": 0,
    "map_item_drop_rarity_+%": 0,
    "map_pack_size_+%": 0,
    "map_deepwater_league_resource_found_+%": 0
  },
  "モンスターのスペルダメージ抑制確率 +#%": {
    "mod": "モンスターのスペルダメージ抑制確率 +#%",
    "engMod": "Monsters have +#% chance to Suppress Spell Damage",
    "value": "80",
    "type": "Prefix",
    "weight": 700,
    "tier": 0,
    "engRegex": "o su",
    "Regex": "ジ抑",
    "tradeStatIds": [
      "explicit.stat_2138205941"
    ],
    "adjacent": false,
    "nameJa": "抑圧する",
    "nameEn": "Oppressive",
    "map_item_drop_quantity_+%": 45,
    "map_item_drop_rarity_+%": 0,
    "map_pack_size_+%": 0,
    "map_deepwater_league_resource_found_+%": 0
  },
  "モンスターは最大ライフの(##)%を追加最大エナジーシールドとして獲得する": {
    "mod": "モンスターは最大ライフの(##)%を追加最大エナジーシールドとして獲得する",
    "engMod": "Monsters gain (##)% of Maximum Life as Extra Maximum Energy Shield",
    "value": "51-80",
    "type": "Prefix",
    "weight": 1000,
    "tier": 0,
    "engRegex": "m li",
    "Regex": "加最",
    "tradeStatIds": [
      "explicit.stat_2887760183"
    ],
    "adjacent": false,
    "nameJa": "緩衝された",
    "nameEn": "Buffered",
    "map_item_drop_quantity_+%": 45,
    "map_item_drop_rarity_+%": 0,
    "map_pack_size_+%": 0,
    "map_deepwater_league_resource_found_+%": 0
  },
  "モンスターはヒット時に盲目を付与する": {
    "mod": "モンスターはヒット時に盲目を付与する",
    "engMod": "Monsters Blind on Hit",
    "value": "",
    "type": "Suffix",
    "weight": 700,
    "tier": 0,
    "engRegex": "s bli",
    "Regex": "に盲",
    "tradeStatIds": [
      "explicit.stat_1629869774"
    ],
    "adjacent": false,
    "nameJa": "盲目化の",
    "nameEn": "of Blinding",
    "map_item_drop_quantity_+%": 0,
    "map_item_drop_rarity_+%": 0,
    "map_pack_size_+%": 0,
    "map_deepwater_league_resource_found_+%": 30
  },
  "モンスターはアタックによるヒット時に重傷を付与する": {
    "mod": "モンスターはアタックによるヒット時に重傷を付与する",
    "engMod": "Monsters Maim on Hit with Attacks",
    "value": "",
    "type": "Suffix",
    "weight": 700,
    "tier": 0,
    "engRegex": "aim",
    "Regex": "に重",
    "tradeStatIds": [
      "explicit.stat_4164174520"
    ],
    "adjacent": false,
    "nameJa": "虐殺の",
    "nameEn": "of Carnage",
    "map_item_drop_quantity_+%": 0,
    "map_item_drop_rarity_+%": 0,
    "map_pack_size_+%": 0,
    "map_deepwater_league_resource_found_+%": 30
  },
  "モンスターはスペルによるヒット時に阻害を付与する": {
    "mod": "モンスターはスペルによるヒット時に阻害を付与する",
    "engMod": "Monsters Hinder on Hit with Spells",
    "value": "",
    "type": "Suffix",
    "weight": 700,
    "tier": 0,
    "engRegex": "hind",
    "Regex": "に阻",
    "tradeStatIds": [
      "explicit.stat_962720646"
    ],
    "adjacent": false,
    "nameJa": "妨げの",
    "nameEn": "of Impedance",
    "map_item_drop_quantity_+%": 0,
    "map_item_drop_rarity_+%": 0,
    "map_pack_size_+%": 0,
    "map_deepwater_league_resource_found_+%": 30
  },
  "モンスターのダメージは(##)%の元素耐性を貫通する": {
    "mod": "モンスターのダメージは(##)%の元素耐性を貫通する",
    "engMod": "Monster Damage Penetrates (##)% Elemental Resistances",
    "value": "13-15",
    "type": "Suffix",
    "weight": 150,
    "tier": 0,
    "engRegex": "net",
    "Regex": "通す",
    "tradeStatIds": [
      "explicit.stat_1898978455"
    ],
    "adjacent": false,
    "nameJa": "貫通の",
    "nameEn": "of Penetration",
    "map_item_drop_quantity_+%": 0,
    "map_item_drop_rarity_+%": 0,
    "map_pack_size_+%": 18,
    "map_deepwater_league_resource_found_+%": 0
  },
  "モンスターはヒット時にパワーチャージ、フレンジーチャージおよびエンデュランスチャージのスタックを盗む": {
    "mod": "モンスターはヒット時にパワーチャージ、フレンジーチャージおよびエンデュランスチャージのスタックを盗む",
    "engMod": "Monsters steal Power, Frenzy and Endurance charges on Hit",
    "value": "",
    "type": "Suffix",
    "weight": 300,
    "tier": 0,
    "engRegex": "er,",
    "Regex": "盗む",
    "tradeStatIds": [
      "explicit.stat_3222482040"
    ],
    "adjacent": false,
    "nameJa": "吸い上げの",
    "nameEn": "of Siphoning",
    "map_item_drop_quantity_+%": 0,
    "map_item_drop_rarity_+%": 0,
    "map_pack_size_+%": 0,
    "map_deepwater_league_resource_found_+%": 30
  },
  "プレイヤーの全ての耐性の最大値 -(##)%": {
    "mod": "プレイヤーの全ての耐性の最大値 -(##)%",
    "engMod": "Players have -(##)% to all maximum Resistances",
    "value": "12-14",
    "type": "Suffix",
    "weight": 300,
    "tier": 0,
    "engRegex": "o al",
    "Regex": "性の最",
    "tradeStatIds": [
      "explicit.stat_3376488707"
    ],
    "adjacent": false,
    "nameJa": "暴露の",
    "nameEn": "of Exposure",
    "map_item_drop_quantity_+%": 0,
    "map_item_drop_rarity_+%": 0,
    "map_pack_size_+%": 18,
    "map_deepwater_league_resource_found_+%": 0
  },
  "モンスターはその物理ダメージの(##)%を追加混沌ダメージとして獲得する|モンスターによるヒット時に衰弱を#秒間付与する": {
    "mod": "モンスターはその物理ダメージの(##)%を追加混沌ダメージとして獲得する|モンスターによるヒット時に衰弱を#秒間付与する",
    "engMod": "Monsters gain (##)% of their Physical Damage as Extra Chaos Damage|Monsters Inflict Withered for # seconds on Hit",
    "value": "21-29|2",
    "type": "Prefix",
    "weight": 300,
    "tier": 0,
    "engRegex": "hered",
    "Regex": "に衰",
    "tradeStatIds": [
      "explicit.stat_1840747977",
      ""
    ],
    "adjacent": false,
    "nameJa": "冒涜的な",
    "nameEn": "Profane",
    "map_item_drop_quantity_+%": 0,
    "map_item_drop_rarity_+%": 0,
    "map_pack_size_+%": 0,
    "map_deepwater_league_resource_found_+%": 45
  },
  "(隣接) マジックモンスターの数が#%増加する": {
    "mod": "(隣接) マジックモンスターの数が#%増加する",
    "engMod": "(Adjacent) #% increased Magic Monsters",
    "value": "30",
    "type": "Adjacent",
    "weight": 1000,
    "tier": 0,
    "engRegex": "d mag",
    "Regex": "マ.*増",
    "tradeStatIds": [
      ""
    ],
    "adjacent": true,
    "nameJa": "",
    "nameEn": "",
    "map_item_drop_quantity_+%": 0,
    "map_item_drop_rarity_+%": 0,
    "map_pack_size_+%": 0,
    "map_deepwater_league_resource_found_+%": 0
  },
  "(隣接) レアモンスターの数が#%増加する": {
    "mod": "(隣接) レアモンスターの数が#%増加する",
    "engMod": "(Adjacent) #% increased number of Rare Monsters",
    "value": "30",
    "type": "Adjacent",
    "weight": 1000,
    "tier": 0,
    "engRegex": "nu",
    "Regex": "アモ.*数",
    "tradeStatIds": [
      ""
    ],
    "adjacent": true,
    "nameJa": "",
    "nameEn": "",
    "map_item_drop_quantity_+%": 0,
    "map_item_drop_rarity_+%": 0,
    "map_pack_size_+%": 0,
    "map_deepwater_league_resource_found_+%": 0
  },
  "(隣接) モンスターは一定確率で#体の原生林のウィスプにより強化されている": {
    "mod": "(隣接) モンスターは一定確率で#体の原生林のウィスプにより強化されている",
    "engMod": "(Adjacent) Monsters have a chance to be Empowered by # Wildwood Wisps",
    "value": "2000",
    "type": "Adjacent",
    "weight": 300,
    "tier": 0,
    "engRegex": "cent",
    "Regex": "ーは一",
    "tradeStatIds": [
      ""
    ],
    "adjacent": true,
    "nameJa": "",
    "nameEn": "",
    "map_item_drop_quantity_+%": 0,
    "map_item_drop_rarity_+%": 0,
    "map_pack_size_+%": 0,
    "map_deepwater_league_resource_found_+%": 0
  },
  "(隣接) アッツィリインフルエンス": {
    "mod": "(隣接) アッツィリインフルエンス",
    "engMod": "(Adjacent) Atziri's Influence",
    "value": "",
    "type": "Adjacent",
    "weight": 100,
    "tier": 0,
    "engRegex": "entA",
    "Regex": "アッツ",
    "tradeStatIds": [
      ""
    ],
    "adjacent": true,
    "nameJa": "",
    "nameEn": "",
    "map_item_drop_quantity_+%": 0,
    "map_item_drop_rarity_+%": 0,
    "map_pack_size_+%": 0,
    "map_deepwater_league_resource_found_+%": 0
  },
  "(隣接) エリアには奇妙な樽のクラスターが追加で(##)個出現する": {
    "mod": "(隣接) エリアには奇妙な樽のクラスターが追加で(##)個出現する",
    "engMod": "(Adjacent) Area contains (##) additional Clusters of Mysterious Barrels",
    "value": "12-15",
    "type": "Adjacent",
    "weight": 700,
    "tier": 0,
    "engRegex": "ntAr",
    "Regex": "アには",
    "tradeStatIds": [
      ""
    ],
    "adjacent": true,
    "nameJa": "",
    "nameEn": "",
    "map_item_drop_quantity_+%": 0,
    "map_item_drop_rarity_+%": 0,
    "map_pack_size_+%": 0,
    "map_deepwater_league_resource_found_+%": 0
  },
  "(隣接) ドロップしたアイテムは#%の確率でフラクチャーされている": {
    "mod": "(隣接) ドロップしたアイテムは#%の確率でフラクチャーされている",
    "engMod": "(Adjacent) [DNT] Dropped items have #% chance to be Fractured",
    "value": "2",
    "type": "Adjacent",
    "weight": 100,
    "tier": 0,
    "engRegex": "ent[",
    "Regex": "ドロッ",
    "tradeStatIds": [
      ""
    ],
    "adjacent": true,
    "nameJa": "",
    "nameEn": "",
    "map_item_drop_quantity_+%": 0,
    "map_item_drop_rarity_+%": 0,
    "map_pack_size_+%": 0,
    "map_deepwater_league_resource_found_+%": 0
  },
  "(隣接) エリアのレアモンスターは#%の確率で憑依されている": {
    "mod": "(隣接) エリアのレアモンスターは#%の確率で憑依されている",
    "engMod": "(Adjacent) #% chance for Rare Monsters in Area to be Possessed",
    "value": "100",
    "type": "Adjacent",
    "weight": 50,
    "tier": 0,
    "engRegex": "entc",
    "Regex": "リアの",
    "tradeStatIds": [
      ""
    ],
    "adjacent": true,
    "nameJa": "",
    "nameEn": "",
    "map_item_drop_quantity_+%": 0,
    "map_item_drop_rarity_+%": 0,
    "map_pack_size_+%": 0,
    "map_deepwater_league_resource_found_+%": 0
  },
  "(隣接) #%の確率でレアモンスターは死亡時にフラクチャー化する": {
    "mod": "(隣接) #%の確率でレアモンスターは死亡時にフラクチャー化する",
    "engMod": "(Adjacent) #% chance for Rare Monsters to Fracture on death",
    "value": "50",
    "type": "Adjacent",
    "weight": 50,
    "tier": 0,
    "engRegex": "fra",
    "Regex": "亡時",
    "tradeStatIds": [
      ""
    ],
    "adjacent": true,
    "nameJa": "",
    "nameEn": "",
    "map_item_drop_quantity_+%": 0,
    "map_item_drop_rarity_+%": 0,
    "map_pack_size_+%": 0,
    "map_deepwater_league_resource_found_+%": 0
  }
};
