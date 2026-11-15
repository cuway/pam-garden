import sys
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8123/"
OUT = Path(tempfile.gettempdir()) / "pam-check"
TARGETS = [
    ("iphone-15", "iPhone 15"),
    ("iphone-se", "iPhone SE"),
    ("ipad", "iPad (gen 7)"),
    ("desktop-1440", None),
]
SECTIONS = ["#top", "#story", "#monstera", "#anthurium", "#begonia", "#hoa", "#vuon", "#care", "#contact"]

AUDIT = """() => {
  const vw = document.documentElement.clientWidth, issues = [];
  if (document.documentElement.scrollWidth > vw + 1) issues.push(`page scrolls sideways: ${document.documentElement.scrollWidth} > ${vw}`);
  document.querySelectorAll("h1,h2,h3,p,.btn,.note,.pin,.mark,.clock").forEach(e => {
    if (e.closest(".shots,.marquee,.gate,.view") || getComputedStyle(e).display === "none") return;
    const r = e.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    if (r.width && (r.right > vw + 1 || r.left < -1)) issues.push(`outside viewport: ${e.className || e.tagName} [${Math.round(r.left)}, ${Math.round(r.right)}]`);
  });
  const bar = [...document.querySelectorAll(".bar > *")].filter(e => getComputedStyle(e).display !== "none").map(e => e.querySelector(":scope > span:not([style*=none])") && e.classList.contains("mark") ? e.querySelector(":scope > span") : e).map(e => e.getBoundingClientRect()).filter(r => r.width);
  for (let k = 1; k < bar.length; k++) if (bar[k].left - bar[k - 1].right < 8) issues.push(`header items too close: ${Math.round(bar[k].left - bar[k - 1].right)}px`);
  document.querySelectorAll(".split.in .w").forEach(w => {
    const a = w.getBoundingClientRect(), b = w.querySelector("i").getBoundingClientRect();
    if (getComputedStyle(w.querySelector("i")).transform !== "none") return;
    if (b.left < a.left - .5 || b.right > a.right + .5 || b.top < a.top - .5 || b.bottom > a.bottom + .5) issues.push(`word clipped: "${w.textContent}"`);
  });
  document.querySelectorAll("img[src]").forEach(i => {
    if (i.complete && !i.naturalWidth) issues.push(`broken image: ${i.getAttribute("src")}`);
  });
  return issues;
}"""


def run(p, name, device):
    browser = p.webkit.launch()
    opts = dict(p.devices[device]) if device else {"viewport": {"width": 1440, "height": 900}}
    page = browser.new_context(**opts).new_page()
    errors = []
    page.on("console", lambda m: m.type == "error" and errors.append(m.text))
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(URL, wait_until="networkidle")
    page.wait_for_timeout(800)
    page.screenshot(path=OUT / f"{name}-0-gate.png")
    if device and opts.get("has_touch"):
        page.tap(".gate")
    else:
        page.click(".gate")
    page.wait_for_timeout(2500)
    issues = set()
    for k, sel in enumerate(SECTIONS, 1):
        page.evaluate(f"document.querySelector('{sel}').scrollIntoView()")
        page.wait_for_timeout(1800)
        issues.update(f"{sel}: {i}" for i in page.evaluate(AUDIT))
        page.screenshot(path=OUT / f"{name}-{k}-{sel[1:]}.png")
    page.evaluate("document.querySelector('#hoa .shot').click()")
    page.wait_for_timeout(1200)
    if not page.evaluate("document.querySelector('.view').open && document.querySelector('.view img').naturalWidth > 0"):
        issues.add("photo viewer did not open")
    page.screenshot(path=OUT / f"{name}-viewer.png")
    browser.close()
    return sorted(issues) + [f"console: {e}" for e in errors]


if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    for old in OUT.glob("*.png"):
        old.unlink()
    failed = 0
    with sync_playwright() as p:
        for name, device in TARGETS:
            found = run(p, name, device)
            failed += len(found)
            print(f"{name}: {'ok' if not found else str(len(found)) + ' issue(s)'}")
            for f in found:
                print("  -", f)
    print("screenshots:", OUT)
    sys.exit(1 if failed else 0)
