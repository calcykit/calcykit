/* =========================================================
   CalcyKit — render-content.js
   Reads /data/calculators/<slug>.json and renders the shared
   content grid into the placeholder elements below. Add a new
   calculator page by writing a JSON file, not new markup.

   Expected placeholder IDs on the page:
     #page-tag        - category badge text
     #breadcrumb-cat  - breadcrumb category link+label
     #breadcrumb-cur  - breadcrumb current page label
     #page-title      - <h1>
     #page-intro      - intro paragraph under h1
     #content-about   - "About this calculator" copy
     #content-howto   - How to Use steps (ordered list)
     #content-formula - formula box
     #content-example - example calculation table
     #content-sections- extra explanatory sections
     #content-faq     - FAQ accordion
     #content-related - related calculators grid
     #content-author  - author / last-updated strip

   Usage in a page:
     <body data-accent="blue" data-calculator="emi-calculator">
     ...
     <script src="/assets/js/render-content.js"></script>
   ========================================================= */

(function () {
  function el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content;
  }

  function renderHowTo(steps) {
    if (!steps || !steps.length) return '';
    const items = steps.map(s => `<li>${s}</li>`).join('');
    return `<h2>How to Use This Calculator</h2><ol>${items}</ol>`;
  }

  function renderFormula(formula) {
    if (!formula) return '';
    const vars = (formula.vars || [])
      .map(v => `<p><span>${v.symbol}</span> = ${v.desc}</p>`)
      .join('');
    return `
      <h2>Formula Explained</h2>
      <div class="formula-box">
        <div class="formula-title">${formula.title || 'Formula'}</div>
        <code>${formula.expression}</code>
        <div class="formula-vars">${vars}</div>
      </div>`;
  }

  function renderExample(example) {
    if (!example) return '';
    const rows = (example.rows || [])
      .map(r => {
        const cls = (example.highlightLabels || []).includes(r.label) ? ' class="highlight"' : '';
        return `<tr><td>${r.label}</td><td${cls}>${r.value}</td></tr>`;
      })
      .join('');
    return `
      <h2>Example Calculation</h2>
      <p>${example.intro || ''}</p>
      <table class="example-table">
        <thead><tr><th>Parameter</th><th>Value</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  function renderSections(sections) {
    if (!sections || !sections.length) return '';
    return sections.map(sec => {
      let body = `<h2>${sec.heading}</h2>`;
      if (sec.intro) body += `<p>${sec.intro}</p>`;
      if (sec.subsections) {
        body += sec.subsections.map(sub => `<h3>${sub.title}</h3><p>${sub.body}</p>`).join('');
      }
      if (sec.list) {
        body += `<ul>${sec.list.map(li => `<li>${li}</li>`).join('')}</ul>`;
      }
      return body;
    }).join('');
  }

  function renderFaq(faqs) {
    if (!faqs || !faqs.length) return '';
    const items = faqs.map(f => `
      <div class="faq-item">
        <div class="faq-question">
          ${f.q}
          <span class="faq-icon">+</span>
        </div>
        <div class="faq-answer"><p>${f.a}</p></div>
      </div>`).join('');
    return `<h2>Frequently Asked Questions</h2>${items}`;
  }

  function renderRelated(related) {
    if (!related || !related.length) return '';
    const cards = related.map(r => `
      <a href="${r.href}" class="related-card">
        <div class="related-icon">${r.icon}</div>
        <div>
          <div class="related-title">${r.title}</div>
          <div class="related-cat">${r.cat}</div>
        </div>
      </a>`).join('');
    return `<h2>Related Calculators</h2><div class="related-grid">${cards}</div>`;
  }

  function renderAuthor(author, lastUpdated) {
    if (!author) return '';
    const initials = author.initials || author.name.split(' ').map(w => w[0]).join('').slice(0, 2);
    return `
      <div class="author-box">
        <div class="author-avatar">${initials}</div>
        <div class="author-meta">
          <strong>${author.name}</strong>
          ${author.role ? author.role + ' · ' : ''}Last updated ${lastUpdated || ''}
        </div>
      </div>`;
  }

  function injectJsonLd(data) {
    if (data.faqs && data.faqs.length) {
      const faqLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": data.faqs.map(f => ({
          "@type": "Question",
          "name": f.q,
          "acceptedAnswer": { "@type": "Answer", "text": f.a.replace(/<[^>]+>/g, '') }
        }))
      };
      const s = document.createElement('script');
      s.type = 'application/ld+json';
      s.textContent = JSON.stringify(faqLd);
      document.head.appendChild(s);
    }
    if (data.title) {
      const appLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": data.title,
        "url": data.canonical || location.href,
        "description": data.metaDescription || data.intro,
        "applicationCategory": "FinanceApplication",
        "offers": { "@type": "Offer", "price": "0" }
      };
      const s = document.createElement('script');
      s.type = 'application/ld+json';
      s.textContent = JSON.stringify(appLd);
      document.head.appendChild(s);
    }
  }

  function setText(id, value) {
    const node = document.getElementById(id);
    if (node && value != null) node.textContent = value;
  }

  function setHtml(id, html) {
    const node = document.getElementById(id);
    if (node) node.innerHTML = html;
  }

  async function renderCalculatorContent() {
    const slug = document.body.getAttribute('data-calculator');
    if (!slug) return;

    let data;
    try {
      const res = await fetch(`/data/calculators/${slug}.json`);
      data = await res.json();
    } catch (err) {
      console.error('render-content.js: could not load content for', slug, err);
      return;
    }

    setText('page-tag', data.tag);
    setText('page-title', data.title);
    setText('page-intro', data.intro);

    if (data.breadcrumbCategory) {
      setHtml('breadcrumb-cat', `<a href="${data.breadcrumbCategory.href}">${data.breadcrumbCategory.label}</a> ›`);
    }
    setText('breadcrumb-cur', data.title);

    if (data.about) setHtml('content-about', `<h2>About This Calculator</h2><p>${data.about}</p>`);
    setHtml('content-howto', renderHowTo(data.howToUse));
    setHtml('content-formula', renderFormula(data.formula));
    setHtml('content-example', renderExample(data.example));
    setHtml('content-sections', renderSections(data.sections));
    setHtml('content-faq', renderFaq(data.faqs));
    setHtml('content-related', renderRelated(data.related));
    setHtml('content-author', renderAuthor(data.author, data.lastUpdated));

    if (data.metaTitle) document.title = data.metaTitle;
    injectJsonLd(data);
  }

  // FAQ accordion — event delegation so it works on content injected after load
  document.addEventListener('click', (e) => {
    const q = e.target.closest('.faq-question');
    if (q) q.parentElement.classList.toggle('open');
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderCalculatorContent);
  } else {
    renderCalculatorContent();
  }
})();
