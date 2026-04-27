/* ============================================
   RAED LAB CLINICAL PORTAL — Shared Logic
   Sidebar toggle + Autocomplete + utilities
   ============================================ */

// ============ Utility: Escape HTML ============
function pEscapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, m => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[m]));
}

// ============ Highlight matched substring ============
function pHighlight(text, term) {
    if (!text || !term) return pEscapeHtml(text || '');
    const safeTxt = pEscapeHtml(text);
    const safeTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(${safeTerm})`, 'gi');
    return safeTxt.replace(re, '<span class="highlight" style="background:#FEF3C7; font-weight:bold;">$1</span>');
}

// ============ Sidebar mobile toggle (تصحيح المسميات) ============
function initPortalSidebar() {
    const toggle = document.getElementById('portalMobileToggle');
    const sidebar = document.getElementById('portalSidebar');
    const overlay = document.getElementById('portalSidebarOverlay');
    
    if (!toggle || !sidebar) return;

    const open = () => {
        sidebar.classList.add('active'); // تغيير من open إلى active
        if (overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    };
    const close = () => {
        sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    };

    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.contains('active') ? close() : open();
    });

    if (overlay) overlay.addEventListener('click', close);
    
    // إغلاق القائمة عند الضغط على أي رابط بداخلها
    sidebar.querySelectorAll('.portal-nav-item').forEach(link => {
        link.addEventListener('click', close);
    });
}

// ============ Autocomplete Component (تصحيح منطق البحث) ============
function createAutocomplete(input, opts = {}) {
    if (!input) return;
    const cfg = Object.assign({
        data: () => [],
        keys: ['name', 'phone'], // مطابقة للحقول في الصورة
        minChars: 1,
        maxResults: 8,
        emptyMsg: 'لا توجد نتائج مطابقة',
        onSelect: () => {},
        render: null,
        groupBy: null,
        clearOnSelect: false
    }, opts);

    let wrapper = input.closest('.autocomplete-wrapper');
    if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.className = 'autocomplete-wrapper';
        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);
    }

    const dropdown = document.createElement('div');
    dropdown.className = 'autocomplete-dropdown';
    wrapper.appendChild(dropdown);

    let activeIndex = -1;
    let currentResults = [];

    const closeDropdown = () => {
        dropdown.classList.remove('show');
        activeIndex = -1;
    };

    const filterData = (term) => {
        const t = term.toLowerCase().trim();
        if (!t) return [];
        const data = cfg.data();
        
        return data.filter(item => {
            return cfg.keys.some(key => {
                const val = String(item[key] || '').toLowerCase();
                return val.includes(t);
            });
        }).slice(0, cfg.maxResults);
    };

    const defaultRender = (item, term) => {
        // استخدام حقول Firestore الظاهرة في الصورة: name, phone, branch
        const title = item.name || 'مريض بدون اسم';
        const subtitle = `${item.phone || ''} · ${item.branch || ''}`;
        return `
            <div class="autocomplete-item-icon"><i class="fas fa-user"></i></div>
            <div class="autocomplete-item-content">
                <span class="autocomplete-item-title">${pHighlight(title, term)}</span>
                <span class="autocomplete-item-subtitle">${pHighlight(subtitle, term)}</span>
            </div>
        `;
    };

    const render = () => {
        const term = input.value;
        if (term.length < cfg.minChars) {
            closeDropdown();
            return;
        }
        const results = filterData(term);
        currentResults = results;

        if (results.length === 0) {
            dropdown.innerHTML = `<div class="autocomplete-empty"><i class="fas fa-search"></i> ${cfg.emptyMsg}</div>`;
        } else {
            dropdown.innerHTML = results.map((it, idx) => `
                <div class="autocomplete-item" data-idx="${idx}" role="option">
                    ${cfg.render ? cfg.render(it, term) : defaultRender(it, term)}
                </div>
            `).join('');
        }
        dropdown.classList.add('show');
    };

    input.addEventListener('input', render);
    input.addEventListener('focus', () => { if(input.value) render(); });
    document.addEventListener('click', (e) => { if (!wrapper.contains(e.target)) closeDropdown(); });

    dropdown.addEventListener('click', (e) => {
        const itemEl = e.target.closest('.autocomplete-item');
        if (!itemEl) return;
        const idx = parseInt(itemEl.dataset.idx);
        if (currentResults[idx]) {
            cfg.onSelect(currentResults[idx]);
            if (cfg.clearOnSelect) input.value = '';
            closeDropdown();
        }
    });

    return { close: closeDropdown };
}

// ============ Toast (shared) ============
function pToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: 'check-circle', error: 'exclamation-circle', info: 'info-circle' };
    toast.innerHTML = `<i class="fas fa-${icons[type] || 'info-circle'}"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// تشغيل القائمة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', initPortalSidebar);
