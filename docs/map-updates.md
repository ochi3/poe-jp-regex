# マップModの更新

## 3.30の更新済みゲームデータ反映（2026-11-14）

PoE1のMap Modは2026-11-14更新済みSteam本体からMods／Stats／Tags、日英ClientStrings、stat_descriptions.csd／map_stat_descriptions.csdを抽出し直し、134件に更新しました（既存125件＋未収録9件）。海図・PoE2は対象外です。既存の手動tier・weight・トレードIDを保持し、新規9件のトレードIDは未照合のため空欄です。数値入り本文への不一致が見つかった既存Mod3件の日英Regex計4項目を個別修正しました。

報酬の旧数量statは `map_drop_scaling_+%`（アトラスドロップ）に変わりました。Map画面の表示・ソート・最低値Regexを対応し、スレッド量も新しい名称で検索します。保存設定の入力ID・設定キーは維持しています。旧スカラベカタログと海図の数量条件は今回の変更範囲に含みません。

公式トレードAPIの照合は403により未完了です。アトラスドロップ・スレッドの最低値、トレードID未設定のModを含む検索は、条件を無視したURLを出さず案内を表示します。APIの実在するフィルタ／stat IDを照合できたら `src/poe1/features/trade/query.ts` の対応を更新してください。

通常の抽出対象は下記ツールの既存条件（area、Prefix/Suffix、default/top_tier_map/uber_tier_mapの正のウェイト）を維持しています。`has_uber_map_suffix` 条件だけを持つ同じ効果の弱いT17定義は別項目として追加していません。ゲーム内検索の実機確認は未実施です。

表示文言が変わっても、同じsourceIdの既存辞書キーは保存設定の識別子として維持します。表示には `mod` / `engMod` を使います。今回のT17毒Modも、旧文言のキーを持ちながら新しい収録文を表示します。

日本語のゲーム内見出しは `ItemDisplayMapDropScalingBonus`＝「アトラスドロップ」、`ItemDisplayMapScarabDropBonus`＝「スレッド量が上昇」で照合しています。先行DLと今回のMap効果文・数値は一致しています。

今回の反映は更新パイプラインの候補検証・バックアップを通しています。以後の再生成では、元のPoE-DBデータも3.30へ更新してから実行してください。

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
