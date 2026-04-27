// RAED LAB - Final Corrected Version
import { db, auth } from './firebase-config.js';
import { collection, getDocs, query, orderBy, where, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
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

// ============= 2. Authentication & Security =============
onAuthStateChanged(auth, (user) => {
    if (user) {
        // حساب المدير (Admin)
        const adminEmail = "contact.raedlab@gmail.com"; 
        const isAdmin = (user.email === adminEmail);
        loadPatients(user.uid, isAdmin);
    } else {
        window.location.href = 'login.html';
    }
});

async function loadPatients(uid, isAdmin) {
    try {
        patientsTableBody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:40px;">جاري تحميل البيانات...</td></tr>';
        
        let q;
        if (isAdmin) {
            // المدير يرى كل الفروع
            q = query(collection(db, "patients"), orderBy("registeredAt", "desc"));
        } else {
            // كل فرع يرى مرضاه فقط بناءً على UID
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

// ============= 3. Rendering Table (Corrected Columns) =============
function renderPatientsTable() {
    recordsCount.textContent = filteredPatients.length;
    patientsTableBody.innerHTML = '';
    
    filteredPatients.forEach((p, i) => {
        const tr = document.createElement('tr');
        
        // تحويل التحاليل إلى بطاقات ملونة أنيقة
        const testsBadges = (p.tests || []).map(t => `
            <span style="display:inline-block; background:#F0FDFA; color:#0D9488; padding:2px 6px; border-radius:6px; margin:2px; font-size:0.7rem; border:1px solid #CCFBF1; font-weight:bold;">
                ${t.shortName || t.name}
            </span>
        `).join('');

        // الترتيب الدقيق للأعمدة بناءً على الصورة المرفقة
        tr.innerHTML = `
            <td>${i + 1}</td>
            <td style="font-weight:bold;">${p.name}</td>
            <td>${p.age || '-'} سنة</td>
            <td>${p.gender || '-'}</td>
            <td>${p.phone || '-'}</td>
            <td>
                <span class="branch-tag" style="background:#E0F2F1; color:#0D9488; padding:4px 8px; border-radius:4px; font-size:0.75rem; font-weight:bold;">
                    ${p.branch || 'غير محدد'} 
                </span>
            </td>
            <td>${p.date || '-'}</td>
            <td style="max-width: 250px;">
                <div style="display: flex; flex-wrap: wrap; gap: 2px;">
                    ${testsBadges || '<span style="color:#999">لا يوجد</span>'}
                </div>
            </td>
            <td class="price-text" style="font-weight:bold; color:#0D9488;">
                ${(p.totalAmount || 0).toLocaleString('ar-DZ')} دج
            </td>
            <td>
                <button class="action-btn delete" onclick="deletePatient('${p.firebaseId}')" style="border:none; background:none; color:#ef4444; cursor:pointer;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        patientsTableBody.appendChild(tr);
    });
}

// ============= 4. Helpers & Exports =============
async function deletePatient(id) {
    if (confirm('هل أنت متأكد من حذف هذا السجل؟')) {
        try {
            await deleteDoc(doc(db, "patients", id));
            allPatients = allPatients.filter(p => p.firebaseId !== id);
            filterPatients();
            showToast('تم الحذف بنجاح', 'success');
        } catch (error) { showToast('خطأ في الحذف', 'error'); }
    }
}

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
    if (container) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

// التصدير للـ PDF بنفس التنسيق المصلح
function exportToPDF() {
    if (filteredPatients.length === 0) return;
    const w = window.open('', '_blank');
    w.document.write(`
        <html><head><title>RAED LAB - PDF</title>
        <style>
            body { font-family: sans-serif; direction: rtl; padding: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
            th { background: #0D9488; color: white; }
            .test-badge { background: #F0FDFA; color: #0D9488; padding: 2px 5px; border-radius: 4px; font-size: 0.7rem; border: 1px solid #CCFBF1; margin: 1px; display: inline-block; }
        </style></head><body>
            <h2 style="text-align:center; color:#0D9488;">تقرير مرضى رائد لاب</h2>
            <table>
                <thead><tr><th>#</th><th>المريض</th><th>العمر</th><th>الفرع</th><th>التاريخ</th><th>التحاليل</th><th>المبلغ</th></tr></thead>
                <tbody>
                    ${filteredPatients.map((p, i) => `
                        <tr>
                            <td>${i+1}</td>
                            <td>${p.name}</td>
                            <td>${p.age}</td>
                            <td>${p.branch}</td>
                            <td>${p.date}</td>
                            <td>${(p.tests || []).map(t => `<span class="test-badge">${t.shortName || t.name}</span>`).join('')}</td>
                            <td>${(p.totalAmount || 0).toLocaleString('ar-DZ')} دج</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <script>window.onload = () => window.print();</script>
        </body></html>
    `);
    w.document.close();
}

// ============= 5. Event Listeners =============
window.filterPatients = filterPatients;
window.exportToPDF = exportToPDF;
window.deletePatient = deletePatient;

document.addEventListener('DOMContentLoaded', () => {
    patientSearchInput.addEventListener('input', filterPatients);
    branchFilter.addEventListener('change', filterPatients);
    dateFilter.addEventListener('change', filterPatients);
    if(exportPDFBtn) exportPDFBtn.addEventListener('click', exportToPDF);
});
