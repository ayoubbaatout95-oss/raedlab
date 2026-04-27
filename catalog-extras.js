/* ============================================
   RAED LAB CATALOG EXTRAS
   - Autocomplete on tests search
   - CTA banner: "register patient with these tests"
   - Bridge cart → registration page
   ============================================ */

(function() {
    'use strict';

    // ===== Autocomplete on the catalog search input =====
    const searchInput = document.getElementById('searchInput');
    if (searchInput && typeof createAutocomplete === 'function') {
        createAutocomplete(searchInput, {
            data: () => (typeof medicalTests !== 'undefined' ? medicalTests : []),
            keys: ['name', 'shortName', 'categoryName', 'tube'],
            minChars: 1,
            maxResults: 8,
            emptyMsg: 'لم يتم العثور على تحاليل مطابقة',
            render: (item, term) => `
                <div class="autocomplete-item-icon"><i class="fas fa-flask"></i></div>
                <div class="autocomplete-item-content">
                    <span class="autocomplete-item-title">${pHighlight(item.name, term)}</span>
                    <span class="autocomplete-item-subtitle">${pEscapeHtml(item.tube)} · ${pEscapeHtml(item.categoryName || '')} · ${(item.price || 0).toLocaleString('ar-DZ')} دج</span>
                </div>
                <span class="autocomplete-item-badge">${pHighlight(item.shortName, term)}</span>
            `,
            onSelect: (item) => {
                // Fill the input with the selected name and trigger filter
                searchInput.value = item.shortName;
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                // Optional: scroll to first card
                setTimeout(() => {
                    const card = document.querySelector(`[data-test-id="${item.id}"]`)?.closest('.test-card');
                    if (card) {
                        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        card.style.boxShadow = '0 0 0 3px var(--primary)';
                        setTimeout(() => card.style.boxShadow = '', 1500);
                    }
                }, 200);
            }
        });
    }

    // ===== CTA Banner: register patient with selected tests =====
    const banner = document.getElementById('ctaBanner');
    const ctaCount = document.getElementById('ctaCount');
    const ctaBtn = document.getElementById('ctaRegisterBtn');
    const cartRegisterBtn = document.getElementById('cartRegisterBtn');
    const cartRegisterBtnMobile = document.getElementById('cartRegisterBtnMobile');

    function getCartSize() {
        try {
            return JSON.parse(localStorage.getItem('raedlab_cart') || '[]').length;
        } catch { return 0; }
    }

    function refreshBanner() {
        if (!banner) return;
        const n = getCartSize();
        if (n > 0) {
            banner.classList.remove('hidden');
            if (ctaCount) ctaCount.textContent = n;
        } else {
            banner.classList.add('hidden');
        }
    }

    // Save cart as a "preselected tests" payload to be picked up by register-patient page
    function bridgeToRegister(e) {
        e?.preventDefault?.();
        let cart = [];
        try { cart = JSON.parse(localStorage.getItem('raedlab_cart') || '[]'); } catch {}
        if (cart.length === 0) {
            if (typeof pToast === 'function') pToast('يرجى اختيار تحليل واحد على الأقل أولاً', 'warning');
            return;
        }
        // Pass to registration page via sessionStorage to avoid duplicating cart logic
        sessionStorage.setItem('raedlab_preselected_tests', JSON.stringify(cart));
        if (typeof pToast === 'function') pToast(`جاري تحضير ${cart.length} تحليل لتسجيل المريض...`, 'success');
        setTimeout(() => { window.location.href = 'register-patient.html'; }, 250);
    }

    if (ctaBtn) ctaBtn.addEventListener('click', bridgeToRegister);
    if (cartRegisterBtn) cartRegisterBtn.addEventListener('click', bridgeToRegister);
    if (cartRegisterBtnMobile) cartRegisterBtnMobile.addEventListener('click', bridgeToRegister);

    // Hook into the cart-update events from main.js
    // Strategy: poll storage briefly OR observe DOM changes
    // Cleaner: listen for storage event AND override saveCartToStorage
    const originalSave = window.saveCartToStorage;
    if (typeof originalSave === 'function') {
        window.saveCartToStorage = function() {
            originalSave.apply(this, arguments);
            refreshBanner();
        };
    }

    // Also observe via setInterval fallback (cheap)
    let lastSize = -1;
    setInterval(() => {
        const n = getCartSize();
        if (n !== lastSize) { lastSize = n; refreshBanner(); }
    }, 400);

    // Initial check
    document.addEventListener('DOMContentLoaded', refreshBanner);
    refreshBanner();
})();
