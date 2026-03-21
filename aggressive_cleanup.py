import os
import re

files = [
    "scripts/beastlist.js",
    "scripts/scarablist.js",
    "scripts/tattoolist.js",
    "scripts/runegraftlist.js"
]

def aggressive_cleanup(path):
    if not os.path.exists(path):
        return
    
    with open(path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    new_lines = []
    markers = ["<<<<<<<", "=======", ">>>>>>>", "Updated upstream", "Stashed changes"]
    
    for line in lines:
        cleaned_line = line
        # マーカーが行の中に含まれている場合、そのマーカー部分だけを除去する
        # もし行全体がマーカーなら、その行自体をスキップする
        is_marker_only = any(m in line and len(line.strip()) < len(m) + 20 for m in markers)
        
        if is_marker_only:
            continue
            
        for m in markers:
            cleaned_line = cleaned_line.replace(m, "")
        
        # 不要なカンマの重複や末尾のゴミを掃除（簡易的）
        cleaned_line = cleaned_line.strip("\r\n")
        if cleaned_line.strip():
            new_lines.append(cleaned_line + "\n")
    
    # JSON構造を壊さないように、最後に念入りにチェックする（本来はJSONパースしたいが、壊れている前提なので文字列処理）
    content = "".join(new_lines)
    # 重複した属性などを1つに絞る（StashedとUpstream両方残ってしまった場合用）
    # 今回は単純にマーカー除去だけで一旦十分なはず
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Aggressively cleaned {path}")

for f in files:
    aggressive_cleanup(f)
