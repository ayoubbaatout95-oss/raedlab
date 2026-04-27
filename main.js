// RAED LAB - Modern Main JavaScript - Updated 2025

// ============ STATE ============
let cart = [];
let filteredTests = [...medicalTests];
let currentCategory = 'all';
let currentSort = 'name-asc';
let currentTubeFilter = 'all';
let searchDebounceTimer = null;

// ============ DOM ELEMENTS ============
const testsList = document.getElementById('testsList');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const filterBtns = document.querySelectorAll('.filter-btn');
const tubeFilterBtns = document.querySelectorAll('.tube-filter-btn');
const cartItems = document.getElementById('cartItems');
const cartItemsMobile = document.getElementById('cartItemsMobile');
const cartCount = document.getElementById('cartCount');
const cartTotal = document.getElementById('cartTotal');
const cartCountMobile = document.getElementById('cartCountMobile');
const cartTotalMobile = document.getElementById('cartTotalMobile');
const clearCartBtn = document.getElementById('clearCart');
const clearCartMobile = document.getElementById('clearCartMobile');
const shareWhatsappBtn = document.getElementById('shareWhatsapp');
const shareWhatsappMobile = document.getElementById('shareWhatsappMobile');
const printBtn = document.getElementById('printBtn');
const printBtnMobile = document.getElementById('printBtnMobile');
const testsCount = document.getElementById('testsCount');
const noResults = document.getElementById('noResults');
const floatingCartBtn = document.getElementById('floatingCartBtn');
const floatingCartBadge = document.getElementById('floatingCartBadge');
const cartDrawer = document.getElementById('cartDrawer');
const cartDrawerOverlay = document.getElementById('cartDrawerOverlay');
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
const navOverlay = document.getElementById('navOverlay');
const header = document.getElementById('header');

