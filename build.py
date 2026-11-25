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

staff = (root / "staff.html").read_text(encoding="utf-8")
assert tag in staff
staff = staff.replace(tag, "<script>\n" + cfg + "\n</script>")
qr = (root / "vendor" / "qrcode.js").read_text(encoding="utf-8")
staff = staff.replace('<script src="vendor/qrcode.js"></script>', "<script>\n" + qr + "\n</script>")
staff = staff.replace('base.value = location.href.replace(/staff\\.html.*$/, "index.html");', 'base.value = location.protocol.startsWith("http") ? location.href.replace(/[^/]*$/, "dede-quest.html") : "";')
for ext in ("html", "txt"):
    (root / "dist" / f"dede-staff.{ext}").write_text(staff, encoding="utf-8")
print("built staff", len(staff), "chars")
