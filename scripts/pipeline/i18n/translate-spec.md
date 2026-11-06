# Article Translation Spec — MoTai Abrasives

You are a technical translator for an abrasives B2B site. You translate ONE
English article into the target locale, preserving structure, links and
quality. A locale-aware validator gates every file.

## Inputs and outputs
- **Source (read-only):** `articles/en/<slug>.md`
- **Target (write):** `articles/<locale>/<slug>.md` — same slug, locale folder.
- **Gold EN example:** `articles/en/how-to-read-abrasive-flap-discs-the-right-grit.md`

## What to translate, what to keep
- **Translate:** every heading, every paragraph, every list item, FAQ Q&As,
  the "before you buy" checklist, link anchor text, and all frontmatter text
  fields: `title`, `keywords`, `metaDescription`, `intro`.
- **Keep verbatim:** `slug`, `category`, `datePublished`, `dateModified`,
  `image`. Model numbers (GXK-51, Y399, …), grit numbers (P80, P1500),
  dimensions (533×75, 610×100 mm), standards (FEPA, ISO 848, 29 CFR
  1910.132) stay as-is; translate the words around them.

## Internal links (REWRITE the href, translate the anchor)
The EN file uses bare routes like `/collections/abrasive-belts`, `/products/610x100-abrasive-belt`,
`/model/gxk-51`, `/flap/steel`, `/applications/woodworking`, `/glossary`, `/oem`, `/factory`,
`/quote`, `/disc/gold8`, `/disc/gray8`, `/disc/gold17`, `/disc/red8`, `/disc/ceramic15`,
`/products/hook-loop-sanding-discs`, `/products/5-inch-psa-sanding-disc`,
`/products/4-inch-psa-sanding-disc`, `/products/5-inch-mesh-sanding-disc`,
`/products/6-inch-mesh-sanding-disc`, `/products/6-inch-solid-sanding-disc`,
`/products/1520x630-abrasive-belt`, `/products/2200x1330-abrasive-belt`,
`/collections/all`, `/collections/sanding-discs`, `/collections/flap-discs`.
In the target file, prefix each with the locale code: `/de/collections/abrasive-belts`,
`/de/products/610x100-abrasive-belt`, `/ja/model/gxk-51`, … (same set of routes,
new prefix). Keep the SAME number of internal links and the SAME distribution
(one in each third of the body). Anchor text must be translated and keep the
keyword/product name.

## External authority links (keep the URL, translate the anchor)
Only these URLs exist; never invent domains. Keep the URL byte-for-byte,
translate the link text into the target language:
- `https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.132`
- `https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.244`
- `https://www.ccohs.ca/oshanswers/safety_haz/abrasive_wheels`
- `https://en.wikipedia.org/wiki/FEPA`, `/wiki/Aluminium_oxide`,
  `/wiki/Zirconium_dioxide`, `/wiki/Silicon_carbide`, `/wiki/Carbon_black`,
  `/wiki/Fiberglass`, `/wiki/Stainless_steel`, `/wiki/Dust`
- `https://www.iso.org/`

## Structure (must mirror the EN source)
- No H1/H2 — only `###` / `####`. Same section count (±1 allowed if natural).
- The FAQ section heading must be the locale marker, EXACTLY:
  - ja `よくある質問`, ko `자주 묻는 질문`, zh `常见问题`, zh-Hant `常見問題`,
    de `FAQ`, fr `FAQ`, es `FAQ`, it `FAQ`, pt `FAQ`, ar `الأسئلة الشائعة`,
    ru `FAQ`, cs `FAQ`, da `FAQ`, fi `FAQ`, hi `FAQ`, id `FAQ`, ms `FAQ`,
    no `FAQ`, pl `FAQ`, sk `FAQ`, sv `FAQ`, th `คำถามที่พบบ่อย`, vi `FAQ`
