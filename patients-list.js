// RAED LAB - Modern Patients List (Cloud, Admin Support & Styled PDF)
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

onAuthStateChanged(auth, (user) => {
    if (user) {
        // حساب المدير الرئيسي
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
            q = query(collection(db, "patients"), orderBy("registeredAt", "desc"));
            showToast('وضع المدير: عرض كافة الفروع', 'success');
        } else {
            q = query(collection(db, "patients"), where("branchId", "==", uid), orderBy("registeredAt", "desc"));
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
        showToast('خطأ في جلب البيانات', 'error');
    }
}

// ============= 3. Core Functions =============

// ============= تحديث عرض الجدول ليحتوي على بطاقات التحاليل =============

function renderPatientsTable() {
    recordsCount.textContent = filteredPatients.length;
    patientsTableBody.innerHTML = '';
    
    filteredPatients.forEach((p, i) => {
        const tr = document.createElement('tr');
        
        // 1. تحويل مصفوفة التحاليل إلى بطاقات HTML صغيرة
        const testsBadges = (p.tests || []).map(t => `
            <span style="
                display: inline-block;
                background: #F0FDFA;
                color: #0D9488;
                padding: 2px 8px;
                border-radius: 6px;
                margin: 2px;
                font-size: 0.75rem;
                border: 1px solid #CCFBF1;
                font-weight: bold;
                white-space: nowrap;
            ">
                ${t.shortName || t.name}
            </span>
        `).join('');

        tr.innerHTML = `
            <td>${i + 1}</td>
            <td style="font-weight:bold; min-width:150px;">${p.name}</td>
            <td>${p.age || '-'} سنة</td>
            <td>${p.gender || '-'}</td>
            
            <td style="max-width: 300px;">
                <div style="display: flex; flex-wrap: wrap; gap: 2px;">
                    ${testsBadges || '<span style="color:#999">لا توجد تحاليل</span>'}
                </div>
            </td>

            <td>
                <span class="branch-tag" style="background:#E0F2F1; color:#0D9488; padding:4px 8px; border-radius:4px; font-size:0.8rem; font-weight:bold;">
                    ${p.branch || 'غير محدد'} 
                </span>
            </td>
            
            <td>${p.date || '-'}</td>
            
            <td class="price-text" style="font-weight:bold; color:#0D9488; white-space:nowrap;">
                ${(p.totalAmount || 0).toLocaleString('ar-DZ')} دج
            </td>
            
            <td>
                <button class="action-btn delete" onclick="deletePatient('${p.firebaseId}')" style="color: #EF4444; background: none; border: none; cursor: pointer;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        patientsTableBody.appendChild(tr);
    });
}}

function filterPatients() {
    const searchTerm = (patientSearchInput.value || '').toLowerCase().trim();
    const branch = branchFilter.value;
    const date = dateFilter.value;
    
    filteredPatients = allPatients.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(searchTerm) || (p.phone && p.phone.includes(searchTerm));
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

// ============= 4. PDF Export (Styled Cards Version) =============
function exportToPDF() {
    if (filteredPatients.length === 0) {
        showToast('لا توجد بيانات للتصدير', 'warning');
        return;
    }

    const w = window.open('', '_blank');
    if (!w) return;

    w.document.write(`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">
    <title>قائمة المرضى - RAED LAB</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Tajawal',sans-serif;padding:30px;direction:rtl;color:#333;background:#fff;}
        .header{text-align:center;border-bottom:3px solid #0D9488;padding-bottom:15px;margin-bottom:25px;}
        .header h1{color:#0D9488;font-size:1.8rem;margin-bottom:5px;}
        table{width:100%;border-collapse:collapse;margin-top:10px;}
        th,td{border:1px solid #E5E7EB;padding:12px 8px;text-align:right;font-size:0.9rem;}
        th{background:#0D9488;color:white;font-weight:700;}
        .test-badge{display:inline-block;background:#F0FDFA;color:#0D9488;padding:3px 8px;border-radius:6px;margin:2px;font-size:0.75rem;border:1px solid #CCFBF1;font-weight:700;}
        .branch-name{font-size:0.75rem;color:#666;display:block;margin-top:3px;}
        .price-text{font-weight:800;color:#0D9488;}
        .footer-row td{background:#F9FAFB;font-weight:800;color:#0D9488;font-size:1.1rem;border-top:2px solid #0D9488;}
    </style></head><body>
    <div class="header">
        <h1>🔬 رائد لاب - تقرير البيانات السحابي</h1>
        <p>تاريخ التقرير: ${new Date().toLocaleDateString('ar-DZ')} | إجمالي المرضى: ${filteredPatients.length}</p>
    </div>
    <table><thead><tr>
        <th>#</th>
        <th>المريض / الفرع</th>
        <th>العمر</th>
        <th>التحاليل المطلوبة</th>
        <th>المبلغ الإجمالي</th>
    </tr></thead><tbody>`);

    let grandTotal = 0;

    filteredPatients.forEach((p, i) => {
        // جلب التحاليل في شكل بطاقات (badges)
        const testsList = (p.tests || []).map(t => `<span class="test-badge">${t.shortName || t.name}</span>`).join(' ');
        const totalAmt = p.totalAmount || 0;
        grandTotal += totalAmt;

        w.document.write(`<tr>
            <td>${i + 1}</td>
            <td>
                <div style="font-weight:700;">${p.name}</div>
                <div class="branch-name">🏥 ${p.branch || 'غير محدد'}</div>
            </td>
            <td>${p.age || '-'} سنة</td>
            <td style="max-width:350px;">${testsList || 'لا توجد تحاليل'}</td>
            <td class="price-text">${totalAmt.toLocaleString('ar-DZ')} دج</td>
        </tr>`);
    });

    w.document.write(`
        <tr class="footer-row">
            <td colspan="4" style="text-align:center;">إجمالي تحصيلات القائمة المعروضة</td>
            <td>${grandTotal.toLocaleString('ar-DZ')} دج</td>
        </tr>
    </tbody></table>
    <script>window.onload=function(){ setTimeout(()=> { window.print(); }, 500); }<\/script>
    </body></html>`);
    
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
