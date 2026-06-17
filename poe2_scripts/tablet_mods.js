// tools_poe2/extract_tablet_mods.py によって自動生成されました (PoE2-DB)
const tabletModList = {
  "モンスターのエフェクティブが(##)%増加する": {
    "mod": "モンスターのエフェクティブが(##)%増加する",
    "engMod": "Monsters have (##)% increased Effectiveness",
    "value": "10-15",
    "type": "Prefix",
    "engRegex": "eness$",
    "Regex": "ーのエ",
    "groups": [
      "MapMonsterEffectiveness"
    ],
    "subGroups": [
      "Map"
    ],
    "domain": "tablet"
  },
  "マップで見つかるアイテムのレアリティが(##)%増加する": {
    "mod": "マップで見つかるアイテムのレアリティが(##)%増加する",
    "engMod": "(##)% increased Rarity of Items found in Map",
    "value": "8-12",
    "type": "Prefix",
    "engRegex": "Ra.*fou",
    "Regex": "かるアイテムのレ",
    "groups": [
      "MapDroppedItemRarityIncrease"
    ],
    "subGroups": [
      "Map"
    ],
    "domain": "tablet"
  },
  "マップのパックサイズが(##)%増加する": {
    "mod": "マップのパックサイズが(##)%増加する",
    "engMod": "(##)% increased Pack Size in Map",
    "value": "5-7",
    "type": "Prefix",
    "engRegex": "ze i",
    "Regex": "プのパ",
    "groups": [
      "MapPackSizeIncrease"
    ],
    "subGroups": [
      "Map"
    ],
    "domain": "tablet"
  },
  "マップのマジックモンスターが(##)%増加する": {
    "mod": "マップのマジックモンスターが(##)%増加する",
    "engMod": "Map has (##)% increased Magic Monsters",
    "value": "30-40",
    "type": "Prefix",
    "engRegex": "c m",
    "Regex": "のマジ",
    "groups": [
      "MapMagicPackIncrease"
    ],
    "subGroups": [
      "Map"
    ],
    "domain": "tablet"
  },
  "マップのレアモンスターの数が(##)%増加する": {
    "mod": "マップのレアモンスターの数が(##)%増加する",
    "engMod": "Map has (##)% increased number of Rare Monsters",
    "value": "25-35",
    "type": "Prefix",
    "engRegex": "ha.*nu",
    "Regex": "アモンスターの",
    "groups": [
      "MapRarePackIncrease"
    ],
    "subGroups": [
      "Map"
    ],
    "domain": "tablet"
  },
  "マップのモンスターレアリティが(##)%増加する": {
    "mod": "マップのモンスターレアリティが(##)%増加する",
    "engMod": "Map has (##)% increased Monster Rarity",
    "value": "15-20",
    "type": "Prefix",
    "engRegex": "rity$",
    "Regex": "ーレ",
    "groups": [
      "MapMonsterRarityIncrease"
    ],
    "subGroups": [
      "Map"
    ],
    "domain": "tablet"
  },
  "マップで見つかるゴールドが(##)%増加する": {
    "mod": "マップで見つかるゴールドが(##)%増加する",
    "engMod": "(##)% increased Gold found in Map",
    "value": "25-35",
    "type": "Prefix",
    "engRegex": "go",
    "Regex": "るゴ",
    "groups": [
      "MapDroppedGoldIncrease"
    ],
    "subGroups": [
      "Map"
    ],
    "domain": "tablet"
  },
  "マップでの獲得経験値が(##)%増加する": {
    "mod": "マップでの獲得経験値が(##)%増加する",
    "engMod": "(##)% increased Experience gain in Map",
    "value": "12-18",
    "type": "Prefix",
    "engRegex": "e g",
    "Regex": "の獲",
    "groups": [
      "MapExperienceGainIncrease"
    ],
    "subGroups": [
      "Map"
    ],
    "domain": "tablet"
  },
  "マップにレアのチェストが追加で(##)個出現する": {
    "mod": "マップにレアのチェストが追加で(##)個出現する",
    "engMod": "Map contains (##) additional Rare Chests",
    "value": "2-3",
    "type": "Prefix",
    "engRegex": "sts$",
    "Regex": "にレ",
    "groups": [
      "MapAdditionalChests"
    ],
    "subGroups": [
      "Map"
    ],
    "domain": "tablet"
  },
  "マップで見つかるウェイストーンの数量が(##)%増加する": {
    "mod": "マップで見つかるウェイストーンの数量が(##)%増加する",
    "engMod": "(##)% increased Quantity of Waystones found in Map",
    "value": "30-40",
    "type": "Suffix",
    "engRegex": "es f",
    "Regex": "かるウ",
    "groups": [
      "MapDroppedMapsIncrease"
    ],
    "subGroups": [
      "Map"
    ],
    "domain": "tablet"
  },
  "マップのレアモンスターは(##)%の超過可能確率でモッドを追加で#個持つ": {
    "mod": "マップのレアモンスターは(##)%の超過可能確率でモッドを追加で#個持つ",
    "engMod": "Rare Monsters in Map have a (##)% Surpassing chance to have an additional Modifier",
    "value": "50-80",
    "type": "Suffix",
    "engRegex": "Sur",
    "Regex": "の超",
    "groups": [
      "MapRareMonstersAdditionalModifier"
    ],
    "subGroups": [
      "Map"
    ],
    "domain": "tablet"
  },
  "マップにシュラインが出現する確率が(##)%増加する": {
    "mod": "マップにシュラインが出現する確率が(##)%増加する",
    "engMod": "Map has (##)% increased chance to contain Shrines",
    "value": "70-100",
    "type": "Suffix",
    "engRegex": "n sh",
    "Regex": "ンが出",
    "groups": [
      "MapAdditionalShrine"
    ],
    "subGroups": [
      "Map"
    ],
    "domain": "tablet"
  },
  "マップにシュラインが追加で#個出現する": {
    "mod": "マップにシュラインが追加で#個出現する",
    "engMod": "Map contains an additional Shrine",
    "value": "1|0|0",
    "type": "Suffix",
    "engRegex": "an.*al Sh",
    "Regex": "インが追",
    "groups": [
      "MapAdditionalShrine"
    ],
    "subGroups": [
      "Map"
    ],
    "domain": "tablet"
  },
  "マップにストロングボックスが出現する確率が(##)%増加する": {
    "mod": "マップにストロングボックスが出現する確率が(##)%増加する",
    "engMod": "Map has (##)% increased chance to contain Strongboxes",
    "value": "70-100",
    "type": "Suffix",
    "engRegex": "in st",
    "Regex": "クスが出",
    "groups": [
      "MapAdditionalStrongbox"
    ],
    "subGroups": [
      "Map"
    ],
    "domain": "tablet"
  },
  "マップにストロングボックスが追加で#個出現する": {
    "mod": "マップにストロングボックスが追加で#個出現する",
    "engMod": "Map contains an additional Strongbox",
    "value": "1|0|0",
    "type": "Suffix",
    "engRegex": "an.*al St",
    "Regex": "クスが追",
    "groups": [
      "MapAdditionalStrongbox"
    ],
    "subGroups": [
      "Map"
    ],
    "domain": "tablet"
  },
  "マップにエッセンスが出現する確率が(##)%増加する": {
    "mod": "マップにエッセンスが出現する確率が(##)%増加する",
    "engMod": "Map has (##)% increased chance to contain Essences",
    "value": "70-100",
    "type": "Suffix",
    "engRegex": "in e",
    "Regex": "ンスが出",
    "groups": [
      "MapAdditionalEssence"
    ],
    "subGroups": [
      "Map"
    ],
    "domain": "tablet"
  },
  "マップにエッセンスが追加で#個出現する": {
    "mod": "マップにエッセンスが追加で#個出現する",
    "engMod": "Map contains an additional Essence",
    "value": "1|0|0",
    "type": "Prefix",
    "engRegex": "an.*al Es",
    "Regex": "ンスが追",
    "groups": [
      "MapAdditionalEssence"
    ],
    "subGroups": [
      "Map"
    ],
    "domain": "tablet"
  },
  "マップにアズメリの精霊が出現する確率が(##)%増加する": {
    "mod": "マップにアズメリの精霊が出現する確率が(##)%増加する",
    "engMod": "Map has (##)% increased chance to contain Azmeri Spirits",
    "value": "70-100",
    "type": "Suffix",
    "engRegex": "n az",
    "Regex": "霊が出",
    "groups": [
      "MapAdditionalSpirit"
    ],
    "subGroups": [
      "Map"
    ],
    "domain": "tablet"
  },
  "マップにアズメリの精霊が追加で#体出現する": {
    "mod": "マップにアズメリの精霊が追加で#体出現する",
    "engMod": "Map contains # additional Azmeri Spirit",
    "value": "1|0|0",
    "type": "Prefix",
    "engRegex": "it$",
    "Regex": "体出",
    "groups": [
      "MapAdditionalAzmeriWisp"
    ],
    "subGroups": [
      "Map"
    ],
    "domain": "tablet"
  },
  "マップにローグエグザイルが出現する確率が(##)%増加する": {
    "mod": "マップにローグエグザイルが出現する確率が(##)%増加する",
    "engMod": "Map has (##)% increased chance to contain Rogue Exiles",
    "value": "70-100",
    "type": "Suffix",
    "engRegex": "iles",
    "Regex": "イルが出",
    "groups": [
      "MapAdditionalExile"
    ],
    "subGroups": [
      "Map"
    ],
    "domain": "tablet"
  },
  "マップにローグエグザイルが追加で#体生息している": {
    "mod": "マップにローグエグザイルが追加で#体生息している",
    "engMod": "Map is inhabited by # additional Rogue Exile",
    "value": "1|0|0",
    "type": "Prefix",
    "engRegex": "nh",
    "Regex": "体生",
    "groups": [
      "MapAdditionalExile"
    ],
    "subGroups": [
      "Map"
    ],
    "domain": "tablet"
  },
  "マップにサモ二ングサークルが追加で#個出現する": {
    "mod": "マップにサモ二ングサークルが追加で#個出現する",
    "engMod": "Map contains an additional Summoning Circle",
    "value": "1",
    "type": "Prefix",
    "engRegex": "l su",
    "Regex": "モ二",
    "groups": [
      "MapAdditionalStoneCircle"
    ],
    "subGroups": [
      "Map"
    ],
    "domain": "tablet"
  },
  "マップにサモニングサークルが出現する確率が(##)%増加する": {
    "mod": "マップにサモニングサークルが出現する確率が(##)%増加する",
    "engMod": "Map has (##)% increased chance to contain a Summoning Circle",
    "value": "70-100",
    "type": "Suffix",
    "engRegex": "a s",
    "Regex": "モニ",
    "groups": [
      "MapAdditionalStoneCircle"
    ],
    "subGroups": [
      "Map"
    ],
    "domain": "tablet"
  },
  "マップはランダムなモッドを追加で(##)個持つ": {
    "mod": "マップはランダムなモッドを追加で(##)個持つ",
    "engMod": "Map has (##) additional random Modifiers",
    "value": "1-2",
    "type": "Suffix",
    "engRegex": "ndo",
    "Regex": "ラン",
    "groups": [
      "MapAdditionalModifier"
    ],
    "subGroups": [
      "Map"
    ],
    "domain": "tablet"
  },
  "ユニークモンスターはレアモッドを追加で#個持つ": {
    "mod": "ユニークモンスターはレアモッドを追加で#個持つ",
    "engMod": "Unique Monsters have # additional Rare Modifier",
    "value": "1",
    "type": "Suffix",
    "engRegex": "^uni",
    "Regex": "ーはレ",
    "groups": [
      "MapAdditionalUniqueMonsterModifier"
    ],
    "subGroups": [
      "Map"
    ],
    "domain": "tablet"
  },
  "マップで見つかるハイヴブラッドの数量が(##)%増加する": {
    "mod": "マップで見つかるハイヴブラッドの数量が(##)%増加する",
    "engMod": "(##)% increased Quantity of Hiveblood found in Map",
    "value": "30-60",
    "type": "Suffix",
    "engRegex": "f Hiv",
    "Regex": "ドの数",
    "groups": [
      "BreachHivebloodQuantity"
    ],
    "subGroups": [
      "Breach"
    ],
    "domain": "tablet"
  },
  "マップで見つかる母胎ギフトの数量が(##)%増加する": {
    "mod": "マップで見つかる母胎ギフトの数量が(##)%増加する",
    "engMod": "(##)% increased Quantity of Wombgifts found in Map",
    "value": "30-60",
    "type": "Suffix",
    "engRegex": "ts f",
    "Regex": "る母",
    "groups": [
      "BreachWombgiftQuantity"
    ],
    "subGroups": [
      "Breach"
    ],
    "domain": "tablet"
  },
  "マップの母胎ギフトは(##)%の確率で1レベル高いものがドロップする": {
    "mod": "マップの母胎ギフトは(##)%の確率で1レベル高いものがドロップする",
    "engMod": "Wombgifts have (##)% chance to drop one Level higher in Map",
    "value": "10-30",
    "type": "Suffix",
    "engRegex": "^wo",
    "Regex": "プの母",
    "groups": [
      "BreachWombgiftLevelChance"
    ],
    "subGroups": [
      "Breach"
    ],
    "domain": "tablet"
  },
  "マップの不安定なブリーチにゼシュトの元帥、ヴルーンが出現する確率が(##)%増加する": {
    "mod": "マップの不安定なブリーチにゼシュトの元帥、ヴルーンが出現する確率が(##)%増加する",
    "engMod": "Unstable Breaches in Map have (##)% increased chance to contain Vruun, Marshal of Xesht",
    "value": "20-50",
    "type": "Suffix",
    "engRegex": "vru",
    "Regex": "チにゼ",
    "groups": [
      "BreachBossChance"
    ],
    "subGroups": [
      "Breach"
    ],
    "domain": "tablet"
  },
  "マップの不安定なブリーチは安定化した後レアモンスターが追加で(##)体スポーンする": {
    "mod": "マップの不安定なブリーチは安定化した後レアモンスターが追加で(##)体スポーンする",
    "engMod": "Unstable Breaches in Map spawn (##) additional Rare Monsters when Stabilised",
    "value": "1-3",
    "type": "Suffix",
    "engRegex": "en S",
    "Regex": "チは安",
    "groups": [
      "BreachAdditionalRares"
    ],
    "subGroups": [
      "Breach"
    ],
    "domain": "tablet"
  },
  "マップに出現するレアブリーチモンスターのエフェクティブが(##)%増加する": {
    "mod": "マップに出現するレアブリーチモンスターのエフェクティブが(##)%増加する",
    "engMod": "(##)% increased Effectiveness of Rare Breach Monsters in Map",
    "value": "5-20",
    "type": "Suffix",
    "engRegex": "h m",
    "Regex": "レアブ",
    "groups": [
      "BreachRareMonsterPotency"
    ],
    "subGroups": [
      "Breach"
    ],
    "domain": "tablet"
  },
  "マップのブリーチのパックサイズが(##)%増加する": {
    "mod": "マップのブリーチのパックサイズが(##)%増加する",
    "engMod": "Breaches in Map have (##)% increased Pack Size",
    "value": "5-15",
    "type": "Suffix",
    "engRegex": "Br.*k S",
    "Regex": "チのパ",
    "groups": [
      "BreachMonsterQuantity"
    ],
    "subGroups": [
      "Breach"
    ],
    "domain": "tablet"
  },
  "マップでモンスターがドロップするエクスペディションアーティファクトの数量が(##)%増加する": {
    "mod": "マップでモンスターがドロップするエクスペディションアーティファクトの数量が(##)%増加する",
    "engMod": "(##)% increased quantity of Expedition Artifacts dropped by Monsters in Map",
    "value": "15-30",
    "type": "Suffix",
    "engRegex": "rti",
    "Regex": "ンア",
    "groups": [
      "ExpeditionArtifactIncrease"
    ],
    "subGroups": [
      "Expedition"
    ],
    "domain": "tablet"
  },
  "マップでエクスペディションの爆発物の設置範囲が(##)%増加する": {
    "mod": "マップでエクスペディションの爆発物の設置範囲が(##)%増加する",
    "engMod": "(##)% increased Expedition Explosive Placement Range in Map",
    "value": "15-30",
    "type": "Suffix",
    "engRegex": "pla",
    "Regex": "の設",
    "groups": [
      "ExpeditionExplosionPlacement"
    ],
    "subGroups": [
      "Expedition"
    ],
    "domain": "tablet"
  },
  "マップのエクスペディションのレムナントが+(##)個される": {
    "mod": "マップのエクスペディションのレムナントが+(##)個される",
    "engMod": "Expeditions in Map have +(##) Remnants",
    "value": "1-2",
    "type": "Suffix",
    "engRegex": "tions",
    "Regex": "個さ",
    "groups": [
      "ExpeditionRelicIncrease"
    ],
    "subGroups": [
      "Expedition"
    ],
    "domain": "tablet"
  },
  "マップでエクスペディションの爆発物の半径が(##)%増加する": {
    "mod": "マップでエクスペディションの爆発物の半径が(##)%増加する",
    "engMod": "(##)% increased Expedition Explosive Radius in Map",
    "value": "15-30",
    "type": "Suffix",
    "engRegex": "diu",
    "Regex": "半径",
    "groups": [
      "ExpeditionExplosionRadius"
    ],
    "subGroups": [
      "Expedition"
    ],
    "domain": "tablet"
  },
  "マップでルーニックモンスターがドロップするエクスペディションログブックの数量が(##)%増加する": {
    "mod": "マップでルーニックモンスターがドロップするエクスペディションログブックの数量が(##)%増加する",
    "engMod": "(##)% increased Quantity of Expedition Logbooks dropped by Runic Monsters in Map",
    "value": "15-30",
    "type": "Suffix",
    "engRegex": "Log",
    "Regex": "でル",
    "groups": [
      "ExpeditionLogbookIncrease"
    ],
    "subGroups": [
      "Expedition"
    ],
    "domain": "tablet"
  },
  "マップのレア エクスペディションモンスターの数が(##)%増加する": {
    "mod": "マップのレア エクスペディションモンスターの数が(##)%増加する",
    "engMod": "(##)% increased number of Rare Expedition Monsters in Map",
    "value": "25-40",
    "type": "Suffix",
    "engRegex": "re e",
    "Regex": "レア エク",
    "groups": [
      "ExpeditionRareMonsters"
    ],
    "subGroups": [
      "Expedition"
    ],
    "domain": "tablet"
  },
  "マップのエクスペディションのレムナントの効果が(##)%増加する": {
    "mod": "マップのエクスペディションのレムナントの効果が(##)%増加する",
    "engMod": "(##)% increased Effect of Expedition Remnants in Map",
    "value": "12-18",
    "type": "Suffix",
    "engRegex": "t o",
    "Regex": "の効",
    "groups": [
      "ExpeditionRelicModEffect"
    ],
    "subGroups": [
      "Expedition"
    ],
    "domain": "tablet"
  },
  "マップに出現するルーニックモンスターマーカーの数が(##)%増加する": {
    "mod": "マップに出現するルーニックモンスターマーカーの数が(##)%増加する",
    "engMod": "Map contains (##)% increased number of Runic Monster Markers",
    "value": "15-30",
    "type": "Suffix",
    "engRegex": "Mark",
    "Regex": "に出",
    "groups": [
      "ExpeditionRunicMonsters"
    ],
    "subGroups": [
      "Expedition"
    ],
    "domain": "tablet"
  },
  "マップで見つかるシミュラクラムスプリンターのスタックサイズが(##)%増加する": {
    "mod": "マップで見つかるシミュラクラムスプリンターのスタックサイズが(##)%増加する",
    "engMod": "(##)% increased Stack size of Simulacrum Splinters found in Map",
    "value": "15-30",
    "type": "Suffix",
    "engRegex": "tac",
    "Regex": "るシ",
    "groups": [
      "DeliriumMonsterSplinterIncrease"
    ],
    "subGroups": [
      "Delirium"
    ],
    "domain": "tablet"
  },
  "マップでデリリウムの霧は消失する前に追加で(##)秒持続する": {
    "mod": "マップでデリリウムの霧は消失する前に追加で(##)秒持続する",
    "engMod": "Delirium Fog in Map lasts (##) additional seconds before dissipating",
    "value": "6-12",
    "type": "Suffix",
    "engRegex": "bef",
    "Regex": "は消",
    "groups": [
      "DeliriumFogDissipationDelay"
    ],
    "subGroups": [
      "Delirium"
    ],
    "domain": "tablet"
  },
  "マップでデリリウムの霧は(##)%遅く消失する": {
    "mod": "マップでデリリウムの霧は(##)%遅く消失する",
    "engMod": "Delirium Fog in Map dissipates (##)% slower",
    "value": "-30--20",
    "type": "Suffix",
    "engRegex": "slo",
    "Regex": "%遅",
    "groups": [
      "DeliriumFogPersistence"
    ],
    "subGroups": [
      "Delirium"
    ],
    "domain": "tablet"
  },
  "マップのデリリウムのせん妄度は鏡から離れるほど(##)%速く増える": {
    "mod": "マップのデリリウムのせん妄度は鏡から離れるほど(##)%速く増える",
    "engMod": "Delirium in Map increases (##)% faster with distance from the mirror",
    "value": "15-30",
    "type": "Suffix",
    "engRegex": "h di",
    "Regex": "度は鏡",
    "groups": [
      "DeliriumDifficultyIncrease"
    ],
    "subGroups": [
      "Delirium"
    ],
    "domain": "tablet"
  },
  "マップのデリリウムモンスターはパックサイズが(##)%増加する": {
    "mod": "マップのデリリウムモンスターはパックサイズが(##)%増加する",
    "engMod": "Delirium Monsters in Map have (##)% increased Pack Size",
    "value": "15-30",
    "type": "Suffix",
    "engRegex": "ze$",
    "Regex": "ムモ",
    "groups": [
      "DeliriumPackSizeIncrease"
    ],
    "subGroups": [
      "Delirium"
    ],
    "domain": "tablet"
  },
  "マップのデリリウムの霧がスポーンさせる割れた鏡の数が(##)%増加する": {
    "mod": "マップのデリリウムの霧がスポーンさせる割れた鏡の数が(##)%増加する",
    "engMod": "Delirium Fog in Map spawns (##)% increased Fracturing Mirrors",
    "value": "15-30",
    "type": "Suffix",
    "engRegex": "ng Mi",
    "Regex": "た鏡の",
    "groups": [
      "DeliriumDoodadsIncrease"
    ],
    "subGroups": [
      "Delirium"
    ],
    "domain": "tablet"
  },
  "マップでレアモンスターを倒すとデリリウムの鏡のタイマーが(##)秒停止する": {
    "mod": "マップでレアモンスターを倒すとデリリウムの鏡のタイマーが(##)秒停止する",
    "engMod": "Slaying Rare Monsters in Map pauses the Delirium Mirror Timer for (##) seconds",
    "value": "3-5",
    "type": "Suffix",
    "engRegex": "yi",
    "Regex": "でレ",
    "groups": [
      "DeliriumRareMonsterPause"
    ],
    "subGroups": [
      "Delirium"
    ],
    "domain": "tablet"
  },
  "マップのデリリウムエンカウンターでユニークボスがスポーンする確率が(##)%高くなる": {
    "mod": "マップのデリリウムエンカウンターでユニークボスがスポーンする確率が(##)%高くなる",
    "engMod": "Delirium Encounters in Map are (##)% more likely to spawn Unique Bosses",
    "value": "15-30",
    "type": "Suffix",
    "engRegex": "nco",
    "Regex": "ムエ",
    "groups": [
      "DeliriumBossChance"
    ],
    "subGroups": [
      "Delirium"
    ],
    "domain": "tablet"
  },
  "マップのデリリウムの霧でスポーンする鏡の破片が(##)%増加する": {
    "mod": "マップのデリリウムの霧でスポーンする鏡の破片が(##)%増加する",
    "engMod": "Delirium Fog in Map spawns (##)% increased MirrorShards",
    "value": "12-26",
    "type": "Suffix",
    "engRegex": "har",
    "Regex": "霧で",
    "groups": [
      "DeliriumAdditionalShardsChance"
    ],
    "subGroups": [
      "Delirium"
    ],
    "domain": "tablet"
  },
  "マップのリチュアルの祭壇で捧げられたモンスターが付与するトリビュートが(##)%増加する": {
    "mod": "マップのリチュアルの祭壇で捧げられたモンスターが付与するトリビュートが(##)%増加する",
    "engMod": "Monsters Sacrificed at Ritual Altars in Map grant (##)% increased Tribute",
    "value": "18-30",
    "type": "Suffix",
    "engRegex": "iced",
    "Regex": "で捧",
    "groups": [
      "RitualTributeIncrease"
    ],
    "subGroups": [
      "Ritual"
    ],
    "domain": "tablet"
  },
  "マップのリチュアルの祭壇で恩寵のリロールでコストとして消費するトリビュートが(##)%減少する": {
    "mod": "マップのリチュアルの祭壇で恩寵のリロールでコストとして消費するトリビュートが(##)%減少する",
    "engMod": "Rerolling Favours at Ritual Altars in Map costs (##)% reduced Tribute",
    "value": "-30--20",
    "type": "Suffix",
    "engRegex": "ro.*ts",
    "Regex": "でコ",
    "groups": [
      "RitualRerollCostIncrease"
    ],
    "subGroups": [
      "Ritual"
    ],
    "domain": "tablet"
  },
  "マップのリチュアルの祭壇での恩寵の繰り越しにコストとしてかかるトリビュートが(##)%減少する": {
    "mod": "マップのリチュアルの祭壇での恩寵の繰り越しにコストとしてかかるトリビュートが(##)%減少する",
    "engMod": "Deferring Favours at Ritual Altars in Map costs (##)% reduced Tribute",
    "value": "-30--20",
    "type": "Suffix",
    "engRegex": "rri",
    "Regex": "の繰",
    "groups": [
      "RitualDeferCostIncrease"
    ],
    "subGroups": [
      "Ritual"
    ],
    "domain": "tablet"
  },
  "マップのリチュアルの祭壇で繰り越しした恩寵は(##)%速く再出現する": {
    "mod": "マップのリチュアルの祭壇で繰り越しした恩寵は(##)%速く再出現する",
    "engMod": "Favours Deferred at Ritual Altars in Map reappear (##)% sooner",
    "value": "25-40",
    "type": "Suffix",
    "engRegex": "eap",
    "Regex": "で繰",
    "groups": [
      "RitualDeferSpeed"
    ],
    "subGroups": [
      "Ritual"
    ],
    "domain": "tablet"
  },
  "マップのリチュアルの祭壇は恩寵を追加で(##)回リロールできる": {
    "mod": "マップのリチュアルの祭壇は恩寵を追加で(##)回リロールできる",
    "engMod": "Ritual Altars in Map allow rerolling Favours (##) additional times",
    "value": "1-3",
    "type": "Suffix",
    "engRegex": "mes",
    "Regex": "壇は",
    "groups": [
      "RitualAdditionalReroll"
    ],
    "subGroups": [
      "Ritual"
    ],
    "domain": "tablet"
  },
  "マップのリチュアルの祭壇で恩寵のリロールは(##)%の確率でトリビュートをコストとして消費しない": {
    "mod": "マップのリチュアルの祭壇で恩寵のリロールは(##)%の確率でトリビュートをコストとして消費しない",
    "engMod": "Favours Rerolled at Ritual Altars in Map have (##)% chance to cost no Tribute",
    "value": "300-600",
    "type": "Suffix",
    "engRegex": "lled",
    "Regex": "ルは",
    "groups": [
      "RitualChanceForNoCost"
    ],
    "subGroups": [
      "Ritual"
    ],
    "domain": "tablet"
  },
  "マップのリチュアルの祭壇で復活するモンスターがマジックになる確率が(##)%増加する": {
    "mod": "マップのリチュアルの祭壇で復活するモンスターがマジックになる確率が(##)%増加する",
    "engMod": "Revived Monsters from Ritual Altars in Map have (##)% increased chance to be Magic",
    "value": "35-70",
    "type": "Suffix",
    "engRegex": "gic$",
    "Regex": "がマ",
    "groups": [
      "RitualRareMonsters"
    ],
    "subGroups": [
      "Ritual"
    ],
    "domain": "tablet"
  },
  "マップのリチュアルの祭壇で復活するモンスターがレアになる確率が(##)%増加する": {
    "mod": "マップのリチュアルの祭壇で復活するモンスターがレアになる確率が(##)%増加する",
    "engMod": "Revived Monsters from Ritual Altars in Map have (##)% increased chance to be Rare",
    "value": "25-40",
    "type": "Suffix",
    "engRegex": "are$",
    "Regex": "ーがレ",
    "groups": [
      "RitualMagicMonsters"
    ],
    "subGroups": [
      "Ritual"
    ],
    "domain": "tablet"
  },
  "マップのリチュアルの恩寵がお告げとなる確率が(##)%増加する": {
    "mod": "マップのリチュアルの恩寵がお告げとなる確率が(##)%増加する",
    "engMod": "Ritual Favours in Map have (##)% increased chance to be Omens",
    "value": "35-70",
    "type": "Suffix",
    "engRegex": "l fa",
    "Regex": "寵が",
    "groups": [
      "RitualOmenChance"
    ],
    "subGroups": [
      "Ritual"
    ],
    "domain": "tablet"
  },
  "マップにストロングボックスが追加で(##)個出現する": {
    "mod": "マップにストロングボックスが追加で(##)個出現する",
    "engMod": "Map contains (##) additional Strongboxes",
    "value": "1-2",
    "type": "Suffix",
    "engRegex": "l st",
    "Regex": "クスが追",
    "groups": [
      "MapBossAdditionalStrongbox"
    ],
    "subGroups": [
      "Map"
    ],
    "domain": "tablet"
  },
  "マップにシュラインが追加で(##)個出現する": {
    "mod": "マップにシュラインが追加で(##)個出現する",
    "engMod": "Map contains (##) additional Shrines",
    "value": "1-2",
    "type": "Suffix",
    "engRegex": "l sh",
    "Regex": "インが追",
    "groups": [
      "MapBossAdditionalShrine"
    ],
    "subGroups": [
      "Map"
    ],
    "domain": "tablet"
  },
  "マップにエッセンスが追加で(##)個出現する": {
    "mod": "マップにエッセンスが追加で(##)個出現する",
    "engMod": "Map contains (##) additional Essences",
    "value": "1-2",
    "type": "Suffix",
    "engRegex": "l e",
    "Regex": "ンスが追",
    "groups": [
      "MapBossAdditionalEssence"
    ],
    "subGroups": [
      "Map"
    ],
    "domain": "tablet"
  },
  "マップにアズメリの精霊が追加で(##)体出現する": {
    "mod": "マップにアズメリの精霊が追加で(##)体出現する",
    "engMod": "Map contains (##) additional Azmeri Spirits",
    "value": "1-2",
    "type": "Suffix",
    "engRegex": "ns.*its",
    "Regex": "体出",
    "groups": [
      "MapBossAdditionalSpirit"
    ],
    "subGroups": [
      "Map"
    ],
    "domain": "tablet"
  },
  "マップボスがドロップするウェイストーンの数量が(##)%増加する": {
    "mod": "マップボスがドロップするウェイストーンの数量が(##)%増加する",
    "engMod": "(##)% increased Quantity of Waystones dropped by Map Bosses",
    "value": "18-30",
    "type": "Suffix",
    "engRegex": "es d",
    "Regex": "スがド",
    "groups": [
      "MapBossWaystoneChance"
    ],
    "subGroups": [
      "Map"
    ],
    "domain": "tablet"
  },
  "マップボスが付与する経験値が(##)%上昇する": {
    "mod": "マップボスが付与する経験値が(##)%上昇する",
    "engMod": "Map Bosses grant (##)% increased Experience",
    "value": "40-80",
    "type": "Suffix",
    "engRegex": "s g",
    "Regex": "る経",
    "groups": [
      "MapBossExperience"
    ],
    "subGroups": [
      "Map"
    ],
    "domain": "tablet"
  },
  "マップボスのドロップするアイテムのレアリティが(##)%増加する": {
    "mod": "マップボスのドロップするアイテムのレアリティが(##)%増加する",
    "engMod": "(##)% increased Rarity of Items dropped by Map Bosses",
    "value": "35-60",
    "type": "Suffix",
    "engRegex": "Ra.*dr",
    "Regex": "するアイテムのレ",
    "groups": [
      "MapBossRarity"
    ],
    "subGroups": [
      "Map"
    ],
    "domain": "tablet"
  },
  "マップボスのドロップするアイテムの数量が(##)%増加する": {
    "mod": "マップボスのドロップするアイテムの数量が(##)%増加する",
    "engMod": "(##)% increased Quantity of Items dropped by Map Bosses",
    "value": "13-20",
    "type": "Suffix",
    "engRegex": "y of i",
    "Regex": "するアイテムの数",
    "groups": [
      "MapBossQuantity"
    ],
    "subGroups": [
      "Map"
    ],
    "domain": "tablet"
  },
  "マップのアビスがスポーンするモンスターの数が(##)%増加する": {
    "mod": "マップのアビスがスポーンするモンスターの数が(##)%増加する",
    "engMod": "Abysses in Map spawn (##)% increased Monsters",
    "value": "20-30",
    "type": "Suffix",
    "engRegex": "n \\d+%",
    "Regex": "ビスがス",
    "groups": [
      "AbyssMonsterIncrease"
    ],
    "subGroups": [
      "Abyss"
    ],
    "domain": "tablet"
  },
  "マップのアビスの穴からレアモンスターが追加で(##)体スポーンする": {
    "mod": "マップのアビスの穴からレアモンスターが追加で(##)体スポーンする",
    "engMod": "(##) additional Rare Monsters are spawned from Abysses in Map",
    "value": "1-2",
    "type": "Suffix",
    "engRegex": "wne",
    "Regex": "穴か",
    "groups": [
      "AbyssRareMonsterIncrease"
    ],
    "subGroups": [
      "Abyss"
    ],
    "domain": "tablet"
  },
  "マップのアビサルモンスターの難易度および報酬が閉じた穴の数ごとに増加する": {
    "mod": "マップのアビサルモンスターの難易度および報酬が閉じた穴の数ごとに増加する",
    "engMod": "Abyssal Monsters in Map have increased Difficulty and Reward for each closed Pit",
    "value": "1",
    "type": "Suffix",
    "engRegex": "Diff",
    "Regex": "の難",
    "groups": [
      "AbyssEnhancedMonstersPerChasm"
    ],
    "subGroups": [
      "Abyss"
    ],
    "domain": "tablet"
  },
  "アビサルモンスターは閉じた穴の数ごとにエフェクティブが(##)%増加する、最大#%": {
    "mod": "アビサルモンスターは閉じた穴の数ごとにエフェクティブが(##)%増加する、最大#%",
    "engMod": "Abyssal Monsters have (##)% increased Effectiveness for each closed Pit, up to #%",
    "value": "8-12",
    "type": "Suffix",
    "engRegex": "t,",
    "Regex": "は閉",
    "groups": [
      "AbyssEnhancedMonstersPerChasm"
    ],
    "subGroups": [
      "Abyss"
    ],
    "domain": "tablet"
  },
  "マップのアビスがアビスの深淵に繋がる確率が(##)%増加する": {
    "mod": "マップのアビスがアビスの深淵に繋がる確率が(##)%増加する",
    "engMod": "Abysses in Map have (##)% increased chance to lead to an Abyssal Depths",
    "value": "10-20",
    "type": "Suffix",
    "engRegex": "lea",
    "Regex": "の深",
    "groups": [
      "AbyssDepthsChance"
    ],
    "subGroups": [
      "Abyss"
    ],
    "domain": "tablet"
  },
  "マップにアビスが追加で#個出現する": {
    "mod": "マップにアビスが追加で#個出現する",
    "engMod": "Map contains an additional Abyss",
    "value": "1",
    "type": "Suffix",
    "engRegex": "ns an.*Ab",
    "Regex": "にアビスが",
    "groups": [
      "AbyssAdditionalChance"
    ],
    "subGroups": [
      "Abyss"
    ],
    "domain": "tablet"
  },
  "マップのアビスの穴が報酬を持つ確率が#倍になる": {
    "mod": "マップのアビスの穴が報酬を持つ確率が#倍になる",
    "engMod": "Abyss Pits in Map are twice as likely to have Rewards",
    "value": "-50",
    "type": "Suffix",
    "engRegex": "tw",
    "Regex": "穴が",
    "groups": [
      "AbyssIncreasedRewards"
    ],
    "subGroups": [
      "Abyss"
    ],
    "domain": "tablet"
  },
  "マップに(##)%の確率でアビスが追加で#個出現する": {
    "mod": "マップに(##)%の確率でアビスが追加で#個出現する",
    "engMod": "Map has (##)% chance to contain four additional Abysses",
    "value": "20-40",
    "type": "Suffix",
    "engRegex": "four",
    "Regex": "でア",
    "groups": [
      "Abyss4AdditionalChance"
    ],
    "subGroups": [
      "Abyss"
    ],
    "domain": "tablet"
  },
  "マップのアビサルモンスターがアビサルモッドを持つ確率が(##)%増加する": {
    "mod": "マップのアビサルモンスターがアビサルモッドを持つ確率が(##)%増加する",
    "engMod": "(##)% increased chance for Abyssal monsters in Map to have Abyssal Modifiers",
    "value": "20-30",
    "type": "Suffix",
    "engRegex": "r ab",
    "Regex": "ーがア",
    "groups": [
      "AbyssExtraModifiers"
    ],
    "subGroups": [
      "Abyss"
    ],
    "domain": "tablet"
  },
  "マップのアビスから冒涜カレンシーを獲得する確率が(##)%増加する": {
    "mod": "マップのアビスから冒涜カレンシーを獲得する確率が(##)%増加する",
    "engMod": "(##)% increased chance for Desecrated Currency from Abysses in Map",
    "value": "20-30",
    "type": "Suffix",
    "engRegex": "cy",
    "Regex": "スか",
    "groups": [
      "AbyssExtraTickets"
    ],
    "subGroups": [
      "Abyss"
    ],
    "domain": "tablet"
  },
  "マップのヴァールビーコンの周りのモンスターのパックサイズが(##)%増加する": {
    "mod": "マップのヴァールビーコンの周りのモンスターのパックサイズが(##)%増加する",
    "engMod": "(##)% increased Pack Size for Monsters around Vaal Beacons in Map",
    "value": "10-30",
    "type": "Suffix",
    "engRegex": "ze f",
    "Regex": "りの",
    "groups": [
      "IncursionPackSize"
    ],
    "subGroups": [
      "Incursion"
    ],
    "domain": "tablet"
  },
  "マップのヴァールビーコンの周りに追加で#パックのモンスターが出現する": {
    "mod": "マップのヴァールビーコンの周りに追加で#パックのモンスターが出現する",
    "engMod": "# extra pack of Monsters around Vaal Beacons in Map",
    "value": "1",
    "type": "Suffix",
    "engRegex": "k o",
    "Regex": "^マップのヴァールビーコンの周りに",
    "groups": [
      "IncursionExtraPacks"
    ],
    "subGroups": [
      "Incursion"
    ],
    "domain": "tablet"
  },
  "(##)%の確率でマップのヴァールビーコンの周りに追加で#パックのモンスターが出現する": {
    "mod": "(##)%の確率でマップのヴァールビーコンの周りに追加で#パックのモンスターが出現する",
    "engMod": "(##)% chance for an extra packs of Monsters around Vaal Beacons in Map",
    "value": "30-60",
    "type": "Suffix",
    "engRegex": "cks",
    "Regex": "%の.*ンの",
    "groups": [
      "IncursionExtraPacks"
    ],
    "subGroups": [
      "Incursion"
    ],
    "domain": "tablet"
  },
  "マップでヴァールビーコンが追加のモンスターを召喚する確率が(##)%増加する": {
    "mod": "マップでヴァールビーコンが追加のモンスターを召喚する確率が(##)%増加する",
    "engMod": "(##)% increased chance Vaal Beacons summon additional Monsters in Map",
    "value": "25-50",
    "type": "Suffix",
    "engRegex": "ns s",
    "Regex": "加の",
    "groups": [
      "IncursionSecondaryEncounters"
    ],
    "subGroups": [
      "Incursion"
    ],
    "domain": "tablet"
  },
  "(##)%の確率でマップのヴァールビーコンからクリスタルを追加で#個獲得する": {
    "mod": "(##)%の確率でマップのヴァールビーコンからクリスタルを追加で#個獲得する",
    "engMod": "(##)% chance to gain an additional Crystal from Vaal Beacons in Map",
    "value": "5-10",
    "type": "Suffix",
    "engRegex": "o g",
    "Regex": "ンか",
    "groups": [
      "IncursionTokenChance"
    ],
    "subGroups": [
      "Incursion"
    ],
    "domain": "tablet"
  },
  "(##)%の確率でヴァールビーコンユニークモンスターをマップに追加する": {
    "mod": "(##)%の確率でヴァールビーコンユニークモンスターをマップに追加する",
    "engMod": "(##)% chance to add a Vaal Beacon Unique Monster to the Map",
    "value": "10-25",
    "type": "Suffix",
    "engRegex": "a v",
    "Regex": "ンユ",
    "groups": [
      "IncursionBossChance"
    ],
    "subGroups": [
      "Incursion"
    ],
    "domain": "tablet"
  },
  "マップのヴァールビーコンチェストがレアになる確率が(##)%増加する": {
    "mod": "マップのヴァールビーコンチェストがレアになる確率が(##)%増加する",
    "engMod": "(##)% increased chance Vaal Beacon Chests are Rare in Map",
    "value": "30-60",
    "type": "Suffix",
    "engRegex": "n c",
    "Regex": "ンチ",
    "groups": [
      "IncursionRareChestChance"
    ],
    "subGroups": [
      "Incursion"
    ],
    "domain": "tablet"
  }
};
