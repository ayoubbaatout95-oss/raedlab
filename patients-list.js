// RAED LAB - Modern Patients List (Cloud & Admin Support)
import { db, auth } from './firebase-config.js';
import { collection, getDocs, query, orderBy, where } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

let allPatients = [];
let filteredPatients = [];

// ============= 1. DOM Elements =============
const patientsTableBody = document.getElementById('patientsTableBody');
const patientSearchInput = document.getElementById('patientSearchInput');
const branchFilter = document.getElementById('branchFilter');
const dateFilter = document.getElementById('dateFilter');
const totalPatientsEl = document.getElementById('totalPatients');
const totalRevenueEl = document.getElementById('totalRevenue');
const recordsCount = document.getElementById('recordsCount');
const exportPDFBtn = document.getElementById('exportPDFBtn');

// ============= 2. Authentication & Data Loading =============

// مراقبة حالة الدخول وتحديد الصلاحيات
onAuthStateChanged(auth, (user) => {
    if (user) {
        // ضع بريدك الإلكتروني هنا ليكون هو حساب المدير
        const adminEmail = "contact.raedlab@gmail.com"; 
        const isAdmin = (user.email === adminEmail);
        
        loadPatients(user.uid, isAdmin);
    } else {
        window.location.href = 'login.html';
    }
});

async function loadPatients(uid, isAdmin) {
    try {
        patientsTableBody.innerHTML = '<tr><td colspan="11" style="text-align:center;padding:40px;">جاري جلب البيانات...</td></tr>';
        
        let q;
        if (isAdmin) {
            // المدير يرى كل شيء
            q = query(collection(db, "patients"), orderBy("registeredAt", "desc"));
            showToast('وضع المدير: عرض كافة الفروع', 'success');
        } else {
            // الفرع يرى بياناته فقط
            q = query(
                collection(db, "patients"), 
                where("branchId", "==", uid), 
                orderBy("registeredAt", "desc")
            );
        }

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
        showToast('خطأ في جلب البيانات (تأكد من الفهرسة/Index)', 'error');
    }
}

// ============= 3. Core Functions =============

function renderPatientsTable() {
    recordsCount.textContent = filteredPatients.length;
    patientsTableBody.innerHTML = '';
    
    filteredPatients.forEach((p, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${i + 1}</td>
            <td style="font-weight:bold;">${p.name}</td>
            <td>${p.age || '-'} سنة</td> <td>${p.gender || '-'}</td>
            <td>${p.phone || '-'}</td>
            <td>
                <span class="branch-tag" style="background:#E0F2F1; color:#0D9488; padding:4px 8px; border-radius:4px; font-size:0.8rem; font-weight:bold;">
                    ${p.branch || 'غير محدد'} 
                </span>
            </td> <td>${p.date || '-'}</td>
            <td class="price-text" style="font-weight:bold; color:#0D9488;">
                ${(p.totalAmount || 0).toLocaleString('ar-DZ')} دج
            </td>
            <td>
                <button class="action-btn delete" onclick="deletePatient('${p.firebaseId}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        patientsTableBody.appendChild(tr);
    });
}

function filterPatients() {
    const searchTerm = (patientSearchInput.value || '').toLowerCase().trim();
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

function updateStatistics() {
    totalPatientsEl.textContent = filteredPatients.length;
    const revenue = filteredPatients.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    totalRevenueEl.textContent = revenue.toLocaleString('ar-DZ') + ' دج';
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ============= 4. PDF Export (Updated) =============
function exportToPDF() {
    if (filteredPatients.length === 0) return;
    const w = window.open('', '_blank');
    w.document.write(`
        <html><head><title>RAED LAB - PDF</title>
        <style>
            body { font-family: sans-serif; direction: rtl; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
            th { background: #0D9488; color: white; }
            h2 { color: #0D9488; text-align: center; }
        </style></head>
        <body>
            <h2>🔬 تقرير مرضى رائد لاب</h2>
            <p>عدد السجلات: ${filteredPatients.length} | المجموع: ${totalRevenueEl.textContent}</p>
            <table>
                <thead><tr><th>#</th><th>المريض</th><th>الفرع</th><th>التاريخ</th><th>المبلغ</th></tr></thead>
                <tbody>
                    ${filteredPatients.map((p, i) => `
                        <tr>
                            <td>${i+1}</td>
                            <td>${p.name}</td>
                            <td>${p.branch}</td>
                            <td>${p.date}</td>
                            <td>${p.totalAmount} دج</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <script>window.onload = () => window.print();</script>
        </body></html>
    `);
    w.document.close();
}

// ============= 5. Global Bindings & Events =============
window.filterPatients = filterPatients;
window.exportToPDF = exportToPDF;

document.addEventListener('DOMContentLoaded', () => {
    patientSearchInput.addEventListener('input', filterPatients);
    branchFilter.addEventListener('change', filterPatients);
    dateFilter.addEventListener('change', filterPatients);
    if(exportPDFBtn) exportPDFBtn.addEventListener('click', exportToPDF);
});
