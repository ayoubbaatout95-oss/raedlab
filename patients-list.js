// RAED LAB - Modern Patients List (Cloud, Admin Support & Styled Badges)
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

// ============= 2. Authentication & Data Loading =============

onAuthStateChanged(auth, (user) => {
    if (user) {
        // حساب المدير الرئيسي
        const adminEmail = "contact.raedlab@gmail.com"; 
        const isAdmin = (user.email === adminEmail);
        loadPatients(user.uid, isAdmin);
    } else {
        // توجيه لصفحة الدخول إذا لم يتم تسجيل الدخول
        window.location.href = 'login.html';
    }
});

async function loadPatients(uid, isAdmin) {
    try {
        patientsTableBody.innerHTML = '<tr><td colspan="11" style="text-align:center;padding:40px;">جاري جلب البيانات السحابية...</td></tr>';
        
        let q;
        if (isAdmin) {
            // المدير يرى كل البيانات
            q = query(collection(db, "patients"), orderBy("registeredAt", "desc"));
            showToast('وضع المدير: عرض كافة الفروع', 'success');
        } else {
            // الفرع يرى بياناته فقط بناءً على الـ UID الخاص به
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
        showToast('خطأ في جلب البيانات (تأكد من إعدادات الفهرسة Index)', 'error');
    }
}

// ============= 3. Core Functions =============

function renderPatientsTable() {
    recordsCount.textContent = filteredPatients.length;
    patientsTableBody.innerHTML = '';
    
    filteredPatients.forEach((p, i) => {
        const tr = document.createElement('tr');
        
        // تحويل التحاليل إلى بطاقات ملونة (Badges) داخل الجدول
        const testsBadges = (p.tests || []).map(t => `
            <span style="display:inline-block; background:#F0FDFA; color:#0D9488; padding:2px 6px; border-radius:6px; margin:2px; font-size:0.7rem; border:1px solid #CCFBF1; font-weight:bold; white-space:nowrap;">
                ${t.shortName || t.name}
            </span>
        `).join('');

        tr.innerHTML = `
            <td>${i + 1}</td>
            <td style="font-weight:bold; min-width:120px;">${p.name}</td>
            <td>${p.age || '-'} سنة</td>
            <td>${p.gender || '-'}</td>
            <td>${p.phone || '-'}</td>
            
            <td style="max-width: 250px;">
                <div style="display: flex; flex-wrap: wrap; gap: 2px;">
                    ${testsBadges || '<span style="color:#999">لا يوجد</span>'}
                </div>
            </td>

            <td>
                <span class="branch-tag" style="background:#E0F2F1; color:#0D9488; padding:4px 8px; border-radius:4px; font-size:0.75rem; font-weight:bold;">
                    ${p.branch || 'غير محدد'} 
                </span>
            </td>
            <td>${p.date || '-'}</td>
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

async function deletePatient(id) {
    if (confirm('هل أنت متأكد من حذف هذا السجل نهائياً من السحابة؟')) {
        try {
            await deleteDoc(doc(db, "patients", id));
            showToast('تم الحذف بنجاح', 'success');
            // تحديث القائمة محلياً دون إعادة تحميل الصفحة
            allPatients = allPatients.filter(p => p.firebaseId !== id);
            filterPatients();
        } catch (error) {
            showToast('فشل الحذف، حاول مجدداً', 'error');
        }
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
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ============= 4. PDF Export (Styled Cards) =============
function exportToPDF() {
    if (filteredPatients.length === 0) return;
    const w = window.open('', '_blank');
    w.document.write(`
        <!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap');
            body { font-family: 'Tajawal', sans-serif; padding: 20px; direction: rtl; }
            .header { text-align: center; border-bottom: 2px solid #0D9488; margin-bottom: 20px; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: right; font-size: 0.85rem; }
            th { background: #0D9488; color: white; }
            .test-badge { display: inline-block; background: #F0FDFA; color: #0D9488; padding: 2px 6px; border-radius: 4px; margin: 2px; font-size: 0.7rem; border: 1px solid #CCFBF1; font-weight: bold; }
            .total-row { background: #f9f9f9; font-weight: bold; color: #0D9488; }
        </style></head><body>
            <div class="header">
                <h1>🔬 رائد لاب - قائمة المرضى والتحاليل</h1>
                <p>إجمالي المرضى: ${filteredPatients.length} | المجموع: ${totalRevenueEl.textContent}</p>
            </div>
            <table>
                <thead><tr><th>#</th><th>اسم المريض</th><th>العمر</th><th>التحاليل المطلوبة</th><th>الفرع</th><th>المبلغ</th></tr></thead>
                <tbody>
                    ${filteredPatients.map((p, i) => `
                        <tr>
                            <td>${i + 1}</td>
                            <td style="font-weight:bold;">${p.name}</td>
                            <td>${p.age || '-'} سنة</td>
                            <td style="max-width:300px;">
                                ${(p.tests || []).map(t => `<span class="test-badge">${t.shortName || t.name}</span>`).join('')}
                            </td>
                            <td>${p.branch || '-'}</td>
                            <td>${(p.totalAmount || 0).toLocaleString('ar-DZ')} دج</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <script>window.onload = () => { setTimeout(()=> window.print(), 500); }</script>
        </body></html>
    `);
    w.document.close();
}

// ============= 5. Global Bindings & Events =============
window.filterPatients = filterPatients;
window.exportToPDF = exportToPDF;
window.deletePatient = deletePatient;

document.addEventListener('DOMContentLoaded', () => {
    patientSearchInput.addEventListener('input', filterPatients);
    branchFilter.addEventListener('change', filterPatients);
    dateFilter.addEventListener('change', filterPatients);
    if(exportPDFBtn) exportPDFBtn.addEventListener('click', exportToPDF);
});
