/* ============================================
   RAED LAB REGISTRATION EXTRAS
   - Receive preselected tests from catalog
   - Autocomplete on test search (quick-add)
   - Autocomplete on patient name (suggest existing)
   ============================================ */

(function() {
    'use strict';

    // ===== Receive preselected tests from catalog =====
    function loadPreselectedTests() {
        let preselected = [];
        try {
            preselected = JSON.parse(sessionStorage.getItem('raedlab_preselected_tests') || '[]');
        } catch {}
        if (!Array.isArray(preselected) || preselected.length === 0) return;

        // Wait for the registration JS to be ready, then merge
        const tryMerge = () => {
            if (typeof selectedTests === 'undefined' || typeof toggleTest !== 'function' || typeof renderTestsList !== 'function') {
                setTimeout(tryMerge, 100);
                return;
            }
            // Add only if not already selected
            preselected.forEach(t => {
                if (!selectedTests.some(s => s.id === t.id)) {
                    selectedTests.push(t);
                }
            });
            // Refresh UI
            if (typeof updateSelectedTests === 'function') updateSelectedTests();
            renderTestsList();

            // Show notice
            const notice = document.getElementById('preselectNotice');
            const cnt = document.getElementById('preselectCount');
            if (notice && cnt) {
                cnt.textContent = preselected.length;
                notice.classList.remove('hidden');
            }
            if (typeof pToast === 'function') pToast(`تم تحميل ${preselected.length} تحليل من الكتالوج`, 'success');

            // Clear so it doesn't repeat
            sessionStorage.removeItem('raedlab_preselected_tests');
        };
        tryMerge();
    }

    // ===== Autocomplete on test search (instant add) =====
    function initTestSearchAutocomplete() {
        const input = document.getElementById('testSearch');
        if (!input || typeof createAutocomplete !== 'function') return;

        createAutocomplete(input, {
            data: () => (typeof medicalTests !== 'undefined' ? medicalTests : []),
            keys: ['name', 'shortName', 'categoryName'],
            minChars: 1,
            maxResults: 8,
            emptyMsg: 'لا توجد تحاليل مطابقة',
            clearOnSelect: true,
            render: (item, term) => {
                const isSelected = typeof selectedTests !== 'undefined' && selectedTests.some(s => s.id === item.id);
                return `
                    <div class="autocomplete-item-icon" style="${isSelected ? 'background:#D1FAE5;color:#10B981' : ''}">
                        <i class="fas fa-${isSelected ? 'check' : 'flask'}"></i>
                    </div>
                    <div class="autocomplete-item-content">
                        <span class="autocomplete-item-title">${pHighlight(item.name, term)}</span>
                        <span class="autocomplete-item-subtitle">${pEscapeHtml(item.tube)} · ${(item.price || 0).toLocaleString('ar-DZ')} دج ${isSelected ? '· <span style="color:#10B981;font-weight:700;">مضاف ✓</span>' : ''}</span>
                    </div>
                    <span class="autocomplete-item-badge">${pHighlight(item.shortName, term)}</span>
                `;
            },
            onSelect: (item) => {
                if (typeof toggleTest === 'function') {
                    if (typeof selectedTests !== 'undefined' && selectedTests.some(s => s.id === item.id)) {
                        if (typeof pToast === 'function') pToast(`${item.shortName} مضاف مسبقاً`, 'info');
                    } else {
                        toggleTest(item);
                        if (typeof pToast === 'function') pToast(`تم إضافة: ${item.shortName}`, 'success');
                    }
                }
            }
        });
    }

    // ===== Autocomplete on patient name (suggest existing patients) =====
    function initPatientNameAutocomplete() {
        const input = document.getElementById('patientName');
        const phoneInput = document.getElementById('patientPhone');
        const ageInput = document.getElementById('patientAge');
        const genderSelect = document.getElementById('patientGender');
        if (!input || typeof createAutocomplete !== 'function') return;

        createAutocomplete(input, {
            data: () => {
                try {
                    const patients = JSON.parse(localStorage.getItem('raedlab_patients') || '[]');
                    // Deduplicate by name+phone
                    const seen = new Set();
                    return patients.filter(p => {
                        const k = (p.name || '') + '|' + (p.phone || '');
                        if (seen.has(k)) return false;
                        seen.add(k);
                        return true;
                    });
                } catch { return []; }
            },
            keys: ['name', 'phone'],
            minChars: 2,
            maxResults: 5,
            emptyMsg: 'لا يوجد مريض مطابق · سيتم إنشاء سجل جديد',
            render: (item, term) => `
                <div class="autocomplete-item-icon" style="background:#FEF3C7;color:#B45309;"><i class="fas fa-user"></i></div>
                <div class="autocomplete-item-content">
                    <span class="autocomplete-item-title">${pHighlight(item.name, term)}</span>
                    <span class="autocomplete-item-subtitle">${pHighlight(item.phone || '', term)} · ${pEscapeHtml(item.gender || '')} · ${item.age || '-'} سنة</span>
                </div>
                <span class="autocomplete-item-badge" style="background:#FEF3C7;color:#B45309;border-color:#FCD34D;">سابق</span>
            `,
            onSelect: (item) => {
                input.value = item.name || '';
                if (phoneInput) phoneInput.value = item.phone || '';
                if (ageInput) ageInput.value = item.age || '';
                if (genderSelect && item.gender) genderSelect.value = item.gender;
                if (typeof pToast === 'function') pToast('تم استرجاع بيانات المريض السابق', 'info');
            }
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        initTestSearchAutocomplete();
        initPatientNameAutocomplete();
        loadPreselectedTests();
    });
})();
