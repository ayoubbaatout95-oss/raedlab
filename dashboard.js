/* ============================================
   RAED LAB DASHBOARD — Cloud Logic (Firestore)
   ============================================ */
import { db, auth } from './firebase-config.js';
import { collection, getDocs, query, orderBy, where } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

let allPatients = [];

// ============ Today helpers ============
function todayISO() {
    const d = new Date();
    return d.toISOString().split('T')[0]; // صيغة YYYY-MM-DD
}

// ============ Authentication & Data Loading ============
onAuthStateChanged(auth, (user) => {
    if (user) {
        const adminEmail = "contact.raedlab@gmail.com"; 
        const isAdmin = (user.email === adminEmail);
        loadDashboardData(user.uid, isAdmin);
    } else {
        window.location.href = 'login.html';
    }
});

async function loadDashboardData(uid, isAdmin) {
    try {
        let q;
        if (isAdmin) {
            // المدير يرى الكل للحصول على إحصائيات شاملة
            q = query(collection(db, "patients"), orderBy("registeredAt", "desc"));
        } else {
            // الفرع يرى بياناته فقط
            q = query(collection(db, "patients"), where("branchId", "==", uid), orderBy("registeredAt", "desc"));
        }

        const querySnapshot = await getDocs(q);
        allPatients = [];
        querySnapshot.forEach((doc) => {
            allPatients.push({ firebaseId: doc.id, ...doc.data() });
        });

        updateKPIs();
        updateRecentPanel();
    } catch (error) {
        console.error("Dashboard Load Error:", error);
    }
}

// ============ Animate counter ============
function animateNumber(el, target, suffix = '') {
    if (!el) return;
    const start = 0;
    const duration = 800;
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

// ============ Update KPIs (Corrected for Firestore) ============
function updateKPIs() {
    const today = todayISO();
    const todayPatients = allPatients.filter(p => p.date === today);

    // حساب الإحصائيات الكلية
    const totalPatientsCount = allPatients.length;
    const totalTestsCount = allPatients.reduce((s, p) => s + (p.tests?.length || 0), 0);
    const totalRevenue = allPatients.reduce((s, p) => s + (p.totalAmount || 0), 0);

    // حساب إحصائيات اليوم
    const todayPatientsCount = todayPatients.length;
    const todayTestsCount = todayPatients.reduce((s, p) => s + (p.tests?.length || 0), 0);
    const todayRevenue = todayPatients.reduce((s, p) => s + (p.totalAmount || 0), 0);

    // تحديث الأرقام في الواجهة
    animateNumber(document.getElementById('kpiTotalPatients'), totalPatientsCount);
    animateNumber(document.getElementById('kpiTotalRevenue'), totalRevenue, ' دج');
    
    // إذا كان لديك عناصر "اليوم" في الواجهة
    const kpiToday = document.getElementById('kpiTodayPatients');
    if(kpiToday) animateNumber(kpiToday, todayPatientsCount);

    // تحديث أشرطة التقدم (Progress bars)
    const setBar = (id, todayVal, totalVal) => {
        const bar = document.getElementById(id);
        if (!bar) return;
        const pct = totalVal > 0 ? Math.min(100, (todayVal / totalVal) * 100) : 0;
        setTimeout(() => { bar.style.width = pct.toFixed(1) + '%'; }, 100);
    };
    setBar('kpiTodayPatientsBar', todayPatientsCount, Math.max(totalPatientsCount, 1));
}

// ============ Recent Activity (Firestore Version) ============
function updateRecentPanel() {
    const panel = document.getElementById('recentPanel');
    if (!panel) return;
    
    const recent = allPatients.slice(0, 5); // أحدث 5 سجلات

    if (recent.length === 0) {
        panel.innerHTML = '<div style="text-align:center;padding:20px;color:#999;">لا توجد سجلات بعد</div>';
        return;
    }

    panel.innerHTML = recent.map(p => {
        const initial = (p.name || '?')[0];
        const testsCount = p.tests?.length || 0;
        return `
            <div class="portal-recent-item" style="display:flex;align-items:center;gap:15px;padding:12px;border-bottom:1px solid #eee;">
                <div style="width:40px;height:40px;background:#0D9488;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;">
                    ${initial}
                </div>
                <div style="flex:1;">
                    <h4 style="margin:0;font-size:0.9rem;">${p.name}</h4>
                    <p style="margin:0;font-size:0.75rem;color:#666;">${p.branch} · ${testsCount} تحليل</p>
                </div>
                <div style="text-align:left;">
                    <span style="display:block;font-weight:bold;color:#0D9488;font-size:0.85rem;">${(p.totalAmount||0).toLocaleString('ar-DZ')} دج</span>
                    <span style="font-size:0.7rem;color:#999;">${p.date}</span>
                </div>
            </div>
        `;
    }).join('');
}
