import json
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CONTENT_PATH = ROOT / "docs" / "investor" / "provodnik-investor-ru.json"
HTML_PATH = ROOT / "docs" / "investor" / "provodnik-investor-ru.html"
PDF_PATH = ROOT / "docs" / "investor" / "provodnik-investor-ru.pdf"


def render_proof_items(items: list[dict[str, str]]) -> str:
    return "\n".join(
        f'<div class="proof-item"><strong>{item["value"]}</strong><span>{item["copy"]}</span></div>'
        for item in items
    )


def render_market_cards(items: list[dict[str, str]]) -> str:
    return "\n".join(
        f'<article class="mini-card"><div class="mini-label">{item["label"]}</div><h3>{item["title"]}</h3><p>{item["copy"]}</p></article>'
        for item in items
    )


def render_bullets(items: list[str], class_name: str) -> str:
    return "\n".join(f'<li class="{class_name}">{item}</li>' for item in items)


def build_html(content: dict) -> str:
    meta = content["meta"]
    page1 = content["page1"]
    page2 = content["page2"]

    return f"""<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{meta["title"]}</title>
    <style>
      :root {{
        --bg: #f2eee7;
        --paper: #fffdf9;
        --ink: #13212b;
        --muted: #5c6770;
        --line: #dad4ca;
        --navy: #1d3447;
        --accent: #0f766e;
        --accent-soft: #e1f0eb;
        --slate-soft: #e9eef3;
        --sand: #efe6d7;
      }}

      * {{ box-sizing: border-box; }}

      @page {{
        size: A4;
        margin: 0;
      }}

      html, body {{
        margin: 0;
        padding: 0;
        background: var(--bg);
        color: var(--ink);
        font-family: "Segoe UI", "Trebuchet MS", sans-serif;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }}

      body {{
        width: 210mm;
      }}

      .page {{
        width: 210mm;
        min-height: 297mm;
        position: relative;
        overflow: hidden;
        margin: 0 auto;
        background:
          radial-gradient(circle at top right, rgba(15, 118, 110, 0.10), transparent 26%),
          linear-gradient(180deg, #f8f5ef 0%, #f2eee7 100%);
        page-break-after: always;
        break-after: page;
      }}

      .page:last-child {{
        page-break-after: auto;
        break-after: auto;
      }}

      .page::before {{
        content: "";
        position: absolute;
        inset: 14mm;
        border: 1px solid rgba(29, 52, 71, 0.08);
        pointer-events: none;
      }}

      .inner {{
        padding: 15mm 15mm 11mm;
        position: relative;
      }}

      .hero {{
        display: grid;
        grid-template-columns: 1.45fr 0.95fr;
        gap: 5mm;
        margin-bottom: 4mm;
      }}

      .hero-main {{
        min-height: 61mm;
        padding: 7.5mm 7.2mm 7mm;
        border-radius: 6mm;
        color: #f8fbfc;
        background: linear-gradient(180deg, #22384a 0%, #152430 100%);
        position: relative;
        overflow: hidden;
      }}

      .hero-main::after {{
        content: "";
        position: absolute;
        right: -18mm;
        bottom: -18mm;
        width: 54mm;
        height: 54mm;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(15, 118, 110, 0.58), rgba(15, 118, 110, 0.08) 68%, transparent 72%);
      }}

      .kicker {{
        margin-bottom: 3.4mm;
        font-size: 8.3px;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: rgba(248, 251, 252, 0.72);
      }}

      .brand {{
        margin: 0 0 1.5mm;
        font-family: Georgia, "Times New Roman", serif;
        font-size: 27px;
        line-height: 1;
        letter-spacing: 0.06em;
      }}

      .subtitle {{
        margin: 0 0 2.5mm;
        max-width: 110mm;
        font-family: Georgia, "Times New Roman", serif;
        font-size: 16px;
        line-height: 1.18;
      }}

      .hero-copy {{
        max-width: 112mm;
        font-size: 10px;
        line-height: 1.42;
        color: rgba(248, 251, 252, 0.92);
      }}

      .proof {{
        min-height: 61mm;
        padding: 6mm 5.8mm;
        border-radius: 6mm;
        border: 1px solid rgba(19, 33, 43, 0.08);
        background: rgba(255, 253, 249, 0.84);
      }}

      .proof-label {{
        margin-bottom: 2.2mm;
        font-size: 8.2px;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: var(--accent);
      }}

      .proof-list {{
        display: grid;
        gap: 2.1mm;
      }}

      .proof-item strong {{
        display: block;
        margin-bottom: 0.6mm;
        font-size: 16px;
        line-height: 1;
        color: var(--navy);
      }}

      .proof-item span {{
        display: block;
        font-size: 9.1px;
        line-height: 1.28;
        color: var(--muted);
      }}

      .mini-grid {{
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 3mm;
        margin-bottom: 4mm;
      }}

      .mini-card {{
        padding: 4.2mm 4mm;
        border-radius: 5mm;
        border: 1px solid var(--line);
        background: rgba(255, 253, 249, 0.82);
      }}

      .mini-label {{
        margin-bottom: 1.6mm;
        font-size: 7.8px;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: #9a7b3f;
      }}

      .mini-card h3 {{
        margin: 0 0 1.4mm;
        font-family: Georgia, "Times New Roman", serif;
        font-size: 16px;
        line-height: 1.1;
        color: var(--navy);
      }}

      .mini-card p {{
        margin: 0;
        font-size: 8.9px;
        line-height: 1.35;
        color: var(--muted);
      }}

      .split {{
        display: grid;
        grid-template-columns: 1.18fr 0.82fr;
        gap: 3mm;
        margin-bottom: 3mm;
      }}

      .panel {{
        padding: 4.8mm;
        border-radius: 5.8mm;
        border: 1px solid var(--line);
        background: var(--paper);
      }}

      .panel.soft {{
        background: linear-gradient(180deg, rgba(225, 240, 235, 0.95), rgba(255, 253, 249, 0.94));
      }}

      .tag {{
        display: inline-block;
        margin-bottom: 2.2mm;
        padding: 1.3mm 3mm;
        border-radius: 999px;
        font-size: 7.7px;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }}

      .tag.accent {{
        background: var(--accent);
        color: #f7fffd;
      }}

      .tag.slate {{
        background: var(--slate-soft);
        color: var(--navy);
      }}

      h2 {{
        margin: 0 0 2.2mm;
        font-family: Georgia, "Times New Roman", serif;
        font-size: 17px;
        line-height: 1.08;
        color: var(--navy);
      }}

      .body {{
        font-size: 9.2px;
        line-height: 1.38;
      }}

      .body strong, .list li strong {{
        color: var(--navy);
      }}

      .investor-list {{
        margin: 0;
        padding: 0;
        list-style: none;
        display: grid;
        gap: 2mm;
      }}

      .investor-list li {{
        position: relative;
        padding-left: 4.3mm;
        font-size: 8.9px;
        line-height: 1.32;
        color: var(--ink);
      }}

      .investor-list li::before {{
        content: "";
        position: absolute;
        left: 0;
        top: 1.35mm;
        width: 2.1mm;
        height: 2.1mm;
        border-radius: 50%;
        background: var(--accent);
      }}

      .headline {{
        margin: 0 0 2.6mm;
        font-family: Georgia, "Times New Roman", serif;
        font-size: 24px;
        line-height: 1.06;
        color: var(--navy);
      }}

      .intro {{
        margin: 0 0 4mm;
        max-width: 170mm;
        font-size: 10.1px;
        line-height: 1.46;
        color: var(--ink);
      }}

      .status-grid {{
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 3mm;
        margin-bottom: 3mm;
      }}

      .list {{
        margin: 0;
        padding: 0;
        list-style: none;
        display: grid;
        gap: 1.8mm;
      }}

      .list li {{
        position: relative;
        padding-left: 4.6mm;
        font-size: 8.8px;
        line-height: 1.32;
      }}

      .list li::before {{
        content: "";
        position: absolute;
        left: 0;
        top: 1.2mm;
        width: 2.3mm;
        height: 2.3mm;
        border-radius: 50%;
        background: var(--navy);
      }}

      .bottom-grid {{
        display: grid;
        grid-template-columns: 0.9fr 1.1fr;
        gap: 3mm;
      }}

      .stack-list, .milestone-list {{
        margin: 0;
        padding: 0;
        list-style: none;
        display: grid;
        gap: 1.9mm;
      }}

      .stack-list li, .milestone-list li {{
        position: relative;
        padding-left: 4.2mm;
        font-size: 8.8px;
        line-height: 1.32;
      }}

      .stack-list li::before, .milestone-list li::before {{
        content: "";
        position: absolute;
        left: 0;
        top: 1.2mm;
        width: 2.1mm;
        height: 2.1mm;
        border-radius: 50%;
        background: var(--accent);
      }}

      .footer {{
        position: absolute;
        left: 15mm;
        right: 15mm;
        bottom: 10mm;
        padding-top: 2.2mm;
        display: flex;
        justify-content: space-between;
        gap: 4mm;
        border-top: 1px solid rgba(29, 52, 71, 0.18);
      }}

      .footer-note {{
        max-width: 130mm;
        font-size: 7.2px;
        line-height: 1.3;
        color: var(--muted);
      }}

      .footer-mark {{
        white-space: nowrap;
        font-size: 7.8px;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: var(--accent);
      }}
    </style>
  </head>
  <body>
    <section class="page">
      <div class="inner">
        <div class="hero">
          <div class="hero-main">
            <div class="kicker">{meta["date_label"]}</div>
            <h1 class="brand">{meta["brand"]}</h1>
            <p class="subtitle">{meta["subtitle"]}</p>
            <div class="hero-copy">{page1["hero"]}</div>
          </div>
          <aside class="proof">
            <div class="proof-label">Research snapshot</div>
            <div class="proof-list">
              {render_proof_items(page1["proof_items"])}
            </div>
          </aside>
        </div>

        <div class="mini-grid">
          {render_market_cards(page1["market_cards"])}
        </div>

        <div class="split">
          <article class="panel">
            <div class="tag accent">Investment Thesis</div>
            <h2>{page1["thesis_title"]}</h2>
            <div class="body">{page1["thesis_body"]}</div>
          </article>
          <article class="panel soft">
            <div class="tag slate">Investor Lens</div>
            <h2>Ключевые выводы для инвестора</h2>
            <ul class="investor-list">
              {render_bullets(page1["investor_points"], "investor-item")}
            </ul>
          </article>
        </div>

        <div class="footer">
          <div class="footer-note">{content["footer"]}</div>
          <div class="footer-mark">{content["footer_mark"]}</div>
        </div>
      </div>
    </section>

    <section class="page">
      <div class="inner">
        <h1 class="headline">{page2["headline"]}</h1>
        <p class="intro">{page2["status_intro"]}</p>

        <div class="status-grid">
          <article class="panel">
            <div class="tag accent">Done</div>
            <h2>{page2["done_title"]}</h2>
            <ul class="list">
              {render_bullets(page2["done_items"], "done-item")}
            </ul>
          </article>
          <article class="panel soft">
            <div class="tag slate">Now / Next</div>
            <h2>{page2["now_title"]}</h2>
            <ul class="list">
              {render_bullets(page2["now_items"], "now-item")}
            </ul>
          </article>
        </div>

        <div class="bottom-grid">
          <article class="panel">
            <div class="tag slate">App Stack</div>
            <h2>{page2["stack_title"]}</h2>
            <ul class="stack-list">
              {render_bullets(page2["stack_items"], "stack-item")}
            </ul>
          </article>
          <article class="panel">
            <div class="tag accent">Milestones</div>
            <h2>{page2["milestone_title"]}</h2>
            <ul class="milestone-list">
              {render_bullets(page2["milestone_items"], "milestone-item")}
            </ul>
          </article>
        </div>

        <div class="footer">
          <div class="footer-note">{content["footer"]}</div>
          <div class="footer-mark">{content["footer_mark"]}</div>
        </div>
      </div>
    </section>
  </body>
</html>"""


def find_browser() -> str:
    candidates = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    ]
    for candidate in candidates:
        if Path(candidate).exists():
            return candidate
    raise FileNotFoundError("No supported browser found for PDF rendering.")


def render_pdf(browser: str) -> None:
    file_url = HTML_PATH.resolve().as_uri()
    subprocess.run(
        [
            browser,
            "--headless=new",
            "--disable-gpu",
            "--hide-scrollbars",
            "--print-to-pdf-no-header",
            f"--print-to-pdf={PDF_PATH}",
            file_url,
        ],
        check=True,
        capture_output=True,
        text=True,
    )


def main() -> None:
    content = json.loads(CONTENT_PATH.read_text(encoding="utf-8"))
    html = build_html(content)
    HTML_PATH.write_text(html, encoding="utf-8")
    browser = find_browser()
    render_pdf(browser)
    print(f"Generated {HTML_PATH}")
    print(f"Generated {PDF_PATH}")


if __name__ == "__main__":
    main()