// ============ TOAST SYSTEM ============
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: 'check-circle', error: 'exclamation-circle', info: 'info-circle', warning: 'exclamation-triangle' };
    toast.innerHTML = `<i class="fas fa-${icons[type] || 'info-circle'}"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3000);
}

// ============ INITIALIZE ============
document.addEventListener('DOMContentLoaded', function() {
    loadCartFromStorage();
    renderTests();
    setupEventListeners();
    updateCart();
    updateHeroStats();
});

// ============ EVENT LISTENERS ============
function setupEventListeners() {
    // Search with debounce
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => handleSearch(e), 200);
    });
    
    sortSelect.addEventListener('change', handleSort);
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', handleFilter);
    });
    
    // Tube filter buttons
    tubeFilterBtns.forEach(btn => {
        btn.addEventListener('click', handleTubeFilter);
    });
    
    // Cart actions (desktop)
    clearCartBtn.addEventListener('click', clearCart);
    shareWhatsappBtn.addEventListener('click', shareViaWhatsapp);
    printBtn.addEventListener('click', printCart);
    
    // Cart actions (mobile)
    clearCartMobile.addEventListener('click', clearCart);
    shareWhatsappMobile.addEventListener('click', shareViaWhatsapp);
    printBtnMobile.addEventListener('click', printCart);
    
    // Floating cart button
    floatingCartBtn.addEventListener('click', toggleCartDrawer);
    cartDrawerOverlay.addEventListener('click', closeCartDrawer);
    
    // Hamburger menu
    hamburger.addEventListener('click', toggleNav);
    navOverlay.addEventListener('click', closeNav);
    
    // Header scroll effect
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 10);
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement !== searchInput) {
            e.preventDefault();
            searchInput.focus();
        }
        if (e.key === 'Escape') {
            closeCartDrawer();
            closeNav();
        }
    });
}

// ============ NAVIGATION ============
function toggleNav() {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
    navOverlay.classList.toggle('active');
    document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
}

function closeNav() {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
    navOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

// ============ CART DRAWER (Mobile) ============
function toggleCartDrawer() {
    const isActive = cartDrawer.classList.contains('active');
    if (isActive) {
        closeCartDrawer();
    } else {
        cartDrawerOverlay.style.display = 'block';
        requestAnimationFrame(() => {
            cartDrawerOverlay.classList.add('active');
            cartDrawer.classList.add('active');
        });
        document.body.style.overflow = 'hidden';
    }
}

function closeCartDrawer() {
    cartDrawerOverlay.classList.remove('active');
    cartDrawer.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => { cartDrawerOverlay.style.display = 'none'; }, 300);
}

// ============ HERO STATS ============
function updateHeroStats() {
    const el = document.getElementById('totalTestsHero');
    if (el) el.textContent = medicalTests.length;
}

// ============ GET TUBE COLOR INFO ============
function getTubeColorInfo(tubeName) {
    return tubeColors[tubeName] || { color: '#9CA3AF', bgColor: '#F3F4F6', icon: '⚪' };
}

// ============ RENDER TESTS ============
function renderTests() {
    if (filteredTests.length === 0) {
        testsList.style.display = 'none';
        noResults.style.display = 'block';
        testsCount.textContent = '0';
        return;
    }
    
    testsList.style.display = 'grid';
    noResults.style.display = 'none';
    testsCount.textContent = filteredTests.length;
    
    // Use DocumentFragment for performance
    const fragment = document.createDocumentFragment();
    
    filteredTests.forEach((test, index) => {
        const isSelected = cart.some(item => item.id === test.id);
        const tubeInfo = getTubeColorInfo(test.tube);
        
        const card = document.createElement('div');
        card.className = `test-card ${isSelected ? 'selected' : ''}`;
        card.style.animationDelay = `${Math.min(index * 30, 300)}ms`;
        card.style.borderTopColor = tubeInfo.color;
        
        // Duration badge
        const durationHtml = test.duration ? `
            <div class="test-duration">
                <i class="fas fa-clock"></i>
                <span>${test.duration}</span>
            </div>` : '';
        
        // Category name badge
        const categoryBadge = test.categoryName ? `
            <span class="test-category-name">${test.categoryName}</span>` : '';
        
        card.innerHTML = `
            <input type="checkbox" 
                   class="test-checkbox" 
                   id="test-${test.id}" 
                   ${isSelected ? 'checked' : ''}
                   data-test-id="${test.id}">
            <button class="test-info-btn" data-test-id="${test.id}" title="معلومات التحليل">
                <i class="fas fa-info-circle"></i>
            </button>
            <span class="test-category">فئة ${test.category}</span>
            ${categoryBadge}
            <h4 class="test-name">${test.name}</h4>
            <p class="test-short-name">${test.shortName}</p>
            <div class="test-tube" style="background: ${tubeInfo.bgColor}; border-color: ${tubeInfo.color}30;">
                <span class="tube-color-dot" style="background: ${tubeInfo.color};${tubeInfo.secondColor ? ' box-shadow: 3px 0 0 ' + tubeInfo.secondColor + ';' : ''}"></span>
                <span class="test-tube-type" style="color: ${tubeInfo.color}; font-weight: 700;">${test.tube}</span>
            </div>
            ${durationHtml}
            <div class="test-price">
                ${test.price.toLocaleString('ar-DZ')} <span class="test-price-label">دج</span>
            </div>
        `;
        
        card.addEventListener('click', (e) => {
            if (e.target.closest('.test-info-btn')) return;
            if (e.target.type !== 'checkbox') {
                const checkbox = card.querySelector('.test-checkbox');
                checkbox.checked = !checkbox.checked;
                toggleTestInCart(test);
            }
        });
        
        const checkbox = card.querySelector('.test-checkbox');
        checkbox.addEventListener('change', (e) => {
            e.stopPropagation();
            toggleTestInCart(test);
        });
        
        const infoBtn = card.querySelector('.test-info-btn');
        infoBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showTestInfo(test);
        });
        
        fragment.appendChild(card);
    });
    
    testsList.innerHTML = '';
    testsList.appendChild(fragment);
}

// ============ SEARCH (enhanced with abbreviation) ============
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    applyAllFilters(searchTerm);
}

function applyAllFilters(searchTerm) {
    if (searchTerm === undefined) {
        searchTerm = searchInput.value.toLowerCase().trim();
    }
    
    filteredTests = medicalTests.filter(test => {
        // Search matching - name, shortName (abbreviation), tube, category
        const matchesSearch = 
            test.name.toLowerCase().includes(searchTerm) ||
            test.shortName.toLowerCase().includes(searchTerm) ||
            test.tube.toLowerCase().includes(searchTerm) ||
            (test.categoryName && test.categoryName.toLowerCase().includes(searchTerm));
        
        // Category filter
        const matchesCategory = currentCategory === 'all' || test.category === currentCategory;
        
        // Tube filter
        const matchesTube = currentTubeFilter === 'all' || test.tube === currentTubeFilter;
        
        return matchesSearch && matchesCategory && matchesTube;
    });
    
    applySorting();
    renderTests();
}

// ============ FILTER ============
function handleFilter(e) {
    const category = e.target.dataset.category;
    currentCategory = category;
    
    filterBtns.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    applyAllFilters();
}

// ============ TUBE FILTER ============
function handleTubeFilter(e) {
    const tube = e.target.dataset.tube;
    currentTubeFilter = tube;
    
    tubeFilterBtns.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    applyAllFilters();
}

// ============ SORT ============
function handleSort(e) {
    currentSort = e.target.value;
    applySorting();
    renderTests();
}

function applySorting() {
    switch (currentSort) {
        case 'name-asc': filteredTests.sort((a, b) => a.name.localeCompare(b.name)); break;
        case 'name-desc': filteredTests.sort((a, b) => b.name.localeCompare(a.name)); break;
        case 'price-asc': filteredTests.sort((a, b) => a.price - b.price); break;
        case 'price-desc': filteredTests.sort((a, b) => b.price - a.price); break;
    }
}

// ============ CART OPERATIONS ============
function toggleTestInCart(test) {
    const index = cart.findIndex(item => item.id === test.id);
    
    if (index > -1) {
        cart.splice(index, 1);
        showToast(`تم إزالة: ${test.shortName}`, 'info');
    } else {
        cart.push(test);
        showToast(`تم إضافة: ${test.shortName}`, 'success');
    }
    
    saveCartToStorage();
    updateCart();
    renderTests();
}

function updateCart() {
    const renderCartItems = (container) => {
        if (!container) return;
        if (cart.length === 0) {
            container.innerHTML = '<p class="empty-cart"><i class="fas fa-cart-plus"></i>لم يتم اختيار أي تحليل بعد</p>';
            return;
        }
        
        container.innerHTML = '';
        cart.forEach(test => {
            const tubeInfo = getTubeColorInfo(test.tube);
            const item = document.createElement('div');
            item.className = 'cart-item';
            item.innerHTML = `
                <div class="cart-item-info">
                    <div class="cart-item-name">${test.name}</div>
                    <div class="cart-item-tube">
                        <span class="tube-color-dot-sm" style="background: ${tubeInfo.color};"></span>
                        ${test.tube}
                    </div>
                </div>
                <span class="cart-item-price">${test.price.toLocaleString('ar-DZ')} دج</span>
                <button class="cart-item-remove" data-test-id="${test.id}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            item.querySelector('.cart-item-remove').addEventListener('click', () => removeFromCart(test.id));
            container.appendChild(item);
        });
    };
    
    renderCartItems(cartItems);
    renderCartItems(cartItemsMobile);
    
    const total = cart.reduce((sum, test) => sum + test.price, 0);
    const totalText = total.toLocaleString('ar-DZ') + ' دج';
    const countText = cart.length;
    
    cartCount.textContent = countText;
    cartTotal.textContent = totalText;
    if (cartCountMobile) cartCountMobile.textContent = countText;
    if (cartTotalMobile) cartTotalMobile.textContent = totalText;
    
    // Floating badge
    if (cart.length > 0) {
        floatingCartBadge.style.display = 'flex';
        floatingCartBadge.textContent = cart.length;
    } else {
        floatingCartBadge.style.display = 'none';
    }
}

