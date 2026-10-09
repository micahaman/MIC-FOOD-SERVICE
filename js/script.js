// Miguelito's International Corporation — shared site behavior

document.addEventListener('DOMContentLoaded', function () {

  // Futuristic hamburger nav — works for both the plain <ul> header
  // and the richer .nav-panel header (business-packages / toll-manufacturing)
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.querySelector('.site-nav > ul, .nav-panel');
  var backdrop = document.createElement('div');
  backdrop.className = 'nav-backdrop';
  document.body.appendChild(backdrop);

  function closeMenu() {
    if (!toggle || !menu) return;
    toggle.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');
    menu.classList.remove('open');
    backdrop.classList.remove('open');
    document.body.classList.remove('nav-locked');
  }

  function openMenu() {
    if (!toggle || !menu) return;
    toggle.classList.add('active');
    toggle.setAttribute('aria-expanded', 'true');
    menu.classList.add('open');
    backdrop.classList.add('open');
    document.body.classList.add('nav-locked');
  }

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      if (menu.classList.contains('open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // Close after picking a link
    menu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { closeMenu(); }
    });

    backdrop.addEventListener('click', closeMenu);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeMenu(); }
    });
  }

  // Highlight the current page in the main menu
  // Works with clean URLs (/about), legacy ones (/about.html) and the home page (./ or /)
  function pageName(path) {
    var name = path.split('#')[0].split('?')[0].split('/').pop().toLowerCase().replace(/\.html$/, '');
    return name === '' || name === '.' ? 'index' : name;
  }
  var currentPage = pageName(location.pathname);
  document.querySelectorAll('.nav-links a').forEach(function (link) {
    var target = pageName(link.getAttribute('href') || '');
    var isCurrent = target === currentPage ||
      (currentPage.indexOf('package-') === 0 && target === 'business-packages');
    if (isCurrent) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });

  // Shop Online dropdown (business-packages / toll-manufacturing headers)
  var shopToggle = document.querySelector('.shop-toggle');
  var shopDropdown = document.querySelector('.shop-dropdown');
  if (shopToggle && shopDropdown) {
    shopToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = shopDropdown.classList.toggle('open');
      shopToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (!shopDropdown.contains(e.target)) {
        shopDropdown.classList.remove('open');
        shopToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }


window.addEventListener("load", function () {
        const preloader = document.getElementById("preloader");
        if (!preloader) return;

        setTimeout(function () {
            preloader.classList.add("hide");
        }, 900);
  });


  // Duplicate ticker content for seamless looping
  var track = document.querySelector('.ticker-track');
  if (track) {
    track.innerHTML += track.innerHTML;
  }

    // Product category filter + live search (products.html, and any page reusing .filter-tab/.product-card)
  var tabs = document.querySelectorAll('.filter-tab');
  var cards = document.querySelectorAll('.product-card');
  var searchInput = document.getElementById('product-search-input');
  var noResults = document.getElementById('product-no-results');

  if (cards.length) {
    var activeCat = 'all';

    var applyFilters = function () {
      var query = searchInput ? searchInput.value.trim().toLowerCase() : '';
      var visibleCount = 0;

      cards.forEach(function (card) {
        var matchesCat = activeCat === 'all' || card.getAttribute('data-cat') === activeCat;
        var matchesSearch = query === '' || card.textContent.toLowerCase().indexOf(query) !== -1;
        var show = matchesCat && matchesSearch;
        card.style.display = show ? '' : 'none';
        if (show) visibleCount++;
      });

      if (noResults) { noResults.hidden = visibleCount !== 0; }
    };

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        activeCat = tab.getAttribute('data-cat');
        applyFilters();
      });
    });

    if (searchInput) {
      searchInput.addEventListener('input', applyFilters);
    }
  }

  // All Products catalog (products.html) — sourced from the shared
  // PRODUCTS_DATA array (js/products-data.js) so the product list only
  // has to live in one place, shared with the homepage's Featured
  // Products randomizer. Falls back to scraping the accordion galleries
  // if products-data.js failed to load for some reason.
  var allProductsGrid = document.getElementById('all-products-grid');
  if (allProductsGrid) {
    // 4 across on desktop; 6 per page on tablets/phones so the 3- and 2-column grids stay full
    function productsPageSize() { return window.matchMedia('(max-width: 900px)').matches ? 6 : 4; }

    var allProducts = (typeof PRODUCTS_DATA !== 'undefined' && PRODUCTS_DATA.length)
      ? PRODUCTS_DATA
      : Array.prototype.slice.call(document.querySelectorAll('.cat-item .sku-card')).map(function (card) {
        var img = card.querySelector('img');
        var titleClone = card.closest('.cat-item').querySelector('.cat-item-title').cloneNode(true);
        var numEl = titleClone.querySelector('.cat-item-num');
        if (numEl) numEl.remove();
        return {
          src: img.getAttribute('src'),
          alt: img.getAttribute('alt') || '',
          name: card.querySelector('.sku-name') ? card.querySelector('.sku-name').textContent : '',
          sub: card.querySelector('.sku-sub') ? card.querySelector('.sku-sub').textContent : '',
          category: titleClone.textContent.trim()
        };
      });

    var filteredProducts = allProducts;
    var productsPage = 0;

    var productSearchInput = document.getElementById('product-search-input');
    var productNoResults = document.getElementById('product-no-results');
    var productsPrevBtn = document.getElementById('products-prev-btn');
    var productsNextBtn = document.getElementById('products-next-btn');
    var productsResetBtn = document.getElementById('all-products-reset');
    var productsIndicator = document.getElementById('products-page-indicator');

    function renderProductsPage() {
      allProductsGrid.innerHTML = '';
      var total = filteredProducts.length;
      var totalPages = Math.max(1, Math.ceil(total / productsPageSize()));
      if (productsPage >= totalPages) productsPage = 0;
      var start = productsPage * productsPageSize();
      var pageItems = filteredProducts.slice(start, start + productsPageSize());

      pageItems.forEach(function (p) {
        var card = document.createElement('div');
        card.className = 'product-card';

        var media = document.createElement('div');
        media.className = 'product-media';
        var img = document.createElement('img');
        img.src = p.src;
        img.alt = p.alt;
        img.loading = 'lazy';
        media.appendChild(img);

        var body = document.createElement('div');
        body.className = 'product-body';

        var catSpan = document.createElement('span');
        catSpan.className = 'product-cat';
        catSpan.textContent = p.category;

        var h3 = document.createElement('h3');
        h3.textContent = p.name;

        var meta = document.createElement('div');
        meta.className = 'product-meta';
        var metaSpan = document.createElement('span');
        metaSpan.textContent = p.sub || ' ';
        meta.appendChild(metaSpan);

        var desc = document.createElement('p');
        desc.textContent = p.desc || '';

        body.appendChild(catSpan);
        body.appendChild(h3);
        if (p.desc) body.appendChild(desc);
        body.appendChild(meta);
        card.appendChild(media);
        card.appendChild(body);
        allProductsGrid.appendChild(card);
      });

      if (productNoResults) productNoResults.hidden = total !== 0;
      if (productsIndicator) {
        productsIndicator.textContent = total === 0 ? '0 / 0' : (productsPage + 1) + ' / ' + totalPages;
      }
      if (productsPrevBtn) productsPrevBtn.disabled = productsPage === 0;
      if (productsNextBtn) productsNextBtn.disabled = productsPage >= totalPages - 1;
    }

    function applyProductSearch() {
      var query = productSearchInput ? productSearchInput.value.trim().toLowerCase() : '';
      filteredProducts = query === '' ? allProducts : allProducts.filter(function (p) {
        return (p.name + ' ' + p.sub + ' ' + p.category + ' ' + (p.desc || '')).toLowerCase().indexOf(query) !== -1;
      });
      productsPage = 0;
      renderProductsPage();
    }

    if (productSearchInput) {
      productSearchInput.addEventListener('input', applyProductSearch);
    }

    if (productsPrevBtn) {
      productsPrevBtn.addEventListener('click', function () {
        if (productsPage > 0) {
          productsPage--;
          renderProductsPage();
        }
      });
    }

    if (productsNextBtn) {
      productsNextBtn.addEventListener('click', function () {
        var totalPages = Math.max(1, Math.ceil(filteredProducts.length / productsPageSize()));
        if (productsPage < totalPages - 1) {
          productsPage++;
          renderProductsPage();
        }
      });
    }

    if (productsResetBtn) {
      productsResetBtn.addEventListener('click', function () {
        if (productSearchInput) productSearchInput.value = '';
        filteredProducts = allProducts;
        productsPage = 0;
        renderProductsPage();
      });
    }

    renderProductsPage();

    var pageSizeQuery = window.matchMedia('(max-width: 900px)');
    var onPageSizeChange = function () { productsPage = 0; renderProductsPage(); };
    if (pageSizeQuery.addEventListener) { pageSizeQuery.addEventListener('change', onPageSizeChange); }
    else if (pageSizeQuery.addListener) { pageSizeQuery.addListener(onPageSizeChange); }
  }

  // Machines & Equipment (machines.html) — paginated grid, category tabs, and
  // search, sourced from js/machines-data.js. One row of MACHINES_PAGE_SIZE
  // cards per page, with arrows to browse the rest — same pattern as the
  // All Products grid above.
  var allMachinesGrid = document.getElementById('all-machines-grid');
  if (allMachinesGrid && typeof MACHINES_DATA !== 'undefined' && MACHINES_DATA.length) {
    var MACHINES_PAGE_SIZE = 6;
    var allMachines = MACHINES_DATA;
    var filteredMachines = allMachines;
    var machinesPage = 0;
    var machineActiveCat = 'all';

    var machineSearchInput = document.getElementById('machine-search-input');
    var machineNoResults = document.getElementById('machine-no-results');
    var machinesPrevBtn = document.getElementById('machines-prev-btn');
    var machinesNextBtn = document.getElementById('machines-next-btn');
    var machinesIndicator = document.getElementById('machines-page-indicator');
    var machineTabs = document.querySelectorAll('.filter-tab[data-cat]');

    function renderMachinesPage() {
      allMachinesGrid.innerHTML = '';
      var total = filteredMachines.length;
      var totalPages = Math.max(1, Math.ceil(total / MACHINES_PAGE_SIZE));
      if (machinesPage >= totalPages) machinesPage = 0;
      var start = machinesPage * MACHINES_PAGE_SIZE;
      var pageItems = filteredMachines.slice(start, start + MACHINES_PAGE_SIZE);

      pageItems.forEach(function (m) {
        var card = document.createElement('div');
        card.className = 'product-card';

        var media = document.createElement('div');
        media.className = 'product-media';
        var img = document.createElement('img');
        img.src = m.src;
        img.alt = m.alt;
        img.loading = 'lazy';
        media.appendChild(img);

        var body = document.createElement('div');
        body.className = 'product-body';

        var catSpan = document.createElement('span');
        catSpan.className = 'product-cat';
        catSpan.textContent = m.category;
        body.appendChild(catSpan);

        var h3 = document.createElement('h3');
        h3.textContent = m.name;
        body.appendChild(h3);

        // Always render the description slot, even empty, so every card
        // reserves the same height and the pagination arrows never move.
        var desc = document.createElement('p');
        desc.textContent = m.desc || '';
        body.appendChild(desc);

        card.appendChild(media);
        card.appendChild(body);
        allMachinesGrid.appendChild(card);
      });

      if (machineNoResults) machineNoResults.hidden = total !== 0;
      if (machinesIndicator) {
        machinesIndicator.textContent = total === 0 ? '0 / 0' : (machinesPage + 1) + ' / ' + totalPages;
      }
      if (machinesPrevBtn) machinesPrevBtn.disabled = machinesPage === 0;
      if (machinesNextBtn) machinesNextBtn.disabled = machinesPage >= totalPages - 1;
    }

    function applyMachineFilters() {
      var query = machineSearchInput ? machineSearchInput.value.trim().toLowerCase() : '';
      filteredMachines = allMachines.filter(function (m) {
        var matchesCat = machineActiveCat === 'all' || m.catKey === machineActiveCat;
        var matchesSearch = query === '' ||
          (m.name + ' ' + m.category + ' ' + (m.desc || '')).toLowerCase().indexOf(query) !== -1;
        return matchesCat && matchesSearch;
      });
      machinesPage = 0;
      renderMachinesPage();
    }

    machineTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        machineTabs.forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        machineActiveCat = tab.getAttribute('data-cat');
        applyMachineFilters();
      });
    });

    if (machineSearchInput) {
      machineSearchInput.addEventListener('input', applyMachineFilters);
    }
    if (machinesPrevBtn) {
      machinesPrevBtn.addEventListener('click', function () {
        if (machinesPage > 0) { machinesPage--; renderMachinesPage(); }
      });
    }
    if (machinesNextBtn) {
      machinesNextBtn.addEventListener('click', function () {
        var totalPages = Math.max(1, Math.ceil(filteredMachines.length / MACHINES_PAGE_SIZE));
        if (machinesPage < totalPages - 1) { machinesPage++; renderMachinesPage(); }
      });
    }

    renderMachinesPage();
  }

  // Featured Products (index.html) — random pick from the shared product
  // catalog (js/products-data.js), reshuffled on every page load.
  var featuredGrid = document.getElementById('featured-products-grid');
  if (featuredGrid && typeof PRODUCTS_DATA !== 'undefined' && PRODUCTS_DATA.length) {
    // 3 across on tablets, 4 on desktop and (as 2 x 2) on phones
    var FEATURED_COUNT = window.matchMedia('(min-width: 561px) and (max-width: 900px)').matches ? 3 : 4;
    var featuredPool = PRODUCTS_DATA.slice();
    for (var fi = featuredPool.length - 1; fi > 0; fi--) {
      var fj = Math.floor(Math.random() * (fi + 1));
      var ftmp = featuredPool[fi]; featuredPool[fi] = featuredPool[fj]; featuredPool[fj] = ftmp;
    }

    featuredPool.slice(0, FEATURED_COUNT).forEach(function (p) {
      var card = document.createElement('div');
      card.className = 'product-card';

      var media = document.createElement('div');
      media.className = 'product-media';
      var img = document.createElement('img');
      img.src = p.src;
      img.alt = p.alt;
      img.loading = 'lazy';
      media.appendChild(img);

      var body = document.createElement('div');
      body.className = 'product-body';

      var catSpan = document.createElement('span');
      catSpan.className = 'product-cat';
      catSpan.textContent = p.category;

      var h3 = document.createElement('h3');
      h3.textContent = p.name;

      var desc = document.createElement('p');
      desc.textContent = p.desc || '';

      var meta = document.createElement('div');
      meta.className = 'product-meta';
      var metaSpan = document.createElement('span');
      metaSpan.textContent = p.sub || ' ';
      meta.appendChild(metaSpan);

      body.appendChild(catSpan);
      body.appendChild(h3);
      if (p.desc) body.appendChild(desc);
      body.appendChild(meta);
      card.appendChild(media);
      card.appendChild(body);
      featuredGrid.appendChild(card);
    });
  }

  // Hero full-width slider
  var slider = document.getElementById('hero-stack');
  if (slider) {
    var slides = Array.prototype.slice.call(slider.querySelectorAll('.hero-slide'));
    var dots = document.querySelectorAll('.hero-dot');
    var total = slides.length;
    var current = 0;

    function renderSlider() {
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === current);
      });
    }

    slider.querySelector('.hero-slide-next').addEventListener('click', function () {
      current = (current + 1) % total;
      renderSlider();
    });
    slider.querySelector('.hero-slide-prev').addEventListener('click', function () {
      current = (current - 1 + total) % total;
      renderSlider();
    });
    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        current = parseInt(dot.getAttribute('data-goto'), 10);
        renderSlider();
      });
    });

    renderSlider();
  }

  // ------------------------------------------------------------------
  // Forms — submissions are emailed with FormSubmit.co (no server needed).
  // To change where inquiries go, edit FORM_RECIPIENT. The very first
  // submission makes FormSubmit email that address once to confirm it.
  // ------------------------------------------------------------------
  var FORM_RECIPIENT = 'sales@miguelitoscorp.com';
  var FORM_ENDPOINT = 'https://formsubmit.co/ajax/' + FORM_RECIPIENT;
  var MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
  // Spam protection (no CAPTCHA): honeypot field, a minimum fill time,
  // a cap on links in free-text fields, and a cooldown between sends.
  var MIN_FILL_MS = 3000;
  var MAX_LINKS = 3;
  var COOLDOWN_MS = 60 * 1000;
  var COOLDOWN_KEY = 'mic-last-inquiry';

  function wireForm(form, statusEl, options) {
    if (!form || !statusEl) return;
    var button = form.querySelector('button[type="submit"]');
    var idleLabel = button ? button.textContent : '';
    var shownAt = Date.now();
    statusEl.setAttribute('role', 'status');
    statusEl.setAttribute('aria-live', 'polite');

    function show(message, kind) {
      statusEl.textContent = message;
      statusEl.className = kind || '';
    }

    // Mark fields invalid only after the visitor has touched them
    form.addEventListener('blur', function (e) {
      var el = e.target;
      if (el.matches && el.matches('input, select, textarea')) el.classList.add('is-touched');
    }, true);

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Spam trap: real visitors never fill the hidden field
      var trap = form.querySelector('[name="_honey"]');
      if (trap && trap.value) { form.reset(); return; }

      // Required fields must contain more than whitespace
      form.querySelectorAll('[required]').forEach(function (el) {
        if (el.type !== 'file' && typeof el.value === 'string' && el.value.trim() === '') el.value = '';
      });
      form.querySelectorAll('input, select, textarea').forEach(function (el) { el.classList.add('is-touched'); });
      if (!form.reportValidity()) return;

      // Bots submit instantly; people take at least a few seconds
      if (Date.now() - shownAt < MIN_FILL_MS) {
        show('Please take a moment to review your details, then send again.', 'error');
        return;
      }
      var linkCount = 0;
      form.querySelectorAll('textarea, input[type="text"]').forEach(function (el) {
        linkCount += (el.value.match(/https?:\/\/|www\./gi) || []).length;
      });
      if (linkCount > MAX_LINKS) {
        show('Your message contains too many links. Please remove some and try again.', 'error');
        return;
      }
      var last = 0;
      try { last = parseInt(localStorage.getItem(COOLDOWN_KEY), 10) || 0; } catch (err) {}
      if (Date.now() - last < COOLDOWN_MS) {
        show('Thanks — we just received an inquiry from you. Please wait a minute before sending another.', 'error');
        return;
      }

      var data = new FormData(form);
      var fileInput = form.querySelector('input[type="file"]');
      if (fileInput) {
        var file = fileInput.files && fileInput.files[0];
        if (!file) {
          data.delete(fileInput.name);
        } else if (file.size > MAX_ATTACHMENT_BYTES) {
          show('That file is larger than 5 MB. Please attach a smaller file or send it to us by email.', 'error');
          return;
        }
      }
      data.append('_subject', options.subject(form));
      data.append('_template', 'table');
      data.append('_captcha', 'false');

      if (button) { button.disabled = true; button.textContent = 'Sending…'; }
      show('', '');

      fetch(FORM_ENDPOINT, { method: 'POST', body: data, headers: { 'Accept': 'application/json' } })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (body) {
            return { ok: res.ok, body: body };
          });
        })
        .then(function (result) {
          var accepted = result.ok && (result.body.success === true || result.body.success === 'true');
          if (!accepted) throw new Error(result.body.message || 'Request failed');
          show(options.success, 'success');
          try { localStorage.setItem(COOLDOWN_KEY, String(Date.now())); } catch (err) {}
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({ event: 'generate_lead', form_id: form.id });
          form.reset();
          form.querySelectorAll('.is-touched').forEach(function (el) { el.classList.remove('is-touched'); });
          if (options.afterReset) options.afterReset();
        })
        .catch(function () {
          show("Sorry, we couldn't send your inquiry just now. Please try again in a moment, or email us directly at " + FORM_RECIPIENT + '.', 'error');
        })
        .then(function () {
          if (button) { button.disabled = false; button.textContent = idleLabel; }
        });
    });
  }

  wireForm(document.getElementById('contact-form'), document.getElementById('form-status'), {
    subject: function (form) {
      var select = form.querySelector('#inquiry');
      var label = select && select.options[select.selectedIndex] ? select.options[select.selectedIndex].text : 'Inquiry';
      return 'Miguelitos website — ' + label;
    },
    success: "Thank you for reaching out. We've received your inquiry and will get back to you shortly.",
    afterReset: function () { updateProductServiceVisibility(); }
  });

  wireForm(document.getElementById('toll-inquiry-form'), document.getElementById('toll-form-status'), {
    subject: function () { return 'Miguelitos website — Toll manufacturing inquiry'; },
    success: 'Thank you for your inquiry. A member of our team will review your brief and get back to you shortly.'
  });

  // Contact form — show "Product or Service" only for inquiry types where it's relevant
  var inquiryTypeSelect = document.getElementById('inquiry');
  var productServiceField = document.getElementById('product-service-field');
  var PRODUCT_SERVICE_RELEVANT_TYPES = ['product', 'equipment', 'package', 'toll'];

  function updateProductServiceVisibility() {
    if (!inquiryTypeSelect || !productServiceField) return;
    productServiceField.hidden = PRODUCT_SERVICE_RELEVANT_TYPES.indexOf(inquiryTypeSelect.value) === -1;
  }

  if (inquiryTypeSelect && productServiceField) {
    inquiryTypeSelect.addEventListener('change', updateProductServiceVisibility);
    updateProductServiceVisibility();
  }

  // Inquiry Routing cards (contact.html) — clicking a card pre-selects the
  // matching Inquiry Type in the form below and scrolls to it.
  document.querySelectorAll('.cert-card--link[data-inquiry]').forEach(function (card) {
    card.addEventListener('click', function () {
      if (!inquiryTypeSelect) return;
      inquiryTypeSelect.value = card.getAttribute('data-inquiry');
      updateProductServiceVisibility();
    });
  });

    // Scroll-reveal — automatically applies to key elements across every page
  var revealTargets = document.querySelectorAll(
    '.section-head, .product-card, .cert-card, .process-step, .timeline-item, ' +
    '.info-item, .hero-slot, .partner-strip .partner-name'
  );
  if (revealTargets.length && 'IntersectionObserver' in window) {
    revealTargets.forEach(function (el, i) {
      el.classList.add('reveal');
      el.style.transitionDelay = (i % 4) * 70 + 'ms';
    });

    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    revealTargets.forEach(function (el) { revealObserver.observe(el); });
  }

  document.querySelectorAll('.cat-item-trigger').forEach(function (trigger) {
  trigger.addEventListener('click', function () {
    var item = trigger.closest('.cat-item');
    var panel = item.querySelector('.cat-item-panel');
    var isOpen = trigger.getAttribute('aria-expanded') === 'true';

    document.querySelectorAll('.cat-item-trigger').forEach(function (other) {
      if (other !== trigger) {
        other.setAttribute('aria-expanded', 'false');
        var otherItem = other.closest('.cat-item');
        otherItem.classList.remove('is-open');
        otherItem.querySelector('.cat-item-panel').style.maxHeight = null;
      }
    });

    trigger.setAttribute('aria-expanded', String(!isOpen));
    item.classList.toggle('is-open', !isOpen);
    panel.style.maxHeight = !isOpen ? panel.scrollHeight + 'px' : null;
  });
});

  // Paginate SKU photo galleries in the product category accordion — show a
  // page of tiles at a time with prev/next arrows once a category has more
  // than PAGE_SIZE products.
  var SKU_PAGE_SIZE = 12;
  document.querySelectorAll('.sku-gallery').forEach(function (gallery) {
    var cards = Array.prototype.slice.call(gallery.children).filter(function (el) {
      return el.classList.contains('sku-card');
    });
    if (cards.length <= SKU_PAGE_SIZE) return;

    var totalPages = Math.ceil(cards.length / SKU_PAGE_SIZE);
    var currentPage = 0;

    var pagination = document.createElement('div');
    pagination.className = 'sku-pagination';
    pagination.innerHTML =
      '<button type="button" class="sku-page-btn sku-page-prev" aria-label="Previous products">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 5l-7 7 7 7"/></svg>' +
      '</button>' +
      '<span class="sku-page-indicator"></span>' +
      '<button type="button" class="sku-page-btn sku-page-next" aria-label="Next products">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg>' +
      '</button>';
    gallery.insertAdjacentElement('afterend', pagination);

    var prevBtn = pagination.querySelector('.sku-page-prev');
    var nextBtn = pagination.querySelector('.sku-page-next');
    var indicator = pagination.querySelector('.sku-page-indicator');

    function renderPage() {
      cards.forEach(function (card, i) {
        card.style.display = Math.floor(i / SKU_PAGE_SIZE) === currentPage ? '' : 'none';
      });
      indicator.textContent = (currentPage + 1) + ' / ' + totalPages;
      prevBtn.disabled = currentPage === 0;
      nextBtn.disabled = currentPage === totalPages - 1;

      // Keep an already-open accordion panel's max-height in sync so the
      // new page isn't clipped or left with a gap below it.
      var panel = gallery.closest('.cat-item-panel');
      if (panel && panel.style.maxHeight) {
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    }

    prevBtn.addEventListener('click', function () {
      if (currentPage > 0) { currentPage--; renderPage(); }
    });
    nextBtn.addEventListener('click', function () {
      if (currentPage < totalPages - 1) { currentPage++; renderPage(); }
    });

    renderPage();
  });

  // Open + scroll to the matching accordion item when linked via #hash (e.g. products.html#coffee)
  if (window.location.hash) {
    var targetItem = document.querySelector('.cat-item' + window.location.hash);
    if (targetItem) {
      var targetTrigger = targetItem.querySelector('.cat-item-trigger');
      var targetPanel = targetItem.querySelector('.cat-item-panel');
      targetTrigger.setAttribute('aria-expanded', 'true');
      targetItem.classList.add('is-open');
      targetPanel.style.maxHeight = targetPanel.scrollHeight + 'px';
      setTimeout(function () {
        targetItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }


  // ------------------------------------------------------------------
  // Product spotlight — click any product card to zoom it in, together
  // with its description. Works on every page that shows product cards.
  // ------------------------------------------------------------------
  (function () {
    var CARD_SELECTOR = '.product-card, .sku-card, .new-card';
    var byImage = {};

    function imageKey(src) {
      try { return decodeURIComponent(new URL(src, window.location.href).pathname); }
      catch (err) { return src || ''; }
    }

    if (typeof PRODUCTS_DATA !== 'undefined') {
      PRODUCTS_DATA.forEach(function (p) { byImage[imageKey(p.src)] = p; });
    }

    function textOf(el, selector) {
      var node = el.querySelector(selector);
      return node ? node.textContent.replace(/\s+/g, ' ').trim() : '';
    }

    // One-sentence descriptions on the category galleries (products.html)
    document.querySelectorAll('.sku-card').forEach(function (card) {
      var img = card.querySelector('img');
      var caption = card.querySelector('figcaption');
      var product = img && byImage[imageKey(img.getAttribute('src'))];
      if (product && product.desc && caption && !caption.querySelector('.sku-desc')) {
        var line = document.createElement('span');
        line.className = 'sku-desc';
        line.textContent = product.desc;
        caption.appendChild(line);
      }
    });

    function readCard(card) {
      var img = card.querySelector('img');
      var known = img ? byImage[imageKey(img.getAttribute('src'))] : null;
      var metaParts = [];
      card.querySelectorAll('.product-meta span, .new-head span').forEach(function (span) {
        var value = span.textContent.replace(/\s+/g, ' ').trim();
        if (value) metaParts.push(value);
      });
      var info = {
        src: img ? (img.currentSrc || img.src) : '',
        back: '',
        shelf: '',
        storage: '',
        allergen: '',
        svg: (!img && card.querySelector('.product-media svg')) ? card.querySelector('.product-media svg').outerHTML : '',
        alt: img ? img.alt : '',
        name: textOf(card, '.sku-name, h3'),
        category: textOf(card, '.product-cat'),
        desc: textOf(card, '.sku-desc, .product-body p, .new-card > p'),
        meta: metaParts.join(' · ') || textOf(card, '.sku-sub')
      };
      if (!info.category) {
        var section = card.closest('.cat-item');
        var title = section && section.querySelector('.cat-item-title');
        if (title) info.category = title.textContent.replace(/^\s*\d+\s*/, '').replace(/\s+/g, ' ').trim();
      }
      if (known) {
        info.name = known.name;
        info.desc = known.desc || info.desc;
        info.meta = known.sub || info.meta;
        info.category = known.category;
        info.alt = known.alt || info.alt;
        info.back = known.back ? new URL(known.back, window.location.href).href : '';
        info.shelf = known.shelf || '';
        info.storage = known.storage || '';
        info.allergen = known.allergen || '';
      }
      if (card.classList.contains('new-card')) info.category = 'New Product';
      return info;
    }

    var overlay, panel, closeBtn, media, magnifier, lastFocus, closeTimer;
    var ZOOM = 2.4;
    var TOUCH_ZOOM = 3;
    var touchImg = null;

    function build() {
      if (overlay) return;
      overlay = document.createElement('div');
      overlay.className = 'spotlight';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-labelledby', 'spotlight-title');
      overlay.hidden = true;
      overlay.innerHTML =
        '<div class="spotlight-backdrop" data-close></div>' +
        '<article class="spotlight-panel">' +
          '<button class="spotlight-close" type="button" aria-label="Close" data-close>&times;</button>' +
          '<div class="spotlight-media"><div class="spotlight-magnifier" aria-hidden="true"></div></div>' +
          '<div class="spotlight-body">' +
            '<span class="spotlight-cat"></span>' +
            '<h3 class="spotlight-title" id="spotlight-title"></h3>' +
            '<p class="spotlight-desc"></p>' +
            '<span class="spotlight-meta"></span>' +
            '<dl class="spotlight-facts" hidden></dl>' +
          '</div>' +
        '</article>';
      document.body.appendChild(overlay);
      panel = overlay.querySelector('.spotlight-panel');
      closeBtn = overlay.querySelector('.spotlight-close');
      media = overlay.querySelector('.spotlight-media');
      magnifier = overlay.querySelector('.spotlight-magnifier');
      overlay.addEventListener('click', function (e) {
        if (e.target.hasAttribute('data-close')) close();
      });

      // Magnifier: follows the mouse on desktop; on phones and tablets it
      // appears while a finger is pressed and dragged over the photo.
      function hideLens() {
        touchImg = null;
        magnifier.classList.remove('is-active');
      }

      function placeLens(img, e, isTouch) {
        var imgRect = img.getBoundingClientRect();
        var mediaRect = media.getBoundingClientRect();
        var x = e.clientX - imgRect.left;
        var y = e.clientY - imgRect.top;
        if (x < 0 || y < 0 || x > imgRect.width || y > imgRect.height) {
          magnifier.classList.remove('is-active');
          return;
        }
        var size = magnifier.offsetWidth;
        var zoom = isTouch ? TOUCH_ZOOM : ZOOM;
        var left = imgRect.left - mediaRect.left + x - size / 2;
        var top = imgRect.top - mediaRect.top + y - size / 2;
        if (isTouch) {
          // Lift the lens above the fingertip; drop it below if there's no room
          top = imgRect.top - mediaRect.top + y - size * 1.15;
          if (top < 0) top = imgRect.top - mediaRect.top + y + size * 0.15;
        }
        magnifier.style.backgroundImage = 'url(' + img.src + ')';
        magnifier.style.backgroundSize = (imgRect.width * zoom) + 'px ' + (imgRect.height * zoom) + 'px';
        magnifier.style.backgroundPosition = (-(x * zoom - size / 2)) + 'px ' + (-(y * zoom - size / 2)) + 'px';
        magnifier.style.left = left + 'px';
        magnifier.style.top = top + 'px';
        magnifier.classList.add('is-active');
      }

      media.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'mouse') return;
        var img = e.target.closest ? e.target.closest('img.is-zoomable') : null;
        if (!img) return;
        touchImg = img;
        placeLens(img, e, true);
      });
      media.addEventListener('pointermove', function (e) {
        if (e.pointerType === 'mouse') {
          var img = e.target.closest ? e.target.closest('img.is-zoomable') : null;
          if (img) placeLens(img, e, false);
          else magnifier.classList.remove('is-active');
        } else if (touchImg) {
          placeLens(touchImg, e, true);
        }
      });
      media.addEventListener('pointerup', function (e) { if (e.pointerType !== 'mouse') hideLens(); });
      media.addEventListener('pointercancel', hideLens);
      media.addEventListener('pointerleave', hideLens);
    }

    function shot(img, label) {
      var fig = document.createElement('figure');
      fig.className = 'spotlight-shot';
      fig.appendChild(img);
      var cap = document.createElement('figcaption');
      cap.textContent = label;
      fig.appendChild(cap);
      return fig;
    }

    function open(card) {
      build();
      var info = readCard(card);
      media.innerHTML = '';
      media.appendChild(magnifier);
      magnifier.classList.remove('is-active');
      panel.classList.remove('has-back');
      if (info.src) {
        var frontImg = document.createElement('img');
        frontImg.src = info.src;
        frontImg.alt = info.alt || info.name;
        frontImg.className = 'is-zoomable';
        if (info.back) {
          // Products with a back image show front and back together
          panel.classList.add('has-back');
          media.appendChild(shot(frontImg, 'Front'));
          var backImg = document.createElement('img');
          backImg.src = info.back;
          backImg.alt = (info.name || 'Product') + ' — back';
          backImg.className = 'is-zoomable';
          var backShot = shot(backImg, 'Back');
          backImg.addEventListener('error', function () {
            if (backShot.parentNode) backShot.parentNode.removeChild(backShot);
            panel.classList.remove('has-back');
          });
          media.appendChild(backShot);
        } else {
          media.appendChild(frontImg);
        }
      } else if (info.svg) {
        media.insertAdjacentHTML('beforeend', info.svg);
      }
      overlay.querySelector('.spotlight-cat').textContent = info.category;
      overlay.querySelector('.spotlight-title').textContent = info.name;
      var desc = overlay.querySelector('.spotlight-desc');
      desc.textContent = info.desc;
      desc.hidden = !info.desc;
      var meta = overlay.querySelector('.spotlight-meta');
      meta.textContent = info.meta;
      meta.hidden = !info.meta;
      var facts = overlay.querySelector('.spotlight-facts');
      facts.innerHTML = '';
      [['Shelf life', info.shelf], ['Storage condition', info.storage], ['Allergen information', info.allergen]].forEach(function (row) {
        if (!row[1]) return;
        var dt = document.createElement('dt');
        dt.textContent = row[0];
        var dd = document.createElement('dd');
        dd.textContent = row[1];
        facts.appendChild(dt);
        facts.appendChild(dd);
      });
      facts.hidden = !facts.children.length;

      lastFocus = card;
      clearTimeout(closeTimer);
      overlay.hidden = false;
      document.body.classList.add('spotlight-open');
      overlay.classList.add('is-open');

      // Zoom out of the card that was clicked
      panel.style.transition = 'none';
      panel.style.transform = '';
      panel.style.opacity = '';
      var from = card.getBoundingClientRect();
      var to = panel.getBoundingClientRect();
      var scale = Math.max(0.25, Math.min(1, from.width / to.width));
      var dx = (from.left + from.width / 2) - (to.left + to.width / 2);
      var dy = (from.top + from.height / 2) - (to.top + to.height / 2);
      panel.style.transform = 'translate(' + dx + 'px, ' + dy + 'px) scale(' + scale + ')';
      panel.style.opacity = '0.2';
      void panel.offsetWidth;
      panel.style.transition = '';
      panel.style.transform = '';
      panel.style.opacity = '';

      closeBtn.focus({ preventScroll: true });
    }

    function close() {
      if (!overlay || overlay.hidden) return;
      overlay.classList.remove('is-open');
      document.body.classList.remove('spotlight-open');
      closeTimer = setTimeout(function () { overlay.hidden = true; }, 280);
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }

    document.addEventListener('click', function (e) {
      if (!e.target.closest) return;
      var card = e.target.closest(CARD_SELECTOR);
      if (!card || e.target.closest('a, button')) return;
      open(card);
    });

    document.addEventListener('keydown', function (e) {
      if (overlay && !overlay.hidden) {
        if (e.key === 'Escape') { close(); }
        else if (e.key === 'Tab') { e.preventDefault(); closeBtn.focus(); }
        return;
      }
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches(CARD_SELECTOR)) {
        e.preventDefault();
        open(e.target);
      }
    });

    // Make every card reachable and operable from the keyboard
    function enhance() {
      document.querySelectorAll(CARD_SELECTOR).forEach(function (card) {
        if (card.hasAttribute('data-spotlight')) return;
        card.setAttribute('data-spotlight', '');
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        var name = textOf(card, '.sku-name, h3');
        if (name) card.setAttribute('aria-label', 'View ' + name);
      });
    }
    enhance();
    if ('MutationObserver' in window) {
      var watcher = new MutationObserver(enhance);
      document.querySelectorAll('.product-grid').forEach(function (grid) {
        watcher.observe(grid, { childList: true });
      });
    }
  })();

  // ------------------------------------------------------------------
  // Award lightbox — click any award card to zoom in. Cards with more
  // than one angle (data-images, comma-separated) get prev/next nav.
  // ------------------------------------------------------------------
  (function () {
    var CARD_SELECTOR = '.award-card[data-zoom]';
    var overlay, stage, dots, prevBtn, nextBtn, lastFocus, closeTimer;
    var images = [], index = 0;

    function build() {
      if (overlay) return;
      overlay = document.createElement('div');
      overlay.className = 'award-lightbox';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-labelledby', 'award-lightbox-title');
      overlay.innerHTML =
        '<div class="award-lightbox-box">' +
          '<button class="award-lightbox-close" type="button" aria-label="Close" data-close>&times;</button>' +
          '<button class="award-lightbox-nav award-lightbox-nav--prev" type="button" aria-label="Previous photo" hidden>&lsaquo;</button>' +
          '<button class="award-lightbox-nav award-lightbox-nav--next" type="button" aria-label="Next photo" hidden>&rsaquo;</button>' +
          '<div class="award-lightbox-stage"><div class="award-lightbox-dots"></div></div>' +
          '<div class="award-lightbox-caption">' +
            '<h4 id="award-lightbox-title"></h4>' +
            '<p></p>' +
          '</div>' +
        '</div>';
      document.body.appendChild(overlay);
      stage = overlay.querySelector('.award-lightbox-stage');
      dots = overlay.querySelector('.award-lightbox-dots');
      prevBtn = overlay.querySelector('.award-lightbox-nav--prev');
      nextBtn = overlay.querySelector('.award-lightbox-nav--next');
      overlay.addEventListener('click', function (e) {
        if (e.target.hasAttribute('data-close') || e.target === overlay) close();
      });
      prevBtn.addEventListener('click', function () { show(index - 1); });
      nextBtn.addEventListener('click', function () { show(index + 1); });
    }

    function show(i) {
      index = (i + images.length) % images.length;
      var existing = stage.querySelector('img');
      if (existing) existing.remove();
      var img = document.createElement('img');
      img.src = images[index];
      stage.insertBefore(img, dots);
      dots.querySelectorAll('.award-lightbox-dot').forEach(function (dot, di) {
        dot.classList.toggle('is-active', di === index);
      });
    }

    function splitList(raw) {
      return (raw || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    }

    function open(card) {
      var fallback = card.querySelector('.award-card-media img');
      var list = splitList(card.getAttribute('data-images'));
      if (!list.length && fallback) list = [fallback.src];
      openGallery(list, 0, textOf(card, 'h4'), textOf(card, 'figcaption p'), card);
    }

    function openGallery(list, startAt, title, text, from) {
      build();
      images = list;
      if (!images.length) return;

      var multi = images.length > 1;
      prevBtn.hidden = !multi;
      nextBtn.hidden = !multi;
      dots.innerHTML = '';
      if (multi) {
        images.forEach(function (_, i) {
          var dot = document.createElement('button');
          dot.type = 'button';
          dot.className = 'award-lightbox-dot';
          dot.setAttribute('aria-label', 'Show photo ' + (i + 1));
          dot.addEventListener('click', function () { show(i); });
          dots.appendChild(dot);
        });
      }
      show(startAt || 0);

      var caption = overlay.querySelector('.award-lightbox-caption p');
      overlay.querySelector('.award-lightbox-caption h4').textContent = title;
      caption.textContent = text;
      caption.hidden = !text;

      lastFocus = from;
      clearTimeout(closeTimer);
      overlay.classList.add('is-open');
      overlay.querySelector('.award-lightbox-close').focus({ preventScroll: true });
    }

    function close() {
      if (!overlay || !overlay.classList.contains('is-open')) return;
      overlay.classList.remove('is-open');
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }

    function textOf(el, selector) {
      var node = el.querySelector(selector);
      return node ? node.textContent.replace(/\s+/g, ' ').trim() : '';
    }

    document.addEventListener('click', function (e) {
      if (!e.target.closest) return;
      var card = e.target.closest(CARD_SELECTOR);
      if (!card || e.target.closest('a, button')) return;
      open(card);
    });

    document.addEventListener('keydown', function (e) {
      if (overlay && overlay.classList.contains('is-open')) {
        if (e.key === 'Escape') close();
        else if (e.key === 'ArrowLeft' && !prevBtn.hidden) show(index - 1);
        else if (e.key === 'ArrowRight' && !nextBtn.hidden) show(index + 1);
        return;
      }
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches(CARD_SELECTOR)) {
        e.preventDefault();
        open(e.target);
      }
    });

    document.querySelectorAll(CARD_SELECTOR).forEach(function (card) {
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      var name = textOf(card, 'h4');
      if (name) card.setAttribute('aria-label', 'View ' + name);
    });

    // Life at Miguelitos (about.html) — each tile browses its own category
    // with prev/next, and opens the current photo enlarged in this lightbox.
    document.querySelectorAll('.life-tile').forEach(function (tile) {
      var list = splitList(tile.getAttribute('data-images'));
      var title = tile.getAttribute('data-title') || '';
      var img = tile.querySelector('img');
      var count = tile.querySelector('.life-tile-count');
      var current = 0;
      var swapTimer;
      if (!list.length || !img) return;

      tile.tabIndex = 0;
      tile.setAttribute('role', 'button');
      tile.setAttribute('aria-label', 'View ' + title + ' photos');

      function go(step) {
        current = (current + step + list.length) % list.length;
        if (count) count.textContent = (current + 1) + ' / ' + list.length;
        clearTimeout(swapTimer);
        img.classList.add('is-swapping');
        swapTimer = setTimeout(function () {
          img.onload = function () { img.classList.remove('is-swapping'); };
          img.src = list[current];
          img.alt = title + ' — photo ' + (current + 1) + ' of ' + list.length;
        }, 180);
      }

      tile.querySelector('.life-tile-nav--prev').addEventListener('click', function () { go(-1); });
      tile.querySelector('.life-tile-nav--next').addEventListener('click', function () { go(1); });
      tile.addEventListener('click', function (e) {
        if (e.target.closest('button')) return;
        openGallery(list, current, title, '', tile);
      });
      tile.addEventListener('keydown', function (e) {
        if (e.target !== tile) return;
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openGallery(list, current, title, '', tile); }
        else if (e.key === 'ArrowLeft') go(-1);
        else if (e.key === 'ArrowRight') go(1);
      });
    });
  })();

});

