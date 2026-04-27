// RAED LAB - Modern Patients List (Cloud Version)
import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

let allPatients = [];
let filteredPatients = [];
let currentPatient = null;

// ============= 1. DOM Elements =============
const patientsTableBody = document.getElementById('patientsTableBody');
const patientSearchInput = document.getElementById('patientSearchInput');
const branchFilter = document.getElementById('branchFilter');
const testFilter = document.getElementById('testFilter');
const dateFilter = document.getElementById('dateFilter');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');
const exportExcelBtn = document.getElementById('exportExcelBtn');
const exportPDFBtn = document.getElementById('exportPDFBtn');
const totalPatientsEl = document.getElementById('totalPatients');
const totalTestsEl = document.getElementById('totalTests');
const totalRevenueEl = document.getElementById('totalRevenue');
const recordsCount = document.getElementById('recordsCount');

// ============= 2. Core Functions (Definitions) =============

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

async function loadPatientsFromFirestore() {
    try {
        patientsTableBody.innerHTML = '<tr><td colspan="11" style="text-align:center;padding:40px;">جاري جلب البيانات...</td></tr>';
        const q = query(collection(db, "patients"), orderBy("registeredAt", "desc"));
        const querySnapshot = await getDocs(q);
        allPatients = [];
        querySnapshot.forEach((doc) => {
            allPatients.push({ firebaseId: doc.id, ...doc.data() });
        });
        filteredPatients = [...allPatients];
        renderPatientsTable();
        updateStatistics();
    } catch (error) {
        console.error(error);
        showToast('فشل جلب البيانات', 'error');
    }
}

function filterPatients() {
    const searchTerm = patientSearchInput.value.toLowerCase().trim();
    const branch = branchFilter.value;
    const date = dateFilter.value;
    
    filteredPatients = allPatients.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(searchTerm) || p.phone.includes(searchTerm);
        const matchBranch = branch === 'all' || p.branch === branch;
        const matchDate = !date || p.date === date;
        return matchSearch && matchBranch && matchDate;
    });
    renderPatientsTable();
    updateStatistics();
}

function resetFilters() {
    patientSearchInput.value = '';
    branchFilter.value = 'all';
    dateFilter.value = '';
    filterPatients();
    showToast('تمت إعادة التعيين', 'info');
}

function renderPatientsTable() {
    recordsCount.textContent = filteredPatients.length;
    patientsTableBody.innerHTML = '';
    filteredPatients.forEach((p, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${i + 1}</td>
            <td>${p.name}</td>
            <td>${p.age}</td>
            <td>${p.gender}</td>
            <td>${p.phone}</td>
            <td>${p.branch || '-'}</td>
            <td>${p.date || '-'}</td>
            <td>${(p.totalAmount || 0).toLocaleString('ar-DZ')} دج</td>
            <td>
                <button class="action-btn delete" onclick="deletePatient('${p.firebaseId}')"><i class="fas fa-trash"></i></button>
            </td>
        `;
        patientsTableBody.appendChild(tr);
    });
}

function updateStatistics() {
    totalPatientsEl.textContent = filteredPatients.length;
    const revenue = filteredPatients.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    totalRevenueEl.textContent = revenue.toLocaleString('ar-DZ') + ' دج';
}

// ============= 3. Export Functions =============

function exportToPDF() {
    if (filteredPatients.length === 0) {
        showToast('لا توجد بيانات للتصدير', 'warning');
        return;
    }

    const w = window.open('', '_blank');
    if (!w) {
        showToast('يرجى السماح بالنوافذ المنبثقة', 'error');
        return;
    }

    w.document.write(`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">
    <title>قائمة المرضى - RAED LAB</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Tajawal',sans-serif;padding:20px;direction:rtl;color:#333;}
        .header{text-align:center;border-bottom:3px solid #0D9488;padding-bottom:15px;margin-bottom:20px;}
        .header h1{color:#0D9488;font-size:1.5rem;margin-bottom:5px;}
        table{width:100%;border-collapse:collapse;margin-top:15px;}
        th,td{border:1px solid #E5E7EB;padding:10px;text-align:right;font-size:0.85rem;vertical-align:middle;}
        th{background:#0D9488;color:white;font-weight:700;}
        .test-item{display:inline-block;background:#F0FDFA;color:#0D9488;padding:2px 6px;border-radius:4px;margin:2px;font-size:0.75rem;border:1px solid #CCFBF1;font-weight:700;}
        .price-text{font-weight:800;color:#0D9488;white-space:nowrap;}
        .total-row td{background:#F9FAFB;font-weight:800;color:#0D9488;font-size:1rem;border-top:2px solid #0D9488;}
    </style></head><body>
    <div class="header">
        <h1>🔬 RAED LAB - قائمة التحاليل والبيانات</h1>
        <p>تاريخ التصدير: ${new Date().toLocaleDateString('ar-DZ')} | عدد المرضى: ${filteredPatients.length}</p>
    </div>
    <table><thead><tr>
        <th>#</th>
        <th>اسم المريض</th>
        <th>الهاتف</th>
        <th>التحاليل المطلوبة</th>
        <th>المبلغ الإجمالي</th>
    </tr></thead><tbody>`);

    let grandTotal = 0;

    filteredPatients.forEach((p, i) => {
        // تجميع أسماء التحاليل (الاسم المختصر) في شكل بطاقات صغيرة
        const testsList = (p.tests || []).map(t => `<span class="test-item">${t.shortName || t.name}</span>`).join(' ');
        const totalAmt = p.totalAmount || 0;
        grandTotal += totalAmt;

        w.document.write(`<tr>
            <td>${i + 1}</td>
            <td style="font-weight:700;">${p.name}</td>
            <td>${p.phone}</td>
            <td style="max-width:300px;">${testsList || '-'}</td>
            <td class="price-text">${totalAmt.toLocaleString('ar-DZ')} دج</td>
        </tr>`);
    });

    w.document.write(`
        <tr class="total-row">
            <td colspan="4" style="text-align:center;">المجموع الكلي للتحصيلات</td>
            <td>${grandTotal.toLocaleString('ar-DZ')} دج</td>
        </tr>
    </tbody></table>
    <script>window.onload=function(){ setTimeout(()=> { window.print(); }, 500); }<\/script>
    </body></html>`);
    
    w.document.close();
}

// ============= 4. Global Binding (The Solution) =============
// نربط الدوال بـ window في نهاية الملف لضمان تعريفها أولاً
window.filterPatients = filterPatients;
window.resetFilters = resetFilters;
window.exportToPDF = exportToPDF;
window.loadPatientsFromFirestore = loadPatientsFromFirestore;

// ============= 5. Event Listeners & Initialization =============
document.addEventListener('DOMContentLoaded', () => {
    loadPatientsFromFirestore();
    
    patientSearchInput.addEventListener('input', filterPatients);
    branchFilter.addEventListener('change', filterPatients);
    dateFilter.addEventListener('change', filterPatients);
    
    if(exportPDFBtn) exportPDFBtn.addEventListener('click', exportToPDF);
    if(resetFiltersBtn) resetFiltersBtn.addEventListener('click', resetFilters);
});
