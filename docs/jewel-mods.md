# ジュエルの装備Mod

装備Modのカテゴリ「ジュエル」で通常3色、アビス5種類、クラスター大・中・小を選べます。通常のPrefix/Suffix接辞を対象とし、ユニーク専用・コラプトimplicit・エンチャントは含めません。

個人PoE-DBの `data/export/repoe/{global,japanese}/mods.json` から、`npm run data:jewels` で再出力できます。メンテGUIにも「ジュエルMod更新（PoE-DB）」を追加しています。ゲーム更新後は先にPoE-DBのmodsを更新してください。

`tooling/data/jewel-profiles.json` のベースタグとクラスターのサイズ別小パッシブタグは、ゲームデータのBaseItemTypes・PassiveTreeExpansionSkillsから取得したものです。ベースや小パッシブ種類が追加された際は、この定義も更新してください。

抽出はdomain・Prefix/Suffix・spawn_weightsの先頭一致・generation_weightsで判定します。weight 0の除外を優先し、Regexは新しく作らず既存の装備Modと同じ接辞名選択を使います。

クラスタージュエルは、選んだサイズの全小パッシブ種類の候補をまとめて表示します。個々のベースにすべての候補が付くわけではなく、画面にもその注意を表示します。出力データのvariantTagsで対応する小パッシブ種類を保持しています。
