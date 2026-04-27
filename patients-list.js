// استيراد الإعدادات والوظائف المطلوبة من Firebase
import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

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
    loadPatientsFromFirestore(); // تغيير المصدر إلى Firestore
    setupEventListeners();
});

function setupEventListeners() {
    patientSearchInput.addEventListener('input', filterPatients);
    branchFilter.addEventListener('change', filterPatients);
    if (testFilter) testFilter.addEventListener('change', filterPatients);
    dateFilter.addEventListener('change', filterPatients);
    if (resetFiltersBtn) resetFiltersBtn.addEventListener('click', resetFilters);
    exportExcelBtn.addEventListener('click', exportToExcel);
    exportPDFBtn.addEventListener('click', exportToPDF);
    clearAllBtn.addEventListener('click', clearAllPatients); // ملاحظة: هذا سيحتاج صلاحيات خاصة في Firebase
    closeDetailsModal.addEventListener('click', closeModal);
    closeModalBtn.addEventListener('click', closeModal);
    printPatientBtn.addEventListener('click', printPatientDetails);
    patientDetailsModal.querySelector('.modal-overlay').addEventListener('click', closeModal);
}

// ============= جلب البيانات من السحابة =============
async function loadPatientsFromFirestore() {
    try {
        // إظهار حالة التحميل
        patientsTableBody.innerHTML = '<tr><td colspan="11" style="text-align:center;padding:40px;">جاري جلب البيانات من السحابة...</td></tr>';
        
        const q = query(collection(db, "patients"), orderBy("registeredAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        allPatients = [];
        querySnapshot.forEach((doc) => {
            allPatients.push({ firebaseId: doc.id, ...doc.data() });
        });

        filteredPatients = [...allPatients];
        populateTestFilter();
        renderPatientsTable();
        updateStatistics();
    } catch (error) {
        console.error("Error loading patients: ", error);
        showToast('فشل في جلب البيانات من السحابة', 'error');
    }
}

function populateTestFilter() {
    if (!testFilter) return;
    const testsSet = new Map();
    allPatients.forEach(p => {
        (p.tests || []).forEach(t => {
            if (t.shortName && !testsSet.has(t.shortName)) {
                testsSet.set(t.shortName, t.name || t.shortName);
            }
        });
    });
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

function buildTestsBadges(tests) {
    if (!tests || tests.length === 0) return '<span style="color:var(--gray-400);font-size:0.8rem;">-</span>';
    const maxVisible = 3;
    const visibleTests = tests.slice(0, maxVisible);
    const hiddenCount = tests.length - maxVisible;
    const fullList = tests.map((t, i) => `${i + 1}. ${t.shortName} (${t.name})`).join('\n');
    let html = '<div class="tests-badges" title="' + escapeAttr(fullList) + '">';
    visibleTests.forEach(t => {
        html += `<span class="test-chip" title="${escapeAttr(t.name || '')}">${escapeHtml(t.shortName || t.name)}</span>`;
    });
    if (hiddenCount > 0) html += `<span class="test-chip test-chip-more">+${hiddenCount}</span>`;
    html += '</div>';
    return html;
}

function escapeHtml(str) { return String(str || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function escapeAttr(str) { return String(str || '').replace(/"/g, '&quot;').replace(/\n/g, '&#10;'); }

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
        tr.querySelector('.delete-btn').addEventListener('click', () => deletePatientFromFirestore(patient.firebaseId));
        patientsTableBody.appendChild(tr);
    });
}

function updateStatistics() {
    const data = filteredPatients;
    totalPatientsEl.textContent = data.length;
    totalTestsEl.textContent = data.reduce((sum, p) => sum + (p.totalTests || 0), 0);
    totalRevenueEl.textContent = data.reduce((sum, p) => sum + (p.totalAmount || 0), 0).toLocaleString('ar-DZ') + ' دج';
}

async function deletePatientFromFirestore(id) {
    if (!confirm('هل أنت متأكد من حذف هذا المريض من السحابة؟')) return;
    try {
        await deleteDoc(doc(db, "patients", id));
        showToast('تم حذف المريض بنجاح', 'warning');
        loadPatientsFromFirestore(); // إعادة تحميل البيانات
    } catch (error) {
        showToast('فشل في الحذف', 'error');
    }
}

// ... بقية الدوال (Modal, Export, Print) تبقى كما هي مع تغيير طفيف للتعامل مع Firebase data ...

function closeModal() {
    patientDetailsModal.classList.remove('active');
    currentPatient = null;
}

function showPatientDetails(patient) {
    currentPatient = patient;
    document.getElementById('modalPatientName').textContent = patient.name;
    let testsHTML = (patient.tests || []).map((t, i) => `
        <div class="info-row">
            <div class="info-label">
                <span><strong>${i+1}.</strong> <span class="test-chip" style="margin:0 4px;">${escapeHtml(t.shortName || '')}</span> ${escapeHtml(t.name || '')}</span>
            </div>
            <div class="info-value price-highlight">${(t.price || 0).toLocaleString('ar-DZ')} دج</div>
        </div>
    `).join('');
    patientDetailsBody.innerHTML = `
        <div class="info-row"><div class="info-label"><i class="fas fa-birthday-cake"></i><span>العمر:</span></div><div class="info-value">${patient.age} سنة</div></div>
        <div class="info-row"><div class="info-label"><i class="fas fa-venus-mars"></i><span>الجنس:</span></div><div class="info-value">${patient.gender}</div></div>
        <div class="info-row"><div class="info-label"><i class="fas fa-phone"></i><span>الهاتف:</span></div><div class="info-value">${patient.phone}</div></div>
        <div class="info-row"><div class="info-label"><i class="fas fa-building"></i><span>الفرع:</span></div><div class="info-value">${patient.branch}</div></div>
        <div class="info-row"><div class="info-label"><i class="fas fa-calendar"></i><span>التاريخ:</span></div><div class="info-value">${patient.date}</div></div>
        <h4 style="margin:16px 0 8px;color:var(--gray-700);font-size:1rem;">التحاليل المطلوبة:</h4>
        ${testsHTML}
        <div class="info-row" style="background:var(--primary-50);border:1.5px solid var(--primary-100);">
            <div class="info-label"><i class="fas fa-coins"></i><span style="font-weight:800;">المجموع الكلي:</span></div>
            <div class="info-value price-highlight" style="font-size:1.3rem;">${(patient.totalAmount || 0).toLocaleString('ar-DZ')} دج</div>
        </div>
    `;
    patientDetailsModal.classList.add('active');
}

// الدوال المتبقية (Export, Print) تستخدم بيانات filteredPatients التي أصبحت تأتي من Firebase