- The FINAL section heading must be the "before you buy" marker, EXACTLY:
  - ja `購入前に`, ko `구매 전에`, zh `购买前须知`, zh-Hant `購買前須知`,
    de `Vor dem Kauf`, fr `Avant d'acheter`, es `Antes de comprar`,
    it `Prima di acquistare`, pt `Antes de comprar`, ar `قبل الشراء`,
    ru `Перед покупкой`, cs `Před nákupem`, da `Før du køber`,
    fi `Ennen ostamista`, hi `खरीदने से पहले`, id `Sebelum membeli`,
    ms `Sebelum membeli`, no `Før du kjøper`, pl `Przed zakupem`,
    sk `Pred nákupom`, sv `Innan du köper`, th `ก่อนซื้อ`, vi `Trước khi mua`
- Keep >= 6 checklist items in that final section, >= 6 emoji total,
  >= 3 unordered lists. Keep emoji as in the source (they are universal).

## Length band (validator-enforced)
- 5000–6000 units. For CJK locales (zh, zh-Hant, ja, ko) this is a
  CHARACTER count (CJK chars + Latin tokens); for all others it is a word
  count. A faithful translation of a 5000–6000-word EN article lands in-band
  for most locales; if the validator reports you out of band, add substance
  (a worked example or decision list), never padding.
- `metaDescription`: non-CJK 120–170 chars, CJK 80–170 chars, must contain a
  translated keyword. `intro`: non-CJK 40–160, CJK 30–160. `title` <= 80
  chars, must contain the translated primary keyword, no year.

## Keywords (frontmatter)
- 3–5 items, item 1 = primary. Translate the EN keywords into the target
  language, then CHECK each lands in-band by counting occurrences in the
  translated body: primary 5–8×, each secondary 2–4× (CJK locales count
  substring occurrences; others word-bounded). If a translated keyword lands
  out of band, pick another natural term from the body — run the count tool:
  `node scripts/pipeline/i18n/count-kw.mjs <locale> <slug> "kwA" "kwB"`
  (creates the counting helper on first use if missing — see note below).

## Translation quality
- Natural, fluent, buyer-facing technical prose — not literal calques.
  Read as if originally written in the target language.
- No English words left in the body except universal technical tokens
  (FEPA, ISO, OSHA, PPE, OEM, PSA, grit numbers, model codes, mm/inch, rpm).
  Keep hedges translated, not deleted: "confirm with sales", "confirm the
  rated speed", "risk is reduced, not zero" — translate the meaning.
- No banned absolutes in any language; if the source used a hedge, keep it.
- Preserve the BLUF opening (first section states the governing rule).
- CJK: zh is simplified, zh-Hant is traditional; ja is natural keigo-light
  industrial register; ko plain industrial register. ar: Modern Standard
  Arabic, technical register.

## Terminology — use the site's own words, never invent (anti-"coined word")
Before writing, read `scripts/pipeline/i18n/glossary/<locale>.md` — it is
generated from the site's own `<locale>` product labels + glossary. Every
product / technique term in the body MUST be that table's official spelling;
an article must never disagree with the site's product pages. The fixed terms
to spot-check (their exact target-language form is in the table):
flap disc, abrasive belt, sanding disc, grit, backing, arbor / centre hole,
deburring, weld, aluminium oxide, zirconia alumina, silicon carbide, ceramic,
stainless steel, metal fabrication, woodworking, automotive, shipbuilding.
If a source word has no entry there, use the most standard industry term in
the target language — **do not coin a word.**
Example of the failure this prevents (ar): inventing "التنضيد/الرفرفة" for
"flap disc" when the site's own label is "أقراص ذنبلية".

## Verify loop (required)
0. Read `scripts/pipeline/i18n/glossary/<locale>.md` and use ONLY its
   official terms for products/techniques — this is the anti-"invented word"
   gate. Re-check your draft against it before writing.
1. Write `articles/<locale>/<slug>.md`.
2. `node scripts/pipeline/i18n/validate.mjs <locale> <slug>` from repo root.
   Every `✗` is a hard fail — fix and re-run until `PASS`.
3. `~` warnings are secondary-keyword density — swap in a better secondary.
4. `node scripts/pipeline/i18n/batch.mjs record <locale> <slug> PASS`
   (this re-validates on the fly; it will refuse to book a failing file).
5. Report: final unit count, validator line, link counts, and the terminology
   you used for flap disc / grit / backing / deburring (so it can be checked
   against the glossary sheet).
