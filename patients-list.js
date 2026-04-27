// RAED LAB - Modern Patients List (Updated with Tests Names Display)

let allPatients = [];
let filteredPatients = [];
let currentPatient = null;

// ============= Toast =============
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: 'check-circle', error: 'exclamation-circle', info: 'info-circle', warning: 'exclamation-triangle' };
    toast.innerHTML = `<i class="fas fa-${icons[type]}"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ============= Navigation =============
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
const navOverlay = document.getElementById('navOverlay');
const header = document.getElementById('header');
hamburger.addEventListener('click', () => { hamburger.classList.toggle('active'); navMenu.classList.toggle('active'); navOverlay.classList.toggle('active'); });
navOverlay.addEventListener('click', () => { hamburger.classList.remove('active'); navMenu.classList.remove('active'); navOverlay.classList.remove('active'); });
window.addEventListener('scroll', () => { header.classList.toggle('scrolled', window.scrollY > 10); });

// ============= DOM Elements =============
const patientsTableBody = document.getElementById('patientsTableBody');
const patientSearchInput = document.getElementById('patientSearchInput');
const branchFilter = document.getElementById('branchFilter');
const testFilter = document.getElementById('testFilter');
const dateFilter = document.getElementById('dateFilter');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');
const exportExcelBtn = document.getElementById('exportExcelBtn');
const exportPDFBtn = document.getElementById('exportPDFBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const totalPatientsEl = document.getElementById('totalPatients');
const totalTestsEl = document.getElementById('totalTests');
const totalRevenueEl = document.getElementById('totalRevenue');
const recordsCount = document.getElementById('recordsCount');
const patientDetailsModal = document.getElementById('patientDetailsModal');
const closeDetailsModal = document.getElementById('closeDetailsModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const printPatientBtn = document.getElementById('printPatientBtn');
const patientDetailsBody = document.getElementById('patientDetailsBody');

// ============= Initialize =============
document.addEventListener('DOMContentLoaded', function() {
    loadPatients();
    populateTestFilter();
    setupEventListeners();
    updateStatistics();
    renderPatientsTable();
});

function setupEventListeners() {
    patientSearchInput.addEventListener('input', filterPatients);
    branchFilter.addEventListener('change', filterPatients);
    if (testFilter) testFilter.addEventListener('change', filterPatients);
    dateFilter.addEventListener('change', filterPatients);
    if (resetFiltersBtn) resetFiltersBtn.addEventListener('click', resetFilters);
    exportExcelBtn.addEventListener('click', exportToExcel);
    exportPDFBtn.addEventListener('click', exportToPDF);
    clearAllBtn.addEventListener('click', clearAllPatients);
    closeDetailsModal.addEventListener('click', closeModal);
    closeModalBtn.addEventListener('click', closeModal);
    printPatientBtn.addEventListener('click', printPatientDetails);
    patientDetailsModal.querySelector('.modal-overlay').addEventListener('click', closeModal);
}

function loadPatients() {
    allPatients = JSON.parse(localStorage.getItem('raedlab_patients') || '[]');
    // Sort by newest first
    allPatients.sort((a, b) => new Date(b.registeredAt || b.date) - new Date(a.registeredAt || a.date));
    filteredPatients = [...allPatients];
}

function populateTestFilter() {
    if (!testFilter) return;
    // Collect unique test shortNames from all patients
    const testsSet = new Map();
    allPatients.forEach(p => {
        (p.tests || []).forEach(t => {
            if (t.shortName && !testsSet.has(t.shortName)) {
                testsSet.set(t.shortName, t.name || t.shortName);
            }
        });
    });
    // Clear then add
    testFilter.innerHTML = '<option value="all">جميع التحاليل</option>';
    [...testsSet.entries()].sort((a, b) => a[0].localeCompare(b[0])).forEach(([shortName, name]) => {
        const opt = document.createElement('option');
        opt.value = shortName;
        opt.textContent = `${shortName} - ${name}`;
        testFilter.appendChild(opt);
    });
}

function resetFilters() {
    patientSearchInput.value = '';
    branchFilter.value = 'all';
    if (testFilter) testFilter.value = 'all';
    dateFilter.value = '';
    filterPatients();
    showToast('تم إعادة تعيين الفلاتر', 'info');
}

function filterPatients() {
    const searchTerm = patientSearchInput.value.toLowerCase().trim();
    const branch = branchFilter.value;
    const testShort = testFilter ? testFilter.value : 'all';
    const date = dateFilter.value;
    
    filteredPatients = allPatients.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(searchTerm) || p.phone.includes(searchTerm);
        const matchBranch = branch === 'all' || p.branch === branch;
        const matchDate = !date || p.date === date;
        const matchTest = testShort === 'all' || (p.tests || []).some(t => t.shortName === testShort);
        return matchSearch && matchBranch && matchDate && matchTest;
    });
    
    renderPatientsTable();
    updateStatistics();
}

// ============= Tests Display Builder =============
// Build test badges HTML (short names) with overflow indicator and tooltip
function buildTestsBadges(tests) {
    if (!tests || tests.length === 0) {
        return '<span style="color:var(--gray-400);font-size:0.8rem;">-</span>';
    }
    
    const maxVisible = 3;
    const visibleTests = tests.slice(0, maxVisible);
    const hiddenCount = tests.length - maxVisible;
    
    // Full list for tooltip
    const fullList = tests.map((t, i) => `${i + 1}. ${t.shortName} (${t.name})`).join('\n');
    
    let html = '<div class="tests-badges" title="' + escapeAttr(fullList) + '">';
    visibleTests.forEach(t => {
        const label = t.shortName || t.name || '-';
        html += `<span class="test-chip" title="${escapeAttr(t.name || '')}">${escapeHtml(label)}</span>`;
    });
    if (hiddenCount > 0) {
        html += `<span class="test-chip test-chip-more" title="${escapeAttr(fullList)}">+${hiddenCount}</span>`;
    }
    html += '</div>';
    return html;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function escapeAttr(str) {
    if (!str) return '';
    return String(str).replace(/"/g, '&quot;').replace(/\n/g, '&#10;');
}

// ============= Render =============
function renderPatientsTable() {
    recordsCount.textContent = filteredPatients.length;
    
    if (filteredPatients.length === 0) {
        patientsTableBody.innerHTML = '<tr><td colspan="11" style="text-align:center;padding:40px;color:var(--gray-400);">لا توجد نتائج</td></tr>';
        return;
    }
    
    patientsTableBody.innerHTML = '';
    filteredPatients.forEach((patient, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td class="patient-name-cell">${escapeHtml(patient.name)}</td>
            <td>${patient.age}</td>
            <td><span class="badge ${patient.gender === 'ذكر' ? 'badge-blue' : 'badge-green'}">${patient.gender}</span></td>
            <td>${escapeHtml(patient.phone)}</td>
            <td style="font-size:0.8rem;">${escapeHtml(patient.branch || '')}</td>
            <td>${patient.date}</td>
            <td>${buildTestsBadges(patient.tests)}</td>
            <td style="text-align:center;"><span class="badge badge-blue">${patient.totalTests}</span></td>
            <td style="font-weight:700;color:var(--primary);white-space:nowrap;">${patient.totalAmount.toLocaleString('ar-DZ')} دج</td>
            <td style="white-space:nowrap;">
                <button class="action-btn view-btn" title="عرض"><i class="fas fa-eye"></i></button>
                <button class="action-btn delete delete-btn" title="حذف"><i class="fas fa-trash"></i></button>
            </td>
        `;
        
        tr.querySelector('.view-btn').addEventListener('click', () => showPatientDetails(patient));
        tr.querySelector('.delete-btn').addEventListener('click', () => deletePatient(patient.id));
        
        patientsTableBody.appendChild(tr);
    });
}

