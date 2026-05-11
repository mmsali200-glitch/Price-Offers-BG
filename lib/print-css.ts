/**
 * Professional @media print stylesheet shared by both language
 * renderers (Arabic RTL + English LTR). Injected before </head>
 * AFTER the template's own styles so it wins cascade.
 *
 * Design goals:
 *   - Balanced A4 layout with 15 mm margins.
 *   - Sections start on fresh pages where it improves reading.
 *   - No orphan headings, no widowed lines.
 *   - Shadows / blurs / gradients flattened for printer fidelity.
 *   - Grid layouts reflow to 2-3 columns to fit A4 width.
 *   - Running page number in the footer.
 *   - All brand colors preserved (print-color-adjust: exact).
 */

export const PRINT_CSS = `
<style id="bg-print-styles" media="print">
/* ─────────── Page setup ─────────── */
@page {
  size: A4 portrait;
  margin: 15mm 14mm 18mm;
}
@page :first {
  margin-top: 0;
}

/* Running footer with page number */
@page {
  @bottom-center {
    content: "Business Gate Technical Consulting  ·  www.businessesgates.com  ·  Page " counter(page) " of " counter(pages);
    font-family: 'Inter', 'Noto Sans Arabic', sans-serif;
    font-size: 9pt;
    color: #7a8e80;
  }
}

/* ─────────── Global print resets ─────────── */
@media print {
  *, *::before, *::after {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
    animation: none !important;
    transition: none !important;
    box-shadow: none !important;
    text-shadow: none !important;
  }

  html, body {
    background: #fff !important;
    font-size: 10.5pt !important;
    line-height: 1.55 !important;
  }

  /* Hide navigation chrome */
  #sidebar, .sidebar,
  #topbar, .topbar,
  #hamburger, .mobile-toggle,
  #overlay, .sidebar-overlay,
  #nav-toggle {
    display: none !important;
  }

  /* Main content takes the full printable width */
  .main, main.main, .content {
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    float: none !important;
  }

  /* ─────────── Section layout ─────────── */
  .section, section.section {
    padding: 14pt 0 !important;
    margin: 0 !important;
    border-bottom: 0.5pt solid #dfe6e1 !important;
    page-break-inside: avoid !important;
    break-inside: avoid-page !important;
    max-width: 100% !important;
    background: #fff !important;
  }
  .section:nth-child(even),
  .section:nth-child(odd) {
    background: #fff !important;
  }

  /* Start each major section on a new page except the first */
  #scope, #overview,
  #exec, #executive,
  #modules, #mods,
  #workflows, #flows,
  #phases, #plan,
  #pricing, #configurator,
  #financial, #fin,
  #installments, #inst,
  #schedule,
  #support,
  #terms,
  #sign {
    page-break-before: auto;
    break-before: auto;
  }

  #financial, #fin,
  #installments, #inst,
  #schedule,
  #sign {
    page-break-before: page;
    break-before: page;
  }

  /* ─────────── Hero ─────────── */
  #hero, section#hero, .hero {
    padding: 30pt 16pt !important;
    page-break-after: avoid !important;
    min-height: 0 !important;
    border-radius: 0 !important;
  }
  .hero-inner {
    padding: 0 !important;
    gap: 24pt !important;
  }
  .hero-title, .hero-co-name {
    font-size: 22pt !important;
    line-height: 1.2 !important;
  }
  .hero-client, .hero-client-name {
    font-size: 17pt !important;
  }
  .hero-subtitle, .hero-client-en {
    font-size: 10pt !important;
  }
  .hero-meta {
    gap: 8pt !important;
    margin-top: 14pt !important;
  }
  .hero-meta-card, .hero-badge {
    padding: 6pt 10pt !important;
    font-size: 9pt !important;
    border-radius: 5pt !important;
  }

  /* ─────────── Section headers ─────────── */
  .section-header {
    margin-bottom: 14pt !important;
    page-break-after: avoid !important;
  }
  .section-title {
    font-size: 16pt !important;
    letter-spacing: 0 !important;
  }
  .section-sub {
    font-size: 10pt !important;
  }
  .section-num {
    width: 28pt !important;
    height: 28pt !important;
    font-size: 11pt !important;
  }
  h1, h2, h3, h4 {
    page-break-after: avoid !important;
    break-after: avoid !important;
  }

  /* ─────────── Grids → collapse to fit A4 ─────────── */
  .mod-grid,
  .cards-grid-5, .cards-grid-4 {
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 8pt !important;
  }
  .feat-grid, .exec-grid,
  .phases-grid, .fin-grid, .plans-grid,
  .sup-grid, .kpi-grid,
  .cards-grid-3 {
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 10pt !important;
  }
  .resp-grid, .sign-grid, .terms-grid,
  .cards-grid-2 {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 12pt !important;
  }

  /* Cards tighter for print */
  .mod-card, .feat-card, .exec-card,
  .phase-card, .fin-card, .plan-card, .sup-card,
  .kpi-card, .lic-card, .mini-card, .card {
    padding: 9pt !important;
    border-radius: 4pt !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
  .mod-card .mod-name,
  .feat-title {
    font-size: 10.5pt !important;
  }
  .mod-card .mod-features,
  .feat-desc {
    font-size: 9pt !important;
    line-height: 1.45 !important;
  }
  .mod-card .mod-icon,
  .feat-icon {
    font-size: 16pt !important;
  }

  /* ─────────── Tables ─────────── */
  table {
    width: 100% !important;
    border-collapse: collapse !important;
    font-size: 9pt !important;
    page-break-inside: auto !important;
    break-inside: auto !important;
  }
  thead {
    display: table-header-group !important;
  }
  tr {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    page-break-after: auto !important;
  }
  th, td {
    padding: 6pt 8pt !important;
    border-bottom: 0.5pt solid #dfe6e1 !important;
  }
  th {
    background: #eaf3ed !important;
    color: #1a5c37 !important;
    font-weight: 700 !important;
    font-size: 9pt !important;
  }

  /* ─────────── Configurator ─────────── */
  .configurator, .cfg-wrap {
    border: 0.5pt solid #dfe6e1 !important;
    border-radius: 6pt !important;
    overflow: hidden !important;
  }
  .cfg-header {
    padding: 10pt 14pt !important;
  }
  .cfg-total-live {
    font-size: 18pt !important;
  }

  /* ─────────── Signature section ─────────── */
  #sign, section#sign {
    padding: 18pt 0 !important;
  }
  .sign-grid {
    gap: 18pt !important;
  }
  .sign-card {
    border: 0.5pt solid #c4d0c8 !important;
    padding: 14pt !important;
    min-height: 170pt !important;
  }
  .sign-line {
    border-bottom: 1pt solid #141f18 !important;
    margin-top: 36pt !important;
  }
  .sign-footer {
    margin-top: 20pt !important;
    padding-top: 12pt !important;
    border-top: 0.5pt solid #dfe6e1 !important;
  }

  /* ─────────── Typography niceties ─────────── */
  p { orphans: 3; widows: 3; }
  ul, ol { page-break-inside: avoid !important; }

  /* Avoid leaving a badge/price orphaned below its card */
  .badge, .hero-badge, .price, .lic-price, .sup-price {
    page-break-inside: avoid !important;
  }

  /* Hide any links to sections (they're useless on paper) */
  a[href^="#"] {
    color: inherit !important;
    text-decoration: none !important;
  }

  /* Prevent gradients from bleeding ink */
  .hero {
    background: #1a5c37 !important;
  }
}
</style>
`;
