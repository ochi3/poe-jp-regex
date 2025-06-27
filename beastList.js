const beastList = {
  "ビビッド・ウォッチャー": {
    engName: "Vivid Watcher",
    family: "深海",
    effect: "アイテムを変換：覚醒サポートジェムのロールを再生成する",
    regex: "ド・ウ",
    chaosValue: "189.41"
  },
  "ブラック・モリガン": {
    engName: "Black Mórrigan",
    family: "原生林",
    effect: "アイテムを修正：可能な限り最大リンク数にする",
    regex: "リガ",
    chaosValue: "172.19"
  },
  "クレイシアンのキメラル": {
    engName: "Craicic Chimeral",
    family: "深海",
    effect: "インプリントを作成: マジックアイテム",
    regex: "ンのキ",
    chaosValue: "101"
  },
  "ワイルド・ブリスル・マトロン": {
    engName: "Wild Bristle Matron",
    family: "原生林",
    effect: "アイテムのモッドを変化: 非ユニークアイテムにクラフトメタモッドを追加",
    regex: "ル・マ",
    chaosValue: "95"
  },
  "ビビッド・ヴァルチャー": {
    engName: "Vivid Vulture",
    family: "砂漠",
    effect: "アイテムを変換: シンセシス暗黙モッドをリロール",
    regex: "ド・ヴ",
    chaosValue: "90"
  },
  "ワイルド・ヘリオン・アルファ": {
    engName: "Wild Hellion Alpha",
    family: "原生林",
    effect: "アイテムのモッドを変化: 見つめる者の目のモッドをリロール。最大ライフ、マナおよびエナジーシールドのモッドはリロールできない",
    regex: "ド・ヘリ",
    chaosValue: "35"
  },
  "ワイルド・ブランブルバック": {
    engName: "Wild Brambleback",
    family: "原生林",
    effect: "アイテムを変換: コラプト状態でない覚醒のジェムのレベルを1上げる",
    regex: "ド・ブラ",
    chaosValue: "26.9"
  },
  "平原の始祖、ファルウル": {
    engName: "Farrul, First of the Plains",
    family: "原生林",
    effect: "アイテムにアスペクトスキルを追加: 猫のアスペクト",
    regex: "祖、ファ",
    chaosValue: "23"
  },
  "フィヌムスのプレイグドアラクニド": {
    engName: "Fenumal Plagued Arachnid",
    family: "洞窟",
    effect: "アイテムをスプリット: それぞれ半分のモッドを持つ2個のアイテムにスプリット",
    regex: "のプレ",
    chaosValue: "18.65"
  },
  "プライマル・クリストコーラー": {
    engName: "Primal Cystcaller",
    family: "原生林",
    effect: "アトラスクラフトを獲得: キラックミッションを5個獲得 ミッションの色は赤ビーストのレベルに基づく",
    regex: "ル・クリ",
    chaosValue: "10"
  },
  "夜の始祖、フィヌムス": {
    engName: "Fenumus, First of the Night",
    family: "洞窟",
    effect: "アイテムにアスペクトスキルを追加: 蜘蛛のアスペクト",
    regex: "祖、フィ",
    chaosValue: "14"
  },
  "空の始祖、サカワル": {
    engName: "Saqawal, First of the Sky",
    family: "砂漠",
    effect: "アイテムにアスペクトスキルを追加: 鳥のアスペクト",
    regex: "祖、サカ",
    chaosValue: "9"
  },
  "深海の始祖、クレイシアン": {
    engName: "Craiceann, First of the Deep",
    family: "深海",
    effect: "アイテムにアスペクトスキルを追加: 蟹のアスペクト",
    regex: "祖、ク",
    chaosValue: "8"
  },
  "プライマル・レックス・メイトリアーク": {
    engName: "Primal Rhex Matriarch",
    family: "原生林",
    effect: "アイテムを作成: シンセシスユニークマップ",
    regex: "ル・レッ",
    chaosValue: "5"
  },
  "フィヌムスのハイブリッドアラクニド": {
    engName: "Fenumal Hybrid Arachnid",
    family: "洞窟",
    effect: "ポータルを開く: フィヌムスの巣",
    regex: "スのハイ",
    chaosValue: "5"
  },
  "クレイシアンの砂のスピッター": {
    engName: "Craicic Sand Spitter",
    family: "深海",
    effect: "アイテムを変化: 可能な最大リンク数\nカレンシーアイテムを作成: 結合のオーブ\nカレンシーアイテムを作成: 連結のオーブ2個",
    regex: "アンの砂",
    chaosValue: "4.95"
  },
  "ファルウルのタイガー・アルファ": {
    engName: "Farric Tiger Alpha",
    family: "原生林",
    effect: "ポータルを開く: ファルウルの巣穴",
    regex: "ルのタイ",
    chaosValue: "4"
  },
  "サカワルのレックス": {
    engName: "Saqawine Rhex",
    family: "砂漠",
    effect: "ポータルを開く: サカワルのねぐら",
    regex: "ルのレッ",
    chaosValue: "4"
  },
  "ファルウルのウルフ・アルファ": {
    engName: "Farric Wolf Alpha",
    family: "原生林",
    effect: "アイテムのモッドを変化: プレフィックスを1つ追加し、ランダムなサフィックスを1つ削除 レアアイテムにのみ適用可能",
    regex: "ルフ・ア",
    chaosValue: "4"
  },
  "クレイシアンのタカアシガニ": {
    engName: "Craicic Spider Crab",
    family: "深海",
    effect: "ポータルを開く: クレイシアンの入り江",
    regex: "ンのタ",
    chaosValue: "4"
  },
  "クレイシアンの臣下": {
    engName: "Craicic Vassal",
    family: "深海",
    effect: "マップをコラプト: 基礎品質30%を付与\nマップをコラプト: ダブルコラプト",
    regex: "ンの臣",
    chaosValue: "4"
  },
  "ファルウルのリンクス・アルファ": {
    engName: "Farric Lynx Alpha",
    family: "原生林",
    effect: "アイテムのモッドを変化: サフィックスを1つ追加し、ランダムなプレフィックスを1つ削除",
    regex: "ルのリ",
    chaosValue: "3"
  },
  "クレイシアンの口": {
    engName: "Craicic Maw",
    family: "深海",
    effect: "アイテムのモッドを変更：シェイパーアイテムにモッドを追加\nエルダーアイテムにモッドを追加\nリディーマーアイテムにモッドを追加\nハンターアイテムにモッドを追加\nクルセイダーアイテムにモッドを追加\nウォーロードアイテムにモッドを追加",
    regex: "ンの口",
    chaosValue: "4"
  },
  "ビビッド・アブバララック": {
    engName: "Vivid Abberarach",
    family: "洞窟",
    effect: "アイテムを作成: シェイパーの守護者、エルダーの守護者または征服者のマップ",
    regex: "ド・アブ",
    chaosValue: "3"
  },
  "プライマル・クラッシュクロー": {
    engName: "Primal Crushclaw",
    family: "深海",
    effect: "アトラスクラフトを獲得: 無料の各マップクラフトオプションを1ずつ獲得",
    regex: "ル・クラ",
    chaosValue: "3"
  },
  "ファルウルのフロストヘリオン・アルファ": {
    engName: "Farric Frost Hellion Alpha",
    family: "原生林",
    effect: "アイテムを変換: アミュレットをタリスマンに変換 インフルエンスアイテムには適用できない\nカレンシーアイテムを作成: 地平のオーブ3個",
    regex: "ルのフロ",
    chaosValue: "3"
  },
  "サカワルのヴァルチャー": {
    engName: "Saqawine Vulture",
    family: "砂漠",
    effect: "アイテムを作成: 6リンクソケットレアアイテム",
    regex: "ワルのヴァ",
    chaosValue: "3"
  },
  "ファルウルのピット・ハウンド": {
    engName: "Farric Pit Hound",
    family: "原生林",
    effect: "アイテムを作成: レベル21コラプト状態ジェム",
    regex: "ルのピッ",
    chaosValue: "3"
  },
  "サカワルのロア": {
    engName: "Saqawine Rhoa",
    family: "砂漠",
    effect: "カレンシーアイテムを作成: 色彩のオーブ8個",
    regex: "ルのロア",
    chaosValue: "2.99"
  },
  "フィヌムスのスコーピオン": {
    engName: "Fenumal Scorpion",
    family: "洞窟",
    effect: "ユニークアイテムを変換: 他のユニークアイテムに変換\nマップをコラプト: ダブルコラプト",
    regex: "スのスコ",
    chaosValue: "2.78"
  },
  "サカワルのブラッドヴァイパー": {
    engName: "Saqawine Blood Viper",
    family: "砂漠",
    effect: "ユニークアイテムを作成: 剣または斧\nアイテムのモッドを変化: エルダーアイテムにモッドを追加",
    regex: "ルのブラ",
    chaosValue: "3"
  },
  "ファルウルのエイプ": {
    engName: "Farric Ape",
    family: "原生林",
    effect: "ユニークアイテムを作成: ベルト",
    regex: "ルのエイ",
    chaosValue: "2"
  },
  "クレイシアンのサベージクラブ": {
    engName: "Craicic Savage Crab",
    family: "深海",
    effect: "ユニークアイテムを作成: アイテム\nアイテムのモッドを変化: レアマップにモッドを追加",
    regex: "ンのサベ",
    chaosValue: "2.95"
  },
  "サカワルのコブラ": {
    engName: "Saqawine Cobra",
    family: "砂漠",
    effect: "ユニークアイテムを作成: メイスまたはセプター\nアイテムのモッドを変化: レアマップにモッドを追加",
    regex: "ルのコブ",
    chaosValue: "2.88"
  },
  "ファルウルのウルサ": {
    engName: "Farric Ursa",
    family: "原生林",
    effect: "ユニークアイテムを作成: 鎧",
    regex: "のウルサ",
    chaosValue: "2"
  },
  "フィヌムスの女王": {
    engName: "Fenumal Queen",
    family: "洞窟",
    effect: "ユニークアイテムを作成: スタッフ\nアイテムのモッドを変化: リディーマーアイテムにモッドを追加",
    regex: "スの女王",
    chaosValue: "2"
  },
  "ファルウルのゴライアス": {
    engName: "Farric Goliath",
    family: "原生林",
    effect: "ユニークアイテムを作成: 弓\nアイテムのモッドを変化: クルセイダーアイテムにモッドを追加",
    regex: "ルのゴラ",
    chaosValue: "2"
  },
  "フィヌムスのデヴァワラー": {
    engName: "Fenumal Devourer",
    family: "洞窟",
    effect: "ユニークアイテムを作成: 盾または矢筒\nアイテムのモッドを変化: シェイパーアイテムにモッドを追加",
    regex: "スのデヴ",
    chaosValue: "2.35"
  },
  "クレイシアンのウォッチャー": {
    engName: "Craicic Watcher",
    family: "深海",
    effect: "ユニークアイテムを作成: 鉤爪または短剣\nアイテムのモッドを変化: ハンターアイテムにモッドを追加",
    regex: "ンのウォ",
    chaosValue: "2"
  },
  "サカワルのキメラル": {
    engName: "Saqawine Chimeral",
    family: "砂漠",
    effect: "カレンシーアイテムを作成: ランダムなカレンシー10個",
    regex: "ルのキメ",
    chaosValue: "2"
  },
  "ファルウルのマグマ・ハウンド": {
    engName: "Farric Magma Hound",
    family: "原生林",
    effect: "アイテムを作成: 品質23%コラプト状態ジェム",
    regex: "ルのマグ",
    chaosValue: "2.99"
  },
  "ファルウルのタウロス": {
    engName: "Farric Taurus",
    family: "原生林",
    effect: "ユニークアイテムを作成: マップ",
    regex: "ルのタウ",
    chaosValue: "2"
  },
  "クレイシアンのイカ": {
    engName: "Craicic Squid",
    family: "深海",
    effect: "レアアイテムを作成: タリスマン",
    regex: "ンのイカ",
    chaosValue: "2"
  },
  "クレイシアンのシールドクラブ": {
    engName: "Craicic Shield Crab",
    family: "深海",
    effect: "カレンシーアイテムを作成: 宝飾職人のオーブ4個\nカレンシーアイテムを作成: 連結のオーブ2個\nアイテムを変化: 可能な最大ソケット数",
    regex: "ンのシー",
    chaosValue: "2"
  },
  "フィヌムスのウィドウ": {
    engName: "Fenumal Widow",
    family: "洞窟",
    effect: "ユニークアイテムを作成: 手袋",
    regex: "スのウィ",
    chaosValue: "2"
  },
  "ファルウルのフレイムヘリオン・アルファ": {
    engName: "Farric Flame Hellion Alpha",
    family: "原生林",
    effect: "ユニークアイテムを作成: 指輪",
    regex: "ルのフレ",
    chaosValue: "2"
  },
  "ファルウルのチーフテン": {
    engName: "Farric Chieftain",
    family: "原生林",
    effect: "ユニークアイテムを作成: アミュレット",
    regex: "ウルのチ",
    chaosValue: "2"
  },
  "ファリック・ゴートマン": {
    engName: "Farric Goatman",
    family: "原生林",
    effect: "ユニークアイテムを作成: フラスコ",
    regex: "ク・ゴー",
    chaosValue: "2"
  },
  "フィヌムスのスクラブラー": {
    engName: "Fenumal Scrabbler",
    family: "洞窟",
    effect: "ユニークアイテムを作成: ワンドアイテムのモッドを変化: ウォーロードアイテムにモッドを追加",
    regex: "スのスク",
    chaosValue: "2"
  },
  "ファルウルのガルガンチュア": {
    engName: "Farric Gargantuan",
    family: "原生林",
    effect: "ユニークアイテムを作成: 兜 カレンシーアイテムを作成: 地平のオーブ3個",
    regex: "ルのガル",
    chaosValue: "2"
  }
};