function updateStatistics() {
    const data = filteredPatients.length > 0 ? filteredPatients : allPatients;
    totalPatientsEl.textContent = data.length;
    totalTestsEl.textContent = data.reduce((sum, p) => sum + p.totalTests, 0);
    totalRevenueEl.textContent = data.reduce((sum, p) => sum + p.totalAmount, 0).toLocaleString('ar-DZ') + ' دج';
}

// ============= Modal =============
function showPatientDetails(patient) {
    currentPatient = patient;
    document.getElementById('modalPatientName').textContent = patient.name;
    
    let testsHTML = patient.tests.map((t, i) => `
        <div class="info-row">
            <div class="info-label">
                <span><strong>${i+1}.</strong> <span class="test-chip" style="margin:0 4px;">${escapeHtml(t.shortName || '')}</span> ${escapeHtml(t.name || '')}</span>
            </div>
            <div class="info-value price-highlight">${t.price.toLocaleString('ar-DZ')} دج</div>
        </div>
    `).join('');
    
    patientDetailsBody.innerHTML = `
        <div class="info-row"><div class="info-label"><i class="fas fa-birthday-cake"></i><span>العمر:</span></div><div class="info-value">${patient.age} سنة</div></div>
        <div class="info-row"><div class="info-label"><i class="fas fa-venus-mars"></i><span>الجنس:</span></div><div class="info-value">${patient.gender}</div></div>
        <div class="info-row"><div class="info-label"><i class="fas fa-phone"></i><span>الهاتف:</span></div><div class="info-value">${patient.phone}</div></div>
        <div class="info-row"><div class="info-label"><i class="fas fa-building"></i><span>الفرع:</span></div><div class="info-value">${patient.branch}</div></div>
        <div class="info-row"><div class="info-label"><i class="fas fa-calendar"></i><span>التاريخ:</span></div><div class="info-value">${patient.date}</div></div>
        ${patient.notes ? `<div class="info-row"><div class="info-label"><i class="fas fa-sticky-note"></i><span>ملاحظات:</span></div><div class="info-value">${escapeHtml(patient.notes)}</div></div>` : ''}
        <h4 style="margin:16px 0 8px;color:var(--gray-700);font-size:1rem;">التحاليل المطلوبة (${patient.totalTests}):</h4>
        ${testsHTML}
        <div class="info-row" style="background:var(--primary-50);border:1.5px solid var(--primary-100);">
            <div class="info-label"><i class="fas fa-coins"></i><span style="font-weight:800;">المجموع الكلي:</span></div>
            <div class="info-value price-highlight" style="font-size:1.3rem;">${patient.totalAmount.toLocaleString('ar-DZ')} دج</div>
        </div>
    `;
    
    patientDetailsModal.classList.add('active');
}

