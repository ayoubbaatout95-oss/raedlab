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
    if (filteredPatients.length === 0) return;
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>RAED LAB PDF</title><style>
        body{font-family:sans-serif; direction:rtl; padding:20px;}
        table{width:100%; border-collapse:collapse;}
        th,td{border:1px solid #ccc; padding:8px; text-align:right;}
        th{background:#0D9488; color:white;}
    </style></head><body>
    <h2>🔬 قائمة مرضى رائد لاب السحابية</h2>
    <table><thead><tr><th>الاسم</th><th>الهاتف</th><th>التاريخ</th><th>المبلغ</th></tr></thead><tbody>
    ${filteredPatients.map(p => `<tr><td>${p.name}</td><td>${p.phone}</td><td>${p.date}</td><td>${p.totalAmount} دج</td></tr>`).join('')}
    </tbody></table>
    <script>window.onload=function(){window.print();}<\/script></body></html>`);
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
