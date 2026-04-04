import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CONTENT_PATH = ROOT / "docs" / "investor" / "provodnik-investor-one-pager.json"
OUTPUT_PATH = ROOT / "docs" / "investor" / "provodnik-investor-one-pager.html"


TEMPLATE = """<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{page_title}</title>
    <style>
      :root {{
        --bg: #f4f1ea;
        --paper: #fffdf9;
        --ink: #13212b;
        --muted: #5f6770;
        --line: #d9d3ca;
        --navy: #1f3547;
        --accent: #0f766e;
        --accent-soft: #deeee8;
        --slate-soft: #e9eef2;
        --gold: #9a7b3f;
      }}
      * {{ box-sizing: border-box; }}
      @page {{ size: A4; margin: 0; }}
      html, body {{
        margin: 0;
        padding: 0;
        width: 210mm;
        height: 297mm;
        overflow: hidden;
        background: var(--bg);
        color: var(--ink);
        font-family: "Segoe UI", "Trebuchet MS", sans-serif;
      }}
      body {{
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }}
      .page {{
        width: 210mm;
        height: 297mm;
        overflow: hidden;
        margin: 0 auto;
        position: relative;
        background:
          radial-gradient(circle at top right, rgba(15, 118, 110, 0.11), transparent 28%),
          linear-gradient(180deg, #f7f4ee 0%, #f4f1ea 100%);
      }}
      .page::before {{
        content: "";
        position: absolute;
        inset: 14mm;
        border: 1px solid rgba(31, 53, 71, 0.08);
        pointer-events: none;
      }}
      .inner {{
        padding: 15mm 15mm 10mm;
        position: relative;
      }}
      .hero {{
        display: grid;
        grid-template-columns: 1.5fr 0.9fr;
        gap: 5mm;
        margin-bottom: 4mm;
      }}
      .hero-main {{
        min-height: 58mm;
        padding: 7.5mm 7.2mm 6.8mm;
        border-radius: 6.2mm;
        color: #f8fbfc;
        background: linear-gradient(180deg, #21384a 0%, #152430 100%);
        position: relative;
        overflow: hidden;
      }}
      .hero-main::after {{
        content: "";
        position: absolute;
        right: -20mm;
        bottom: -22mm;
        width: 58mm;
        height: 58mm;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(15, 118, 110, 0.58), rgba(15, 118, 110, 0.08) 68%, transparent 72%);
      }}
      .kicker {{
        margin-bottom: 3.4mm;
        font-size: 8.6px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: rgba(248, 251, 252, 0.72);
      }}
      .title {{
        margin: 0 0 1.6mm;
        font-family: Georgia, "Times New Roman", serif;
        font-size: 27px;
        line-height: 1;
        letter-spacing: 0.06em;
      }}
      .subtitle {{
        margin: 0 0 2.7mm;
        max-width: 108mm;
        font-family: Georgia, "Times New Roman", serif;
        font-size: 16px;
        line-height: 1.18;
      }}
      .hero-copy {{
        max-width: 108mm;
        font-size: 10.1px;
        line-height: 1.42;
        color: rgba(248, 251, 252, 0.9);
      }}
      .proof {{
        min-height: 58mm;
        padding: 6mm 5.6mm;
        border-radius: 6.2mm;
        border: 1px solid rgba(19, 33, 43, 0.08);
        background: rgba(255, 253, 249, 0.84);
      }}
      .proof-label {{
        margin-bottom: 2.4mm;
        font-size: 8.6px;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: var(--accent);
      }}
      .proof-list {{
        display: grid;
        gap: 2.2mm;
      }}
      .proof-item strong {{
        display: block;
        margin-bottom: 0.8mm;
        font-size: 16.5px;
        line-height: 1;
        color: var(--navy);
      }}
      .proof-item span {{
        display: block;
        font-size: 9.2px;
        line-height: 1.26;
        color: var(--muted);
      }}
      .thesis-strip {{
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 3mm;
        margin-bottom: 4mm;
      }}
      .strip-card {{
        padding: 4.1mm 4mm 3.8mm;
        border-radius: 5mm;
        border: 1px solid var(--line);
        background: rgba(255, 253, 249, 0.78);
      }}
      .strip-label {{
        margin-bottom: 1.6mm;
        font-size: 7.9px;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: var(--gold);
      }}
      .strip-value {{
        margin-bottom: 1.2mm;
        font-family: Georgia, "Times New Roman", serif;
        font-size: 19px;
        line-height: 1;
        color: var(--navy);
      }}
      .strip-copy {{
        font-size: 8.9px;
        line-height: 1.34;
        color: var(--muted);
      }}
      .grid {{
        display: grid;
        grid-template-columns: 1.16fr 0.84fr;
        gap: 3mm;
        margin-bottom: 3mm;
      }}
      .panel {{
        padding: 4.6mm;
        border-radius: 5.6mm;
        border: 1px solid var(--line);
        background: var(--paper);
      }}
      .panel.soft {{
        background: linear-gradient(180deg, rgba(222, 238, 232, 0.94), rgba(255, 253, 249, 0.94));
      }}
      .section-tag {{
        display: inline-block;
        margin-bottom: 2.3mm;
        padding: 1.3mm 3mm;
        border-radius: 999px;
        font-size: 7.8px;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }}
      .section-tag.accent {{
        background: var(--accent);
        color: #f7fffd;
      }}
      .section-tag.slate {{
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
      .lead {{
        font-size: 9.4px;
        line-height: 1.38;
      }}
      .lead strong, .mini-copy strong, .point-copy strong {{
        color: var(--navy);
      }}
      .signal-stack {{
        display: grid;
        gap: 2.2mm;
      }}
      .signal {{
        padding-top: 2mm;
        border-top: 1px solid var(--line);
      }}
      .signal:first-child {{
        padding-top: 0;
        border-top: 0;
      }}
      .signal-kicker {{
        margin-bottom: 0.8mm;
        font-size: 7.2px;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: var(--muted);
      }}
      .signal-title {{
        margin-bottom: 0.8mm;
        font-family: Georgia, "Times New Roman", serif;
        font-size: 14px;
        line-height: 1.1;
        color: var(--navy);
      }}
      .signal-copy {{
        font-size: 8.8px;
        line-height: 1.3;
        color: var(--muted);
      }}
      .why-now {{
        margin-bottom: 3mm;
      }}
      .ordered-points {{
        display: grid;
        gap: 1.9mm;
      }}
      .point {{
        display: grid;
        grid-template-columns: 6.4mm 1fr;
        gap: 2mm;
        align-items: start;
      }}
      .point-num {{
        width: 6.4mm;
        height: 6.4mm;
        border-radius: 50%;
        background: var(--accent);
        color: #f7fffd;
        display: grid;
        place-items: center;
        font-size: 8.4px;
        font-weight: 700;
        margin-top: 0.2mm;
      }}
      .point-copy {{
        font-size: 8.9px;
        line-height: 1.3;
      }}
      .bottom {{
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 3mm;
      }}
      .bottom .panel {{
        min-height: 41mm;
      }}
      .mini-title {{
        margin-bottom: 1.6mm;
        font-family: Georgia, "Times New Roman", serif;
        font-size: 14px;
        line-height: 1.1;
        color: var(--navy);
      }}
      .mini-copy {{
        font-size: 8.6px;
        line-height: 1.3;
      }}
      .footer {{
        margin-top: 3mm;
        padding-top: 2.3mm;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 4mm;
        border-top: 1px solid rgba(31, 53, 71, 0.18);
      }}
      .footer-note {{
        max-width: 122mm;
        font-size: 7.3px;
        line-height: 1.32;
        color: var(--muted);
      }}
      .footer-mark {{
        font-size: 7.8px;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: var(--accent);
        white-space: nowrap;
      }}
    </style>
  </head>
  <body>
    <main class="page">
      <div class="inner">
        <section class="hero">
          <div class="hero-main">
            <div class="kicker">{kicker}</div>
            <h1 class="title">{brand}</h1>
            <p class="subtitle">{subtitle}</p>
            <p class="hero-copy">{hero_copy}</p>
          </div>
          <aside class="proof">
            <div class="proof-label">Category Validation</div>
            <div class="proof-list">
              {proof_items}
            </div>
          </aside>
        </section>
        <section class="thesis-strip">
          {strip_cards}
        </section>
        <section class="grid">
          <article class="panel">
            <div class="section-tag accent">Thesis</div>
            <h2>{thesis_title}</h2>
            <div class="lead">{thesis_body}</div>
          </article>
          <article class="panel">
            <div class="section-tag slate">Signals</div>
            <h2>Market Signals</h2>
            <div class="signal-stack">
              {signals}
            </div>
          </article>
        </section>
        <section class="panel soft why-now">
          <div class="section-tag accent">Why Now</div>
          <h2>Why This Works as an Investment Thesis</h2>
          <div class="ordered-points">
            {why_now_points}
          </div>
        </section>
        <section class="bottom">
          {bottom_cards}
        </section>
        <footer class="footer">
          <div class="footer-note">{footer}</div>
          <div class="footer-mark">{footer_mark}</div>
        </footer>
      </div>
    </main>
  </body>
</html>
"""


