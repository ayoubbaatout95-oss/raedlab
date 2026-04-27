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
    if (!term) return pEscapeHtml(text);
    const safeTxt = pEscapeHtml(text);
    const safeTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(${safeTerm})`, 'gi');
    return safeTxt.replace(re, '<span class="highlight">$1</span>');
}

// ============ Sidebar mobile toggle ============
function initPortalSidebar() {
    const toggle = document.getElementById('portalMobileToggle');
    const sidebar = document.getElementById('portalSidebar');
    const overlay = document.getElementById('portalSidebarOverlay');
    if (!toggle || !sidebar) return;

    const open = () => {
        sidebar.classList.add('open');
        if (overlay) overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    };
    const close = () => {
        sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
        document.body.style.overflow = '';
    };

    toggle.addEventListener('click', () => {
        sidebar.classList.contains('open') ? close() : open();
    });
    if (overlay) overlay.addEventListener('click', close);
}

// ============ Autocomplete Component ============
/**
 * Attach an autocomplete dropdown to an input.
 * @param {HTMLInputElement} input
 * @param {Object} opts
 *   - data: () => Array of items
 *   - keys: ['name','shortName',...]
 *   - render: (item, term) => HTML string for one row
 *   - onSelect: (item) => void
 *   - minChars: default 1
 *   - maxResults: default 8
 *   - emptyMsg: string
 *   - groupBy: optional function(item) => groupName
 */
function createAutocomplete(input, opts = {}) {
    if (!input) return;
    const cfg = Object.assign({
        data: () => [],
        keys: ['name'],
        minChars: 1,
        maxResults: 8,
        emptyMsg: 'لا توجد اقتراحات',
        onSelect: () => {},
        render: null,
        groupBy: null,
        clearOnSelect: false
    }, opts);

    // Wrap input
    let wrapper = input.closest('.autocomplete-wrapper');
    if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.className = 'autocomplete-wrapper';
        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);
    }

    // Dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'autocomplete-dropdown';
    dropdown.setAttribute('role', 'listbox');
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
        const matches = [];
        for (const item of data) {
            for (const k of cfg.keys) {
                const v = item[k];
                if (v && String(v).toLowerCase().includes(t)) {
                    matches.push(item);
                    break;
                }
            }
            if (matches.length >= cfg.maxResults * 2) break;
        }
        // Prioritize: starts-with > contains
        matches.sort((a, b) => {
            const score = (item) => {
                for (const k of cfg.keys) {
                    const v = (item[k] || '').toString().toLowerCase();
                    if (v.startsWith(t)) return 0;
                    if (v.includes(t)) return 1;
                }
                return 2;
            };
            return score(a) - score(b);
        });
        return matches.slice(0, cfg.maxResults);
    };

    const defaultRender = (item, term) => {
        const title = item.name || item.shortName || '';
        const subtitle = item.tube || item.categoryName || item.phone || '';
        const badge = item.shortName || '';
        return `
            <div class="autocomplete-item-icon"><i class="fas fa-flask"></i></div>
            <div class="autocomplete-item-content">
                <span class="autocomplete-item-title">${pHighlight(title, term)}</span>
                ${subtitle ? `<span class="autocomplete-item-subtitle">${pHighlight(subtitle, term)}</span>` : ''}
            </div>
            ${badge ? `<span class="autocomplete-item-badge">${pHighlight(badge, term)}</span>` : ''}
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
            dropdown.classList.add('show');
            return;
        }

        // Optional grouping
        let html = '';
        if (cfg.groupBy) {
            const groups = {};
            results.forEach(it => {
                const g = cfg.groupBy(it) || 'أخرى';
                (groups[g] = groups[g] || []).push(it);
            });
            for (const g of Object.keys(groups)) {
                html += `<div class="autocomplete-section-title">${pEscapeHtml(g)}</div>`;
                groups[g].forEach(it => {
                    const idx = results.indexOf(it);
                    html += `<div class="autocomplete-item" data-idx="${idx}" role="option">${cfg.render ? cfg.render(it, term) : defaultRender(it, term)}</div>`;
                });
            }
        } else {
            results.forEach((it, idx) => {
                html += `<div class="autocomplete-item" data-idx="${idx}" role="option">${cfg.render ? cfg.render(it, term) : defaultRender(it, term)}</div>`;
            });
        }

        dropdown.innerHTML = html;
        dropdown.classList.add('show');
        activeIndex = -1;
    };

    // Event: input
    let debTimer;
    input.addEventListener('input', () => {
        clearTimeout(debTimer);
        debTimer = setTimeout(render, 100);
    });

    // Event: focus (re-show)
    input.addEventListener('focus', () => {
        if (input.value.length >= cfg.minChars) render();
    });

    // Event: click outside
    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) closeDropdown();
    });

    // Event: select
    dropdown.addEventListener('click', (e) => {
        const item = e.target.closest('.autocomplete-item');
        if (!item) return;
        const idx = parseInt(item.dataset.idx, 10);
        if (Number.isFinite(idx) && currentResults[idx]) {
            cfg.onSelect(currentResults[idx]);
            if (cfg.clearOnSelect) input.value = '';
            closeDropdown();
        }
    });

    // Event: keyboard navigation
    input.addEventListener('keydown', (e) => {
        if (!dropdown.classList.contains('show')) return;
        const items = dropdown.querySelectorAll('.autocomplete-item');
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeIndex = Math.min(activeIndex + 1, items.length - 1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIndex = Math.max(activeIndex - 1, 0);
        } else if (e.key === 'Enter') {
            if (activeIndex >= 0) {
                e.preventDefault();
                items[activeIndex].click();
            }
        } else if (e.key === 'Escape') {
            closeDropdown();
        }
        items.forEach((el, i) => el.classList.toggle('active', i === activeIndex));
        if (activeIndex >= 0 && items[activeIndex]) {
            items[activeIndex].scrollIntoView({ block: 'nearest' });
        }
    });

    return { close: closeDropdown, refresh: render };
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
    const icons = { success: 'check-circle', error: 'exclamation-circle', info: 'info-circle', warning: 'exclamation-triangle' };
    toast.innerHTML = `<i class="fas fa-${icons[type] || 'info-circle'}"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Auto-init sidebar
document.addEventListener('DOMContentLoaded', initPortalSidebar);
