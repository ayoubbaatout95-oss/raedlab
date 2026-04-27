/* ============================================
   RAED LAB PATIENTS LIST EXTRAS
   - Autocomplete on patient search input
   ============================================ */

(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', () => {
        const input = document.getElementById('patientSearchInput');
        if (!input || typeof createAutocomplete !== 'function') return;

        createAutocomplete(input, {
            data: () => {
                if (typeof allPatients !== 'undefined' && Array.isArray(allPatients)) return allPatients;
                try { return JSON.parse(localStorage.getItem('raedlab_patients') || '[]'); } catch { return []; }
            },
            keys: ['name', 'phone'],
            minChars: 1,
            maxResults: 8,
            emptyMsg: 'لا يوجد مريض مطابق',
            render: (item, term) => `
                <div class="autocomplete-item-icon" style="background:#FEF3C7;color:#B45309;"><i class="fas fa-user"></i></div>
                <div class="autocomplete-item-content">
                    <span class="autocomplete-item-title">${pHighlight(item.name, term)}</span>
                    <span class="autocomplete-item-subtitle">${pHighlight(item.phone || '', term)} · ${pEscapeHtml(item.branch || '')} · ${pEscapeHtml(item.date || '')}</span>
                </div>
                <span class="autocomplete-item-badge">${item.totalTests || 0}T</span>
            `,
            onSelect: (item) => {
                input.value = item.name || '';
                input.dispatchEvent(new Event('input', { bubbles: true }));
                // Optional: open patient details modal
                if (typeof showPatientDetails === 'function') {
                    setTimeout(() => showPatientDetails(item), 200);
                }
            }
        });
    });
})();