function closeModal() {
    patientDetailsModal.classList.remove('active');
    currentPatient = null;
}

// ============= Actions =============
function deletePatient(id) {
    if (!confirm('هل أنت متأكد من حذف هذا المريض؟')) return;
    allPatients = allPatients.filter(p => p.id !== id);
    localStorage.setItem('raedlab_patients', JSON.stringify(allPatients));
    filteredPatients = filteredPatients.filter(p => p.id !== id);
    populateTestFilter();
    renderPatientsTable();
    updateStatistics();
    showToast('تم حذف المريض بنجاح', 'warning');
}

function clearAllPatients() {
    if (allPatients.length === 0) return;
    if (!confirm('هل أنت متأكد من حذف جميع بيانات المرضى؟ لا يمكن التراجع.')) return;
    allPatients = [];
    filteredPatients = [];
    localStorage.removeItem('raedlab_patients');
    populateTestFilter();
    renderPatientsTable();
    updateStatistics();
    showToast('تم مسح جميع البيانات', 'warning');
}

// ============= Export Excel (with tests names) =============
function exportToExcel() {
    if (filteredPatients.length === 0) { showToast('لا توجد بيانات للتصدير', 'warning'); return; }
    
    let csv = '\uFEFF'; // BOM for Arabic
    csv += 'الاسم,العمر,الجنس,الهاتف,الفرع,التاريخ,عدد التحاليل,رموز التحاليل,أسماء التحاليل,المبلغ\n';
    filteredPatients.forEach(p => {
        const shortNames = (p.tests || []).map(t => t.shortName).join(' | ');
        const fullNames = (p.tests || []).map(t => t.name).join(' | ');
        csv += `"${p.name}",${p.age},"${p.gender}","${p.phone}","${p.branch}","${p.date}",${p.totalTests},"${shortNames}","${fullNames}",${p.totalAmount}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `raedlab_patients_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast('تم تصدير البيانات بنجاح', 'success');
}

// ============= Export PDF (with tests short names) =============
function exportToPDF() {
    if (filteredPatients.length === 0) { showToast('لا توجد بيانات للتصدير', 'warning'); return; }
    
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>قائمة المرضى - RAED LAB</title>
    <style>@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap');
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Tajawal',sans-serif;padding:20px;direction:rtl;}
    .header{text-align:center;border-bottom:3px solid #0D9488;padding-bottom:15px;margin-bottom:20px;}
    .header h1{color:#0D9488;font-size:1.5rem;}
    table{width:100%;border-collapse:collapse;margin-top:15px;}
    th,td{border:1px solid #E5E7EB;padding:7px;text-align:right;font-size:0.8rem;vertical-align:top;}
    th{background:#0D9488;color:white;font-weight:700;}
    .tests-cell{max-width:240px;}
    .chip{display:inline-block;background:#E0F2F1;color:#0D9488;padding:2px 7px;border-radius:12px;margin:2px;font-size:0.72rem;font-weight:700;border:1px solid #B2DFDB;}
    .total-row td{background:#F0FDFA;font-weight:800;color:#0D9488;}
    @media print{body{padding:10px;}}
    </style></head><body>
    <div class="header"><h1>🔬 RAED LAB - قائمة المرضى</h1><p>التاريخ: ${new Date().toLocaleDateString('ar-DZ')} | عدد السجلات: ${filteredPatients.length}</p></div>
    <table><thead><tr><th>#</th><th>الاسم</th><th>العمر</th><th>الجنس</th><th>الهاتف</th><th>الفرع</th><th>التاريخ</th><th>التحاليل</th><th>العدد</th><th>المبلغ</th></tr></thead><tbody>`);
    
    let grandTotal = 0;
    let grandTests = 0;
    filteredPatients.forEach((p, i) => {
        const chips = (p.tests || []).map(t => `<span class="chip">${t.shortName || ''}</span>`).join('');
        grandTotal += p.totalAmount;
        grandTests += p.totalTests;
        w.document.write(`<tr><td>${i+1}</td><td>${p.name}</td><td>${p.age}</td><td>${p.gender}</td><td>${p.phone}</td><td style="font-size:0.7rem;">${p.branch}</td><td>${p.date}</td><td class="tests-cell">${chips}</td><td style="text-align:center;">${p.totalTests}</td><td style="white-space:nowrap;">${p.totalAmount.toLocaleString('ar-DZ')} دج</td></tr>`);
    });
    w.document.write(`<tr class="total-row"><td colspan="8" style="text-align:center;">المجاميع</td><td style="text-align:center;">${grandTests}</td><td>${grandTotal.toLocaleString('ar-DZ')} دج</td></tr>`);
    
    w.document.write('</tbody></table><script>window.onload=function(){window.print();}<\/script></body></html>');
    w.document.close();
}

// ============= Print Single Patient =============
function printPatientDetails() {
    if (!currentPatient) return;
    const p = currentPatient;
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>بيانات المريض - RAED LAB</title>
    <style>@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap');
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Tajawal',sans-serif;padding:20px;direction:rtl;}
    .header{text-align:center;border-bottom:3px solid #0D9488;padding-bottom:15px;margin-bottom:20px;}
    .header h1{color:#0D9488;font-size:1.5rem;}
    .info{margin:10px 0;padding:8px 12px;background:#F9FAFB;border-radius:8px;display:flex;justify-content:space-between;}
    .info strong{color:#374151;}.info span{color:#6B7280;}
    table{width:100%;border-collapse:collapse;margin-top:15px;}
    th,td{border:1px solid #E5E7EB;padding:8px;text-align:right;font-size:0.9rem;}
    th{background:#0D9488;color:white;font-weight:700;}
    .short-chip{display:inline-block;background:#E0F2F1;color:#0D9488;padding:3px 8px;border-radius:12px;font-size:0.75rem;font-weight:700;border:1px solid #B2DFDB;}
    .total{background:#F0FDFA;font-weight:800;color:#0D9488;font-size:1.1rem;}</style></head><body>
    <div class="header"><h1>🔬 RAED LAB</h1><p>بيانات المريض</p></div>
    <div class="info"><strong>الاسم:</strong><span>${p.name}</span></div>
    <div class="info"><strong>العمر:</strong><span>${p.age} سنة</span></div>
    <div class="info"><strong>الجنس:</strong><span>${p.gender}</span></div>
    <div class="info"><strong>الهاتف:</strong><span>${p.phone}</span></div>
    <div class="info"><strong>الفرع:</strong><span>${p.branch}</span></div>
    <div class="info"><strong>التاريخ:</strong><span>${p.date}</span></div>
    ${p.notes ? `<div class="info"><strong>ملاحظات:</strong><span>${p.notes}</span></div>` : ''}
    <h3 style="margin:20px 0 10px;color:#0D9488;">التحاليل المطلوبة (${p.totalTests})</h3>
    <table><thead><tr><th>#</th><th>التحليل</th><th>الرمز</th><th>الأنبوب</th><th>السعر</th></tr></thead><tbody>`);
    
    p.tests.forEach((t, i) => {
        w.document.write(`<tr><td>${i+1}</td><td>${t.name}</td><td><span class="short-chip">${t.shortName}</span></td><td>${t.tube}</td><td>${t.price.toLocaleString('ar-DZ')} دج</td></tr>`);
    });
    
    w.document.write(`<tr class="total"><td colspan="4">المجموع الكلي</td><td>${p.totalAmount.toLocaleString('ar-DZ')} دج</td></tr></tbody></table><script>window.onload=function(){window.print();}<\/script></body></html>`);
    w.document.close();
}
