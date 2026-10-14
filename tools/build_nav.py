"""content/ フォルダの中身から、メニューとページ本文をまとめた content/nav.json を作るスクリプト。

GitHub に push すると自動で実行されるので、普段は触らなくて大丈夫です。

  content/
    01_SQL Server/            ← カテゴリ
      01_集計・ウィンドウ関数/  ← グループ
        01_集計関数.md          ← ページ

- 先頭の「01_」のような番号は並び順にだけ使われ、画面には出ません（付けなくてもOK）
- 「_」で始まるファイル・フォルダ、「画像」「images」フォルダはメニューに出ません
- ページの2行目に「キーワード: COUNT / AVG」と書くと、タグ表示と検索に使われます
"""
import datetime
import json
import posixpath
import subprocess
import re
import unicodedata
from pathlib import Path
from urllib.parse import quote, unquote

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / 'content'
SKIP_DIRS = {'画像', 'images', 'img'}
PREFIX = re.compile(r'^\d+[_\-.\s　]+')


def label(name):
    """表示名：番号と拡張子を外し、Mac の濁点分離（NFD）を直す"""
    name = unicodedata.normalize('NFC', name)
    if name.endswith('.md'):
        name = name[:-3]
    return PREFIX.sub('', name).strip()


def visible(p):
    return not p.name.startswith(('_', '.')) and p.name not in SKIP_DIRS


def sort_key(p):
    m = re.match(r'^(\d+)', p.name)
    return (0, int(m.group(1)), p.name) if m else (1, 0, unicodedata.normalize('NFC', p.name))


# content 内の実ファイル（Mac でアップロードされた濁点分離の名前にも対応するため NFC で引けるようにする）
FILES = {}


def fix_links(text, md):
    """本文中の相対パス（画像・ページ）を、実際のファイル名に合わせて書き直す"""
    base = md.parent.relative_to(CONTENT).as_posix()

    def repl(m):
        bang, label, target = m.group(1), m.group(2), m.group(3)
        url = target[1:-1] if target.startswith('<') else target
        if re.match(r'^[a-z]+:|^#|^/', url, re.I):
            return m.group(0)
        want = posixpath.normpath(posixpath.join(base, unquote(url)))
        real = FILES.get(unicodedata.normalize('NFC', want))
        if not real:
            return m.group(0)
        return f'{bang}[{label}]({quote(real)})'      # content からのパスに統一
    return re.sub(r'(!?)\[([^\]]*)\]\((<[^>]+>|[^)\s]+)\)', repl, text)


def updated(md):
    """最終更新日：git の履歴から取得（取れなければファイルの更新日時）"""
    try:
        out = subprocess.run(['git', 'log', '-1', '--format=%cs', '--', str(md)], cwd=ROOT,
                             capture_output=True, text=True, timeout=10).stdout.strip()
        if out:
            return out
    except Exception:
        pass
    return datetime.date.fromtimestamp(md.stat().st_mtime).isoformat()


def page_info(md):
    text = md.read_text(encoding='utf-8-sig')
    kw = ''
    for line in text.splitlines()[:6]:
        m = re.match(r'^\s*(?:キーワード|keywords?)\s*[:：]\s*(.+)$', line, re.I)
        if m:
            kw = m.group(1).strip()
            break
    return {
        'title': label(md.name),
        'file': unicodedata.normalize('NFC', md.relative_to(CONTENT).as_posix()),
        'kw': kw,
        'updated': updated(md),
        'body': fix_links(text, md),
    }


def pages_in(folder):
    return [page_info(f) for f in sorted(folder.iterdir(), key=sort_key)
            if f.is_file() and f.suffix == '.md' and visible(f)]


def main():
    for f in CONTENT.rglob('*'):
        if f.is_file():
            rel = f.relative_to(CONTENT).as_posix()
            FILES[unicodedata.normalize('NFC', rel)] = rel
    cats = []
    for cdir in sorted((d for d in CONTENT.iterdir() if d.is_dir() and visible(d)), key=sort_key):
        groups = []
        loose = pages_in(cdir)              # カテゴリ直下に置いたページ
        if loose:
            groups.append({'name': '', 'pages': loose})
        for gdir in sorted((d for d in cdir.iterdir() if d.is_dir() and visible(d)), key=sort_key):
            ps = pages_in(gdir)
            if ps:
                groups.append({'name': label(gdir.name), 'pages': ps})
        cats.append({'name': label(cdir.name), 'groups': groups})
    out = CONTENT / 'nav.json'
    out.write_text(json.dumps({'cats': cats}, ensure_ascii=False), encoding='utf-8')
    total = sum(len(g['pages']) for c in cats for g in c['groups'])
    print(f'nav.json を作成しました（{len(cats)} カテゴリ / {total} ページ）')


if __name__ == '__main__':
    main()
