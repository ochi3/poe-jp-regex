# マップModの更新

ゲーム本体のアップデートが完了してから実行します。Python 3.10以降、Node.js 24、ローカルのPoE-DB／PoE2-DBを使用します。元データの抽出には各DB側のuv・PyPoE・RePoE環境も必要です。

## メンテナンスGUI

GUIサーバーを再起動すると、PoE1／PoE2のマップ更新に次のボタンが追加されます。

- **確認のみ**：既存のDB出力から候補を生成し、差分とRegex検証レポートを作成。本体は変更しません。
- **元データ準備から一括**：DBの`prepare`、`export-repoe-mods`、候補生成、検証、反映、ビルドを順に実行します。

従来のマップ／海図・ウェイストーン／石板の一括更新も、全コマンドを一度の候補生成にまとめ、検証してから反映します。失敗時は公開データを変更しません。最終ビルドが失敗した場合はJSONと生成JSを元に戻します。元データを作るDB側の更新は巻き戻しません。自動pushは行いません。

## コマンド

```powershell
# 既存DB出力から確認のみ
npm.cmd run data:map -- --game poe1 --dry-run
npm.cmd run data:map -- --game poe2 --dry-run

# 元データ準備から更新・検証・反映（uvの環境設定が必要）
npm.cmd run data:map -- --game poe1 --prepare
npm.cmd run data:map -- --game poe2 --prepare

# Python実行ファイルの指定
npm.cmd run data:map -- --game poe1 --python C:/path/to/python.exe --dry-run

# 候補を確認・修正した後の反映（候補作成後に本体が変わった場合は停止）
npm.cmd run data:map -- --game poe1 --candidate archive/map-updates/実行日時/candidate
```

ローカルDBを使わない場合は`--source repoe`も指定できます。`--prepare`との併用はできません。RePoEやローカルキャッシュの鮮度は別途確認してください。

## レポートと検証

`archive/map-updates/各実行/`に変更前データ、候補JSON、HTML・JSONレポートを保存します。直近のレポートは`archive/map-updates/latest.html`です。HTMLをブラウザで開いて確認してください。

- 追加・削除・文言変更・数値／Regex／トレードID変更を一覧化。
- `sourceIds`に元のMod IDを保存。同じ表示文言にまとまる複数のMod IDも保持します。IDを付与した後は、翻訳が変わっても同一Modとして照合します。初回は既存文言／英語による照合にフォールバックし、特定できないものはID未設定として表示します。IDは推測で作りません。
- 日英Regexを、数値を置換した最小・中間・最大値のサンプルで検証。他のModへの一致も一覧化します。
- 新たな空Regex・構文エラー・対象への不一致、ID重複、25%超の件数減少がある場合は反映を停止。
- 以前からあるRegexの問題、他Modへの一致、トレードID未設定、元Mod ID未設定は確認事項として表示。既存の不一致でも文言や値が変わった場合は再検証して停止対象にします。

Regex検証はJavaScriptによる近似です。ゲームの検索エンジンとの差や、説明文・表示形式による誤検出があるため、ゲーム内でも確認してください。未変更の既存エラーを自動修正する処理はありません。

更新失敗時にできた一時ファイルは実行フォルダの`working/`へ退避します。既に存在していた旧形式の作業フォルダには触れず停止します。同時実行は`.cache/map-update.lock`で防ぎます。強制終了後はプロセスが停止していることを確認してから、このロックフォルダを片付けてください。

マップ更新に必要な抽出スクリプトと依存モジュールはGit管理対象に変更しました。他のローカルツール・取得キャッシュは引き続き除外しています。

## タグ・補足説明の取得と手動Regex

PoE-DBの`export-mod-details`がゲームのTags.dat64（Name）・ReminderText.dat64を日英で読み、statのreminderstring参照と合わせて`data/export/game/mod_details.json`へ出力します。数値や説明文をサイト側で推測・手動登録する処理はありません。PoE-DBの翻訳更新時にも再生成します。

メンテナンスGUIのPoE-DBグループに「マップModのタグ・補足説明を取得」を追加しました。ゲーム更新後は元データのprepareと合わせて取得してください。コマンドではPoE-DB/data/scriptsで`uv run ./main.py export-mod-details`を実行できます。

マップ／海図JSONに`tagIds`・`modTags`・`reminderIds`・`reminderText`を保持し、マップ画面の詳細表示と検索に使用します。誤一致検証でも、他Modのタグ・説明にRegexが反応しないか確認します。説明文には日英のゲーム側の翻訳差がある場合もあり、原文の値を保持します。

Regexは手動管理です。既存の同じModの設定のみを引き継ぎ、新規ModのRegexは空欄にします。他Modからの流用・自動生成・空欄の自動補完は行いません。候補JSONに手動入力し、`--candidate`で再検証して反映してください。未設定のRegexは公開反映を止めます。
