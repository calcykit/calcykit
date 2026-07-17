/* =========================================================
   CalcyKit — include.js
   Injects shared partials (header, footer) into any element
   marked with data-include="partials/header.html".
   Usage in a page:
     <div data-include="/partials/header.html"></div>
     ...
     <div data-include="/partials/footer.html"></div>
     <script src="/assets/js/include.js"></script>
   ========================================================= */

(function () {
  async function loadIncludes() {
    const targets = document.querySelectorAll('[data-include]');
    await Promise.all(
      Array.from(targets).map(async (el) => {
        const path = el.getAttribute('data-include');
        try {
          const res = await fetch(path);
          if (!res.ok) throw new Error('Failed to load ' + path);
          el.outerHTML = await res.text();
        } catch (err) {
          console.error('include.js:', err);
        }
      })
    );
    document.dispatchEvent(new CustomEvent('includes:loaded'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadIncludes);
  } else {
    loadIncludes();
  }
})();
