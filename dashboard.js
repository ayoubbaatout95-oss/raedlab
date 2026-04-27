/* ============================================
   RAED LAB DASHBOARD — Main Logic
   ============================================ */

// ============ Load patients from localStorage ============
function loadAllPatients() {
    try {
        return JSON.parse(localStorage.getItem('raedlab_patients') || '[]');
    } catch { return []; }
}

// ============ Today helpers ============
function todayISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

// ============ Animate counter ============
function animateNumber(el, target, suffix = '') {
    if (!el) return;
    const start = 0;
    const duration = 600;
    const startTime = performance.now();
    const step = (now) => {
        const t = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        const value = Math.round(start + (target - start) * eased);
        el.textContent = value.toLocaleString('ar-DZ') + suffix;
        if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}

// ============ Update KPIs ============
function updateKPIs() {
    const patients = loadAllPatients();
    const today = todayISO();
    const todayPatients = patients.filter(p => p.date === today);

    const totalPatientsCount = patients.length;
    const totalTestsCount = patients.reduce((s, p) => s + (p.totalTests || 0), 0);
    const totalRevenue = patients.reduce((s, p) => s + (p.totalAmount || 0), 0);

    const todayPatientsCount = todayPatients.length;
    const todayTestsCount = todayPatients.reduce((s, p) => s + (p.totalTests || 0), 0);
    const todayRevenue = todayPatients.reduce((s, p) => s + (p.totalAmount || 0), 0);

    // Today
    animateNumber(document.getElementById('kpiTodayPatients'), todayPatientsCount);
    animateNumber(document.getElementById('kpiTodayTests'), todayTestsCount);
    animateNumber(document.getElementById('kpiTodayRevenue'), todayRevenue, ' دج');

    // Total
    animateNumber(document.getElementById('kpiTotalPatients'), totalPatientsCount);
    animateNumber(document.getElementById('kpiTotalTests'), totalTestsCount);
    animateNumber(document.getElementById('kpiTotalRevenue'), totalRevenue, ' دج');

    // Progress bars (relative to total of all time, capped)
    const setBar = (id, todayVal, totalVal) => {
        const bar = document.getElementById(id);
        if (!bar) return;
        const pct = totalVal > 0 ? Math.min(100, (todayVal / totalVal) * 100) : 0;
        // tiny delay for animation
        setTimeout(() => { bar.style.width = pct.toFixed(1) + '%'; }, 100);
    };
    setBar('kpiTodayPatientsBar', todayPatientsCount, Math.max(totalPatientsCount, 1));
    setBar('kpiTodayTestsBar', todayTestsCount, Math.max(totalTestsCount, 1));
    setBar('kpiTodayRevenueBar', todayRevenue, Math.max(totalRevenue, 1));
}

// ============ Recent Activity ============
function updateRecentPanel() {
    const panel = document.getElementById('recentPanel');
    if (!panel) return;
    const patients = loadAllPatients()
        .sort((a, b) => new Date(b.registeredAt || b.date) - new Date(a.registeredAt || a.date))
        .slice(0, 5);

    if (patients.length === 0) {
        panel.innerHTML = '<div class="portal-recent-empty"><i class="fas fa-inbox"></i><br><br>لا توجد سجلات بعد</div>';
        return;
    }

    panel.innerHTML = patients.map(p => {
        const initial = (p.name || '?').trim()[0] || '?';
        const tag = p.totalTests >= 5 ? 'urgent' : 'success';
        const tagText = p.totalTests >= 5 ? 'متعدد' : 'جديد';
        return `
            <a href="patients-list.html" class="portal-recent-item" style="text-decoration:none;color:inherit;">
                <div class="portal-recent-icon">${pEscapeHtml(initial)}</div>
                <div class="portal-recent-info">
                    <h4>${pEscapeHtml(p.name)}</h4>
                    <p>${p.totalTests} تحليل · ${(p.totalAmount||0).toLocaleString('ar-DZ')} دج · ${pEscapeHtml(p.date || '')}</p>
                </div>
                <span class="portal-recent-tag ${tag}">${tagText}</span>
            </a>
        `;
    }).join('');
}

// ============ Global Search with Autocomplete ============
function initGlobalSearch() {
    const input = document.getElementById('globalSearch');
    if (!input) return;

    createAutocomplete(input, {
        data: () => {
            // Combine tests + patients for global search
            const tests = (typeof medicalTests !== 'undefined' ? medicalTests : []).map(t => ({
                kind: 'test',
                ...t
            }));
            const patients = loadAllPatients().map(p => ({
                kind: 'patient',
                ...p
            }));
            return [...patients, ...tests];
        },
        keys: ['name', 'shortName', 'phone'],
        maxResults: 10,
        emptyMsg: 'لا توجد نتائج',
        groupBy: (item) => item.kind === 'patient' ? '👤 المرضى' : '🧪 التحاليل',
        render: (item, term) => {
            if (item.kind === 'patient') {
                return `
                    <div class="autocomplete-item-icon" style="background:#FEF3C7;color:#B45309;"><i class="fas fa-user"></i></div>
                    <div class="autocomplete-item-content">
                        <span class="autocomplete-item-title">${pHighlight(item.name, term)}</span>
                        <span class="autocomplete-item-subtitle">${pHighlight(item.phone || '', term)} · ${pEscapeHtml(item.branch || '')}</span>
                    </div>
                    <span class="autocomplete-item-badge" style="background:#FEF3C7;color:#B45309;border-color:#FCD34D;">${item.totalTests || 0} تحليل</span>
                `;
            }
            return `
                <div class="autocomplete-item-icon"><i class="fas fa-flask"></i></div>
                <div class="autocomplete-item-content">
                    <span class="autocomplete-item-title">${pHighlight(item.name, term)}</span>
                    <span class="autocomplete-item-subtitle">${pEscapeHtml(item.tube || '')} · ${(item.price||0).toLocaleString('ar-DZ')} دج</span>
                </div>
                <span class="autocomplete-item-badge">${pHighlight(item.shortName || '', term)}</span>
            `;
        },
        onSelect: (item) => {
            if (item.kind === 'patient') {
                window.location.href = 'patients-list.html';
            } else {
                // Save selected test to cart and go to catalog
                try {
                    const cart = JSON.parse(localStorage.getItem('raedlab_cart') || '[]');
                    if (!cart.some(t => t.id === item.id)) {
                        cart.push(item);
                        localStorage.setItem('raedlab_cart', JSON.stringify(cart));
                    }
                } catch {}
                window.location.href = 'tests-catalog.html';
            }
        }
    });
}

// ============ Init ============
document.addEventListener('DOMContentLoaded', () => {
    updateKPIs();
    updateRecentPanel();
    initGlobalSearch();
});
