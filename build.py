"""把 index.html 與 config.js 合併成單一檔案，輸出 dist/dede-quest.html 與 .txt（內容相同）。"""
import pathlib
root = pathlib.Path(__file__).parent
html = (root / "index.html").read_text(encoding="utf-8")
cfg = (root / "config.js").read_text(encoding="utf-8")
tag = '<script src="config.js"></script>'
assert tag in html
out = html.replace(tag, "<script>\n" + cfg + "\n</script>")
for ext in ("html", "txt"):
    (root / "dist" / f"dede-quest.{ext}").write_text(out, encoding="utf-8")
print("built", len(out), "chars")
