# PoE JP Regex

PoE1／PoE2 の日本語・英語Regex生成ツールです。画面は従来のHTMLを使用し、アプリの処理はTypeScriptで管理します。

## 開発

Node.js 24 と npm を使用します。最初に依存パッケージをインストールしてください。

```powershell
npm.cmd ci --ignore-scripts
npm.cmd run dev
```

PoE1: <http://localhost:5173/poe1.html>、PoE2: <http://localhost:5173/poe2.html>

`src/` と `data/` の変更を検知して再ビルドします。ブラウザを再読み込みすると変更が反映されます。

```powershell
npm.cmd run typecheck   # 両ゲームの型チェック
npm.cmd run build       # 公開用JavaScriptとソースマップを生成
npm.cmd test            # 互換性・初期化・データ検証
npm.cmd run check       # 型チェック → ビルド → テスト
python tests/update_prices_test.py # 価格更新のオフラインテスト
```

macOS／Linuxでは `npm.cmd` を `npm` に置き換えてください。

## フォルダ構成

```text
poe1.html / poe2.html       画面HTMLと既存の公開URL
src/
  shared/                  PoE1／PoE2共通
    core/                  基礎処理（DOM・保存設定・数値Regex）
    ui/                    共通の画面操作（ナビゲーション・通知・フィードバック）
    features/              共通の機能処理（マップ・変換・保存済み一覧など）
  poe1/                    PoE1
    app/                   状態と初期化
    ui/                    言語切替・画面固有のフィードバック設定
    types/                 HTML要素と公開関数の型定義
    features/
      map/                 マップRegex・保存・変換
      catalogs/            ビースト、スカラベ、エッセンス、タトゥー、ルーングラフト
      trade/               トレード検索・設定
      charts.ts            海図
      flasks.ts            フラスコ
      recombination.ts     リコンビ
      pob-import.ts        PoB共有コード・ジェム情報
      saved-regex.ts       PoE1固有の保存済み一覧処理
      vendor.ts            ベンダー・ジェム・PoB連携
  poe2/                    PoE2
    app/                   設定・状態・初期化
    ui/                    言語切替・画面固有のフィードバック設定
    types/                 HTML要素と公開関数の型定義
    features/
      map/                 ウェイストーンRegex・保存・変換
      trade/               トレード検索・設定
      tablets.ts           石板
      saved-regex.ts       PoE2固有の保存済み一覧処理
      vendor.ts            ベンダー
  types/                   共通のドメイン型・ブラウザAPI
data/
  manifest.json            JSONとブラウザで使用するデータ変数の対応表
  poe1/                    Mod・カタログ・トレードデータ
    items/                 装備の接辞データ
    flasks/                フラスコの接辞データ
    gems/                  ジェムRegex
  poe2/                    ウェイストーン・石板のModデータ
assets/
  css/                     既存のスタイルシート
  vendor/                  配布済み翻訳エンジン
  js/                      生成物（直接編集せず、src/とdata/から再ビルド）
tooling/
  build.mjs / dev.mjs       ビルド・プレビュー
  data/                    データ検証・価格更新・旧ツールとの互換処理
tests/                     互換性テストと変更前の期待値
docs/                      構成と移行の記録
archive/                   ローカルの旧コード・移行用作業ファイル（Git管理外）
tools/ / tools_poe2/        既存のローカルデータ生成ツール（Git管理外）
```

## コードとデータの変更

アプリの処理は `src/`、ゲームデータは `data/`、見た目はHTMLと `assets/css/` を編集します。

PoE1／PoE2で完全に同じ処理は `src/shared/` にまとめています。ゲーム固有のRegexや保存キーは各ゲームのファイルで管理します。型定義にはMod選択状態、プロファイル、接辞、トレードクエリ、翻訳エンジンを用意しています。

機能を探すときは各ゲームの `features/`、初期化は `app/`、画面全体の操作は `ui/` を見てください。共通の型は `src/types/`、各ページの型は `src/poe1/types/`／`src/poe2/types/` にあります。単独の機能は1ファイルで置き、マップやトレードのように複数の処理がある機能だけフォルダに分けています。

既存のHTMLイベントと保存処理のフックを保つため、TypeScriptは各ゲームにつき1本の通常のブラウザスクリプトを生成します。`src/poe1/tsconfig.json`／`src/poe2/tsconfig.json` の `files` が読み込み順です。ゲーム間で同名の状態変数があるため、型チェックは別々に行います。新しいファイルは該当する `files` に追加してください。

`elements.d.ts` は実際のHTMLのIDと要素型の対応表です。HTMLに要素を追加したら対応表も更新してください。画面構造との一致はテストで確認します。

型エラーがある場合はビルドを停止します。既存の動的なUI・保存データとの互換性のため、現時点ではTypeScriptの `strict` は無効です。`@ts-nocheck` によるファイル単位のチェック除外は使用していません。DOM要素、選択状態、データ辞書などには型を付けていますが、旧プロファイルの任意フィールドなどには互換性用の動的な型が残ります。

## 価格更新

```powershell
python tooling/data/update-prices.py
npm.cmd run build
```

GitHub Actionsも同じ順序で更新します。価格は `data/poe1/*list.json` に保存し、公開用の `assets/js/data-poe1.js` を再生成します。

既存のローカルジェネレーターは互換ブリッジから実行できます。

```powershell
npm.cmd run data:legacy -- python tools/extract_map_mods.py --source poe-db
npm.cmd run data:legacy -- python tools_poe2/extract_tablet_mods.py --source poe-db
```

ブリッジが旧形式の作業用データを用意し、コマンドの成功時に結果をJSONへ取り込んでビルドします。生成処理が失敗した場合、`data/` へ取り込まず、旧形式の作業フォルダを調査用に残します。再実行前に必要な結果を保存し、作業フォルダを片付けてください。`PoE Tools/maintenance_gui` のデータ更新ボタンもブリッジ経由で実行するよう対応済みです。

## 公開

GitHub Pagesで従来どおり静的ファイルとして公開できます。変更後に `npm.cmd run check` を実行し、`assets/js/` の生成物もソースと一緒にコミットしてください。CIは型・テストと、コミット済み生成物の一致を検証します。

今回の移行ではローカルファイルのみ変更しています。移行内容とバックアップは [docs/typescript-migration.md](docs/typescript-migration.md) を参照してください。

## ブラウザテストと保存データ

初回はテスト用Chromiumをインストールします。

```powershell
npx.cmd playwright install chromium
npm.cmd run test:browser
```

Playwrightは専用ポート5174でサイトを起動し、1280pxと480pxの画面幅でタブ移動、日英ソート、エッセンス全行の列位置、破損データからの起動を検証します。CIでも実行し、失敗時はスクリーンショットとトレースを保存します。

ルートのtsconfig.jsonは両ゲームのプロジェクト参照のみを持ち、共通設定はtsconfig.base.json、型チェックの生成物は.cache/typescriptに配置します。従来のtsconfig.poe1.json／tsconfig.poe2.jsonも互換入口として残しており、メンテナンスGUIからの型チェックを継続できます。

保存処理はsrc/shared/core/storage.tsに集約しました。既存キーと形式は保持し、読込時にJSONと内容を検証します。壊れたプロファイルは正常な項目のみを読み込み、次の書込前に元データをキー名+`__invalid_backup`へ退避します。容量不足などで書込に失敗した場合は保存成功の通知を出しません。プロファイルのJSON取込も検証してから保存します。
