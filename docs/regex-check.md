# Regexの誤一致チェック

サイトのフォルダで `npm run regex:check` を実行すると、PoE1のマップModを日英で検査し、`archive/regex-checks/latest.html` と `latest.json` に結果を保存します。Regexや元データは書き換えません。

自分のMod本文への一致を確認したうえで、他Modの本文（`mod` / `engMod`）、自分も含めた `type`・`modTags`・`reminderText` への一致を調べます。日本語Regexは日本語、英語Regexは英語の表示文字列が対象です。該当する場合はMod名も調べます。同じ本文の別エントリーへの一致は別枠で表示します。

レポートには一致先のMod・項目・文字列を表示し、一致した部分を強調します。未設定、構文エラー、自分の本文に一致しないRegexも表示します。候補がすべて不具合とは限らないため、手動で判断・修正して再実行してください。

```sh
# 海図のみ
npm run regex:check -- --table chart
# マップと海図の間の一致も調べる
npm run regex:check -- --table all
# PoE2、日本語のみ
npm run regex:check -- --game poe2 --lang ja
# 更新候補JSONを検査（--fileは複数指定可能）
npm run regex:check -- --file archive/map-updates/実行フォルダ/candidate/data/poe1/map-mods.json
# エラー・誤一致候補があれば終了コード1
npm run regex:check -- --strict
```

通常は候補が見つかっても終了コード0です。メンテナンスGUIにも各ゲームの「マップRegex誤一致チェック（日英）」を追加しています。結果はゲームごとのフォルダに保存します。

検査はJavaScriptの大文字小文字を区別しない正規表現による近似です。数値は最小・中間・最大のサンプル（値が不明なら1）を使い、ゲーム内のすべての値や複数Modを組み合わせたアイテム全体を網羅するものではありません。最終的にはゲーム内でも確認してください。