// --------------------------------------------------------------------
// Cookie consent — works with the Consent Mode defaults in each page's
// <head>. Analytics stays off until the visitor clicks Accept; the choice
// is remembered and can be changed from the footer's "Cookie Settings".
// --------------------------------------------------------------------
(function () {
  var KEY = 'mic-cookie-consent';
  var GRANTED = { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' };
  var DENIED = { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' };

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }

  function buildBanner() {
    var el = document.createElement('div');
    el.className = 'cookie-banner';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-label', 'Cookie consent');
    el.innerHTML =
      '<p class="cookie-banner-text">We use cookies to understand how visitors use our site and to improve it. ' +
      'Analytics cookies are only set if you accept. <a href="privacy-policy">Privacy Policy</a></p>' +
      '<div class="cookie-banner-actions">' +
        '<button type="button" class="btn cookie-btn cookie-btn--decline" data-consent="denied">Decline</button>' +
        '<button type="button" class="btn btn-primary cookie-btn" data-consent="granted">Accept</button>' +
      '</div>';
    el.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-consent]');
      if (!btn) return;
      var choice = btn.getAttribute('data-consent');
      try { localStorage.setItem(KEY, choice); } catch (err) {}
      gtag('consent', 'update', choice === 'granted' ? GRANTED : DENIED);
      window.dataLayer.push({ event: 'cookie_consent_' + choice });
      el.classList.remove('is-visible');
      setTimeout(function () { el.remove(); }, 300);
    });
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('is-visible'); });
    return el;
  }

  function init() {
    if (!stored()) buildBanner();
    document.addEventListener('click', function (e) {
      var link = e.target.closest('[data-cookie-settings]');
      if (!link) return;
      e.preventDefault();
      if (!document.querySelector('.cookie-banner')) buildBanner().querySelector('button').focus();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

// --------------------------------------------------------------------
// Analytics events for Google Tag Manager (only recorded once the
// visitor has accepted cookies): brochure downloads, shop links,
// phone/email taps, and outbound social links.
// --------------------------------------------------------------------
document.addEventListener('click', function (e) {
  var a = e.target.closest && e.target.closest('a[href]');
  if (!a) return;
  var href = a.getAttribute('href');
  var ev = null;
  if (/\.pdf($|\?)/i.test(href)) ev = { event: 'file_download', file_name: href.split('/').pop(), link_text: a.textContent.trim() };
  else if (/^tel:/i.test(href)) ev = { event: 'contact_click', method: 'phone', link_url: href };
  else if (/^mailto:/i.test(href)) ev = { event: 'contact_click', method: 'email', link_url: href };
  else if (/shopee|lazada|tiktok\.com\/@.*shop|tiktok/i.test(href)) ev = { event: 'shop_click', link_url: href, link_text: a.textContent.trim() };
  else if (/^https?:/i.test(href) && a.hostname !== location.hostname) ev = { event: 'outbound_click', link_url: href };
  if (ev) { window.dataLayer = window.dataLayer || []; window.dataLayer.push(ev); }
});

// --------------------------------------------------------------------
// Banner marquee (products.html / machines.html): every product or
// machine from the catalog data, in one row of large image cards that
// slides on its own. Visitors can drag (mouse) or swipe (touch) it either
// way; on release it keeps the swipe's momentum, then eases back to the
// normal auto-scroll. Items are listed twice so the loop is seamless.
// --------------------------------------------------------------------
(function () {
  var host = document.querySelector('.hero-marquee[data-marquee]');
  if (!host) return;
  var kind = host.getAttribute('data-marquee');
  var data = kind === 'products' ? window.PRODUCTS_DATA : window.MACHINES_DATA;
  if (!data || !data.length) return;

  // The catalog is ordered by category; deal one item from each category in
  // turn so the row shows a varied mix instead of long runs of one line.
  var groups = {};
  var order = [];
  data.forEach(function (item) {
    var key = item.category || '';
    if (!groups[key]) { groups[key] = []; order.push(key); }
    groups[key].push(item);
  });
  var mixed = [];
  for (var round = 0; mixed.length < data.length; round++) {
    order.forEach(function (key) { if (groups[key][round]) mixed.push(groups[key][round]); });
  }

  var row = document.createElement('div');
  row.className = 'marquee-row';
  var track = document.createElement('div');
  track.className = 'marquee-track';
  for (var copy = 0; copy < 2; copy++) {
    mixed.forEach(function (item) {
      var card = document.createElement('figure');
      card.className = 'marquee-card';
      var img = document.createElement('img');
      img.loading = 'lazy';
      img.decoding = 'async';
      img.alt = '';
      img.draggable = false;
      img.src = item.src;
      card.appendChild(img);
      track.appendChild(card);
    });
  }
  row.appendChild(track);
  host.appendChild(row);

  var SECONDS_PER_CARD = 4.5;      // auto-scroll pace
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var offset = 0;                  // how far the track has moved left, in px
  var loopWidth = 1;               // width of one copy of the items
  var autoSpeed = 0;               // px per second
  var speed = 0;                   // current speed (eases back to autoSpeed)
  var drag = null;

  function measure() {
    var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    loopWidth = (track.scrollWidth + gap) / 2;
    var card = track.firstElementChild;
    autoSpeed = reduceMotion ? 0 : (card.offsetWidth + gap) / SECONDS_PER_CARD;
    if (!drag) speed = autoSpeed;
  }

  function render() {
    offset = ((offset % loopWidth) + loopWidth) % loopWidth;   // wrap both ways
    track.style.transform = 'translate3d(' + (-offset) + 'px,0,0)';
  }

  var last = null;
  function frame(t) {
    var dt = last === null ? 0 : Math.min((t - last) / 1000, 0.05);
    last = t;
    if (!drag) {
      speed += (autoSpeed - speed) * Math.min(1, dt * 1.6);   // ease swipe momentum back to normal
      offset += speed * dt;
      render();
    }
    requestAnimationFrame(frame);
  }

  host.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    drag = { x: e.clientX, y: e.clientY, offset: offset, lastX: e.clientX, lastT: e.timeStamp, v: 0, horizontal: e.pointerType === 'mouse' };
    if (drag.horizontal) { host.setPointerCapture(e.pointerId); host.classList.add('is-dragging'); }
  });
  host.addEventListener('pointermove', function (e) {
    if (!drag) return;
    if (!drag.horizontal) {
      // touch: only take over once the gesture is clearly sideways, so vertical page scrolling still works
      var dx = Math.abs(e.clientX - drag.x), dy = Math.abs(e.clientY - drag.y);
      if (dx < 6 && dy < 6) return;
      if (dy > dx) { drag = null; return; }
      drag.horizontal = true;
      host.setPointerCapture(e.pointerId);
      host.classList.add('is-dragging');
    }
    offset = drag.offset - (e.clientX - drag.x);
    var dtMs = e.timeStamp - drag.lastT;
    if (dtMs > 0) drag.v = 0.8 * drag.v + 0.2 * (-(e.clientX - drag.lastX) / dtMs * 1000);
    drag.lastX = e.clientX; drag.lastT = e.timeStamp;
    render();
  });
  function release() {
    if (!drag) return;
    if (drag.horizontal) speed = Math.max(-2500, Math.min(2500, drag.v));   // fling, then ease back to auto
    drag = null;
    host.classList.remove('is-dragging');
  }
  host.addEventListener('pointerup', release);
  host.addEventListener('pointercancel', release);
  host.addEventListener('lostpointercapture', release);

  measure();
  render();
  window.addEventListener('resize', measure);
  requestAnimationFrame(frame);
})();

// --------------------------------------------------------------------
// Site-wide polish: more elements fade up as they scroll into view (cards
// in a row appear one after another), the header gains a shadow and a
// reading-progress bar on scroll, and a back-to-top button appears.
// --------------------------------------------------------------------
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // extra scroll-reveal targets (the original set is handled earlier)
  var extra = document.querySelectorAll(
    '.package-card, .biz-card, .award-card, .press-card, .compliance-row, .mv-card, ' +
    '.branch-card, .where-country, .new-card, .package-detail, .section-machines-text, .legal-copy'
  );
  if (!reduceMotion && extra.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add('is-visible');
        io.unobserve(el);
        // once it has faded in, drop the slow reveal transition so hover effects respond instantly
        setTimeout(function () {
          el.classList.remove('reveal', 'is-visible');
          el.style.transitionDelay = '';
        }, 1100);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    extra.forEach(function (el) {
      if (el.classList.contains('reveal')) return;
      var index = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.classList.add('reveal');
      el.style.transitionDelay = (index % 4) * 80 + 'ms';   // stagger cards in the same row
      io.observe(el);
    });
  }

  // header shadow + reading progress
  var header = document.querySelector('.site-header');
  var progress = null;
  if (header) {
    progress = document.createElement('span');
    progress.className = 'scroll-progress';
    progress.setAttribute('aria-hidden', 'true');
    header.appendChild(progress);
  }

  // back-to-top button
  var top = document.createElement('button');
  top.type = 'button';
  top.className = 'back-to-top';
  top.setAttribute('aria-label', 'Back to top');
  top.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  top.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });
  document.body.appendChild(top);

  var ticking = false;
  function onScroll() {
    ticking = false;
    var y = window.scrollY || window.pageYOffset;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (header) header.classList.toggle('is-scrolled', y > 8);
    if (progress) progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
    top.classList.toggle('is-visible', y > 600);
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();
})();