def render_proof_items(items: list[dict[str, str]]) -> str:
    return "\n".join(
        f"""<div class="proof-item"><strong>{item["value"]}</strong><span>{item["copy"]}</span></div>"""
        for item in items
    )


def render_strip_cards(items: list[dict[str, str]]) -> str:
    return "\n".join(
        f"""<article class="strip-card"><div class="strip-label">{item["label"]}</div><div class="strip-value">{item["value"]}</div><div class="strip-copy">{item["copy"]}</div></article>"""
        for item in items
    )


def render_signals(items: list[dict[str, str]]) -> str:
    return "\n".join(
        f"""<div class="signal"><div class="signal-kicker">{item["label"]}</div><div class="signal-title">{item["title"]}</div><div class="signal-copy">{item["copy"]}</div></div>"""
        for item in items
    )


def render_why_now(items: list[str]) -> str:
    return "\n".join(
        f"""<div class="point"><div class="point-num">{index}</div><div class="point-copy"><strong>{text.split(':', 1)[0]}:</strong>{text.split(':', 1)[1] if ':' in text else ' ' + text}</div></div>"""
        if ":" in text
        else f"""<div class="point"><div class="point-num">{index}</div><div class="point-copy">{text}</div></div>"""
        for index, text in enumerate(items, start=1)
    )


def render_bottom_cards(items: list[dict[str, str]]) -> str:
    return "\n".join(
        f"""<article class="panel"><div class="section-tag {item["tag_style"]}">{item["tag"]}</div><div class="mini-title">{item["title"]}</div><div class="mini-copy">{item["body"]}</div></article>"""
        for item in items
    )


def main() -> None:
    content = json.loads(CONTENT_PATH.read_text(encoding="utf-8"))
    meta = content["meta"]
    html = TEMPLATE.format(
        page_title=meta["title"],
        kicker=meta["kicker"],
        brand=meta["brand"],
        subtitle=meta["subtitle"],
        hero_copy=meta["hero_copy"],
        proof_items=render_proof_items(content["proof_items"]),
        strip_cards=render_strip_cards(content["strip_cards"]),
        thesis_title=content["thesis"]["title"],
        thesis_body=content["thesis"]["body"],
        signals=render_signals(content["signals"]),
        why_now_points=render_why_now(content["why_now"]),
        bottom_cards=render_bottom_cards(content["bottom_cards"]),
        footer=content["footer"],
        footer_mark=content["footer_mark"],
    )
    OUTPUT_PATH.write_text(html, encoding="utf-8")
    print(f"Generated {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
