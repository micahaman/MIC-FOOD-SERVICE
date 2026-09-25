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
  var currentPage = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.nav-links a').forEach(function (link) {
    var target = (link.getAttribute('href') || '').split('#')[0].toLowerCase();
    var isCurrent = target === currentPage || (target === 'index.html' && currentPage === '') ||
      (currentPage.indexOf('package-') === 0 && target === 'business-packages.html');
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
    var dots = slider.querySelectorAll('.hero-slide-dot');
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
  var FORM_RECIPIENT = 'it@miguelitoscorp.com';
  var FORM_ENDPOINT = 'https://formsubmit.co/ajax/' + FORM_RECIPIENT;
  var MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

  function wireForm(form, statusEl, options) {
    if (!form || !statusEl) return;
    var button = form.querySelector('button[type="submit"]');
    var idleLabel = button ? button.textContent : '';
    statusEl.setAttribute('role', 'status');
    statusEl.setAttribute('aria-live', 'polite');

    function show(message, kind) {
      statusEl.textContent = message;
      statusEl.className = kind || '';
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Spam trap: real visitors never fill the hidden field
      var trap = form.querySelector('[name="_honey"]');
      if (trap && trap.value) { form.reset(); return; }

      if (!form.reportValidity()) return;

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
          form.reset();
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
      }
      if (card.classList.contains('new-card')) info.category = 'New Product';
      return info;
    }

    var overlay, panel, closeBtn, lastFocus, closeTimer;

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
          '<div class="spotlight-media"></div>' +
          '<div class="spotlight-body">' +
            '<span class="spotlight-cat"></span>' +
            '<h3 class="spotlight-title" id="spotlight-title"></h3>' +
            '<p class="spotlight-desc"></p>' +
            '<span class="spotlight-meta"></span>' +
          '</div>' +
        '</article>';
      document.body.appendChild(overlay);
      panel = overlay.querySelector('.spotlight-panel');
      closeBtn = overlay.querySelector('.spotlight-close');
      overlay.addEventListener('click', function (e) {
        if (e.target.hasAttribute('data-close')) close();
      });
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
      var media = overlay.querySelector('.spotlight-media');
      media.innerHTML = '';
      panel.classList.remove('has-back');
      if (info.src) {
        var frontImg = document.createElement('img');
        frontImg.src = info.src;
        frontImg.alt = info.alt || info.name;
        if (info.back) {
          // Products with a back image show front and back together
          panel.classList.add('has-back');
          media.appendChild(shot(frontImg, 'Front'));
          var backImg = document.createElement('img');
          backImg.src = info.back;
          backImg.alt = (info.name || 'Product') + ' — back';
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
        media.innerHTML = info.svg;
      }
      overlay.querySelector('.spotlight-cat').textContent = info.category;
      overlay.querySelector('.spotlight-title').textContent = info.name;
      var desc = overlay.querySelector('.spotlight-desc');
      desc.textContent = info.desc;
      desc.hidden = !info.desc;
      var meta = overlay.querySelector('.spotlight-meta');
      meta.textContent = info.meta;
      meta.hidden = !info.meta;

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

});
