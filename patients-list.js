// ============= Export PDF (Updated for Firebase & Modules) =============
import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// أضف هذه هنا فوراً لضمان عدم حدوث ReferenceError
window.filterPatients = filterPatients;
window.resetFilters = resetFilters;
window.exportToPDF = exportToPDF;
window.exportToExcel = exportToExcel;
function exportToPDF() {
    if (filteredPatients.length === 0) { 
        showToast('لا توجد بيانات للتصدير', 'warning'); 
        return; 
    }
    
    const w = window.open('', '_blank');
    if (!w) {
        showToast('يرجى السماح بالنوافذ المنبثقة (Pop-ups) للمتصفح', 'error');
        return;
    }

    w.document.write(`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>قائمة المرضى - RAED LAB</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Tajawal',sans-serif;padding:20px;direction:rtl;}
        .header{text-align:center;border-bottom:3px solid #0D9488;padding-bottom:15px;margin-bottom:20px;}
        .header h1{color:#0D9488;font-size:1.5rem;}
        table{width:100%;border-collapse:collapse;margin-top:15px;}
        th,td{border:1px solid #E5E7EB;padding:7px;text-align:right;font-size:0.8rem;vertical-align:top;}
        th{background:#0D9488;color:white;font-weight:700;}
        .chip{display:inline-block;background:#E0F2F1;color:#0D9488;padding:2px 7px;border-radius:12px;margin:2px;font-size:0.72rem;font-weight:700;border:1px solid #B2DFDB;}
        .total-row td{background:#F0FDFA;font-weight:800;color:#0D9488;}
    </style></head><body>
    <div class="header">
        <h1>🔬 RAED LAB - قائمة المرضى (سحابي)</h1>
        <p>التاريخ: ${new Date().toLocaleDateString('ar-DZ')} | سجلات: ${filteredPatients.length}</p>
    </div>
    <table><thead><tr><th>#</th><th>الاسم</th><th>العمر</th><th>الجنس</th><th>الهاتف</th><th>الفرع</th><th>التاريخ</th><th>التحاليل</th><th>العدد</th><th>المبلغ</th></tr></thead><tbody>`);
    
    let grandTotal = 0;
    let grandTests = 0;

    filteredPatients.forEach((p, i) => {
        const chips = (p.tests || []).map(t => `<span class="chip">${t.shortName || ''}</span>`).join('');
        const totalAmt = p.totalAmount || 0;
        const totalTsts = p.totalTests || 0;
        grandTotal += totalAmt;
        grandTests += totalTsts;

        w.document.write(`<tr>
            <td>${i+1}</td>
            <td>${p.name}</td>
            <td>${p.age}</td>
            <td>${p.gender}</td>
            <td>${p.phone}</td>
            <td>${p.branch || '-'}</td>
            <td>${p.date || '-'}</td>
            <td>${chips}</td>
            <td style="text-align:center;">${totalTsts}</td>
            <td>${totalAmt.toLocaleString('ar-DZ')} دج</td>
        </tr>`);
    });

    w.document.write(`<tr class="total-row">
        <td colspan="8" style="text-align:center;">المجموع الكلي</td>
        <td style="text-align:center;">${grandTests}</td>
        <td>${grandTotal.toLocaleString('ar-DZ')} دج</td>
    </tr>`);
    
    w.document.write('</tbody></table>');
    w.document.write('<script>window.onload=function(){ setTimeout(()=> { window.print(); }, 500); }<\/script></body></html>');
    w.document.close();
}

// ============= Export Excel (CSV) =============
function exportToExcel() {
    if (filteredPatients.length === 0) { showToast('لا توجد بيانات للتصدير', 'warning'); return; }
    let csv = '\uFEFF'; 
    csv += 'الاسم,العمر,الجنس,الهاتف,الفرع,التاريخ,عدد التحاليل,المبلغ\n';
    filteredPatients.forEach(p => {
        csv += `"${p.name}",${p.age},"${p.gender}","${p.phone}","${p.branch}","${p.date}",${p.totalTests},${p.totalAmount}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `raedlab_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// ==========================================================
// الهام جداً: ربط الدوال بـ window لتعمل مع أزرار الـ HTML
// ==========================================================
window.exportToPDF = exportToPDF;
window.exportToExcel = exportToExcel;
window.filterPatients = filterPatients;
window.resetFilters = resetFilters;