function removeFromCart(testId) {
    cart = cart.filter(test => test.id !== testId);
    saveCartToStorage();
    updateCart();
    renderTests();
}

function clearCart() {
    if (cart.length === 0) return;
    if (confirm('هل أنت متأكد من مسح جميع التحاليل المختارة؟')) {
        cart = [];
        saveCartToStorage();
        updateCart();
        renderTests();
        closeCartDrawer();
        showToast('تم مسح السلة', 'warning');
    }
}

// ============ WHATSAPP ============
function shareViaWhatsapp() {
    if (cart.length === 0) {
        showToast('الرجاء اختيار تحاليل أولاً', 'warning');
        return;
    }
    
    let message = '*🔬 RAED LAB - قائمة التحاليل المطلوبة*\n\n';
    
    cart.forEach((test, index) => {
        const tubeInfo = getTubeColorInfo(test.tube);
        message += `${index + 1}. ${test.name}\n`;
        message += `   🧪 الأنبوب: ${tubeInfo.icon} ${test.tube}\n`;
        message += `   💰 السعر: ${test.price.toLocaleString('ar-DZ')} دج\n\n`;
    });
    
    const total = cart.reduce((sum, test) => sum + test.price, 0);
    message += `━━━━━━━━━━━━━━━━━\n`;
    message += `*📋 عدد التحاليل:* ${cart.length}\n`;
    message += `*💵 المجموع الكلي:* ${total.toLocaleString('ar-DZ')} دج\n\n`;
    message += `📞 للحجز: 0 32 13 41 46 / 07 70 80 73 08\n`;
    message += `📍 العنوان: بجوار المنزل المالي، حي الرمال، الوادي`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
}