// --------------------------------------------------------------------
// Touch feedback: phones and tablets have no mouse, so :hover effects
// (card lifts, image zooms, button sheens, sliding arrows) never show or
// get stuck. Every :hover rule in the site stylesheet gets a twin that
// uses the .is-hover class; while a finger is down on an element (and
// briefly after), that element and its ancestors get .is-hover. A touch
// that turns into a scroll cancels it straight away.
// --------------------------------------------------------------------
(function () {
  if (!('PointerEvent' in window)) return;

  function mirrorHoverRules(list, parent) {
    for (var i = list.length - 1; i >= 0; i--) {
      var rule = list[i];
      if (rule.cssRules && !rule.selectorText) {          // @media / @supports blocks
        mirrorHoverRules(rule.cssRules, rule);
        continue;
      }
      if (!rule.selectorText || rule.selectorText.indexOf(':hover') === -1) continue;
      var selector = rule.selectorText.replace(/:hover/g, '.is-hover');
      try { parent.insertRule(selector + '{' + rule.style.cssText + '}', i + 1); } catch (e) {}
    }
  }
  Array.prototype.forEach.call(document.styleSheets, function (sheet) {
    if (!sheet.href || sheet.href.indexOf('/css/styles.css') === -1) return;
    try { mirrorHoverRules(sheet.cssRules, sheet); } catch (e) {}
  });

  var active = [];
  var releaseTimer = null;
  function clear() {
    clearTimeout(releaseTimer);
    active.forEach(function (el) { el.classList.remove('is-hover'); });
    active = [];
  }
  document.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse') return;
    clear();
    for (var el = e.target; el && el !== document.body && el.nodeType === 1; el = el.parentElement) {
      el.classList.add('is-hover');
      active.push(el);
    }
  }, { passive: true });
  document.addEventListener('pointerup', function (e) {
    if (e.pointerType === 'mouse' || !active.length) return;
    clearTimeout(releaseTimer);
    releaseTimer = setTimeout(clear, 450);     // keep the effect visible briefly after a quick tap
  }, { passive: true });
  document.addEventListener('pointercancel', clear, { passive: true });   // the touch became a scroll
  window.addEventListener('scroll', function () { if (active.length) clear(); }, { passive: true });
})();