// ============ PRINT ============
function printCart() {
    if (cart.length === 0) {
        showToast('الرجاء اختيار تحاليل أولاً', 'warning');
        return;
    }
    
    const printWindow = window.open('', '_blank');
    const total = cart.reduce((sum, test) => sum + test.price, 0);
    
    const printContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>قائمة التحاليل - RAED LAB</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Tajawal',sans-serif; padding:30px; direction:rtl; color:#1F2937; }
        .header { text-align:center; border-bottom:3px solid #0D9488; padding-bottom:20px; margin-bottom:30px; }
        .header h1 { color:#0D9488; margin-bottom:8px; font-size:1.8rem; }
        .header p { color:#6B7280; margin:4px 0; font-size:0.9rem; }
        .date { text-align:left; color:#6B7280; margin-bottom:20px; font-size:0.85rem; }
        table { width:100%; border-collapse:collapse; margin-bottom:30px; }
        th, td { border:1px solid #E5E7EB; padding:12px; text-align:right; }
        th { background:#0D9488; color:white; font-weight:700; font-size:0.9rem; }
        tr:nth-child(even) { background:#F9FAFB; }
        td { font-size:0.88rem; }
        .tube-cell { font-weight:600; }
        .total-row { background:#F0FDFA !important; font-weight:800; font-size:1.05em; color:#0D9488; }
        .footer { margin-top:40px; padding-top:20px; border-top:2px solid #E5E7EB; text-align:center; color:#6B7280; }
        .footer p { margin:4px 0; font-size:0.9rem; }
        .tube-dot { display:inline-block; width:12px; height:12px; border-radius:50%; margin-left:6px; vertical-align:middle; }
        @media print { body { padding:10px; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔬 RAED LAB</h1>
        <p>مختبر التحاليل الطبية</p>
        <p>📍 بجوار المنزل المالي، حي الرمال، الوادي</p>
        <p>📞 0 32 13 41 46 / 07 70 80 73 08</p>
    </div>
    <div class="date">التاريخ: ${new Date().toLocaleDateString('ar-DZ', { year:'numeric', month:'long', day:'numeric' })}</div>
    <h2 style="margin-bottom:16px; color:#0D9488; font-size:1.3rem;">قائمة التحاليل المطلوبة</h2>
    <table>
        <thead>
            <tr>
                <th style="width:40px">#</th>
                <th>اسم التحليل</th>
                <th style="width:100px">الرمز</th>
                <th style="width:140px">نوع الأنبوب</th>
                <th style="width:90px">السعر (دج)</th>
            </tr>
        </thead>
        <tbody>
            ${cart.map((test, i) => {
                const tubeInfo = getTubeColorInfo(test.tube);
                return `
                <tr>
                    <td>${i+1}</td>
                    <td>${test.name}</td>
                    <td>${test.shortName}</td>
                    <td class="tube-cell"><span class="tube-dot" style="background:${tubeInfo.color};"></span> ${test.tube}</td>
                    <td>${test.price.toLocaleString('ar-DZ')}</td>
                </tr>
            `}).join('')}
            <tr class="total-row">
                <td colspan="4" style="text-align:left">المجموع الكلي</td>
                <td>${total.toLocaleString('ar-DZ')}</td>
            </tr>
        </tbody>
    </table>
    <div class="footer">
        <p><strong>عدد التحاليل: ${cart.length}</strong></p>
        <p>شكراً لاختياركم مختبر RAED LAB</p>
    </div>
    <script>window.onload=function(){window.print();};</script>
</body>
</html>`;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
}

// ============ LOCAL STORAGE ============
function saveCartToStorage() {
    localStorage.setItem('raedlab_cart', JSON.stringify(cart));
}

function loadCartFromStorage() {
    const saved = localStorage.getItem('raedlab_cart');
    if (saved) {
        try { cart = JSON.parse(saved); } catch (e) { cart = []; }
    }
}

// ============ TEST INFO MODAL ============
function showTestInfo(test) {
    const info = getTestInfo(test.shortName, test.name);
    const tubeInfo = getTubeColorInfo(test.tube);
    
    const modal = document.createElement('div');
    modal.className = 'test-info-modal';
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <button class="modal-close"><i class="fas fa-times"></i></button>
            <div class="modal-header">
                <i class="fas fa-flask"></i>
                <h3>${test.name}</h3>
                <span class="modal-short-name">${test.shortName}</span>
            </div>
            <div class="modal-body">
                <div class="info-row">
                    <div class="info-label"><i class="fas fa-tag"></i><span>نوع التحليل:</span></div>
                    <div class="info-value">${info.type}</div>
                </div>
                ${test.categoryName ? `
                <div class="info-row">
                    <div class="info-label"><i class="fas fa-layer-group"></i><span>الفئة:</span></div>
                    <div class="info-value">${test.categoryName}</div>
                </div>` : ''}
                <div class="info-row">
                    <div class="info-label"><i class="fas fa-file-alt"></i><span>الوصف:</span></div>
                    <div class="info-value">${info.description}</div>
                </div>
                <div class="info-row">
                    <div class="info-label"><i class="fas fa-vial"></i><span>نوع الأنبوب:</span></div>
                    <div class="info-value">
                        <span class="tube-badge-modal" style="background: ${tubeInfo.bgColor}; color: ${tubeInfo.color}; border: 1px solid ${tubeInfo.color}40; padding: 4px 12px; border-radius: 20px; font-weight: 700;">
                            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${tubeInfo.color};margin-left:6px;vertical-align:middle;"></span>
                            ${test.tube}
                        </span>
                    </div>
                </div>
                ${test.source ? `
                <div class="info-row">
                    <div class="info-label"><i class="fas fa-syringe"></i><span>نوع العينة:</span></div>
                    <div class="info-value">${test.source}</div>
                </div>` : ''}
                <div class="info-row">
                    <div class="info-label"><i class="fas fa-utensils"></i><span>التحضير:</span></div>
                    <div class="info-value">${info.preparation}</div>
                </div>
                <div class="info-row">
                    <div class="info-label"><i class="fas fa-clock"></i><span>المدة اللازمة:</span></div>
                    <div class="info-value">${test.duration || info.duration}</div>
                </div>
                <div class="info-row">
                    <div class="info-label"><i class="fas fa-chart-line"></i><span>القيم الطبيعية:</span></div>
                    <div class="info-value">${info.normalRange}</div>
                </div>
                <div class="info-row">
                    <div class="info-label"><i class="fas fa-coins"></i><span>السعر:</span></div>
                    <div class="info-value price-highlight">${test.price.toLocaleString('ar-DZ')} دج</div>
                </div>
                ${info.notes ? `
                <div class="info-notes">
                    <i class="fas fa-lightbulb"></i>
                    <span>${info.notes}</span>
                </div>` : ''}
            </div>
            <div class="modal-footer">
                <button class="btn-add-to-cart" data-test-id="${test.id}">
                    <i class="fas fa-cart-plus"></i> إضافة إلى السلة
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
    
    const closeModal = () => {
        modal.classList.remove('active');
        setTimeout(() => document.body.removeChild(modal), 300);
    };
    
    modal.querySelector('.modal-close').addEventListener('click', closeModal);
    modal.querySelector('.modal-overlay').addEventListener('click', closeModal);
    
    modal.querySelector('.btn-add-to-cart').addEventListener('click', () => {
        if (!cart.some(item => item.id === test.id)) {
            cart.push(test);
            saveCartToStorage();
            updateCart();
            renderTests();
            showToast(`تم إضافة: ${test.shortName}`, 'success');
        }
        closeModal();
    });
    
    const escHandler = (e) => {
        if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', escHandler); }
    };
    document.addEventListener('keydown', escHandler);
}
