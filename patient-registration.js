// RAED LAB - Modern Patient Registration

let selectedTests = [];
let allTests = [...medicalTests];

// DOM Elements
const patientForm = document.getElementById('patientForm');
const testsListSmall = document.getElementById('testsListSmall');
const testSearch = document.getElementById('testSearch');
const selectedTestsItems = document.getElementById('selectedTestsItems');
const selectedCount = document.getElementById('selectedCount');
const selectedTotal = document.getElementById('selectedTotal');
const savePatientBtn = document.getElementById('savePatientBtn');
const resetFormBtn = document.getElementById('resetFormBtn');

// Toast System
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: 'check-circle', error: 'exclamation-circle', info: 'info-circle', warning: 'exclamation-triangle' };
    toast.innerHTML = `<i class="fas fa-${icons[type]}"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Nav setup
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
const navOverlay = document.getElementById('navOverlay');
const header = document.getElementById('header');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
    navOverlay.classList.toggle('active');
    document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
});

navOverlay.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
    navOverlay.classList.remove('active');
    document.body.style.overflow = '';
});

window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 10);
});

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    setDefaultDate();
    renderTestsList();
    setupEventListeners();
    setupLiveValidation();
});

function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('registrationDate').value = today;
}

function setupEventListeners() {
    testSearch.addEventListener('input', handleTestSearch);
    savePatientBtn.addEventListener('click', savePatient);
    resetFormBtn.addEventListener('click', resetForm);
}

// ============ LIVE VALIDATION ============
function setupLiveValidation() {
    const nameInput = document.getElementById('patientName');
    const ageInput = document.getElementById('patientAge');
    const genderSelect = document.getElementById('patientGender');
    const phoneInput = document.getElementById('patientPhone');
    const branchSelect = document.getElementById('branchName');
    const dateInput = document.getElementById('registrationDate');

    nameInput.addEventListener('blur', () => {
        const valid = nameInput.value.trim().length >= 3;
        nameInput.classList.toggle('invalid', !valid);
        nameInput.classList.toggle('valid', valid);
    });

    nameInput.addEventListener('input', () => {
        if (nameInput.classList.contains('invalid') && nameInput.value.trim().length >= 3) {
            nameInput.classList.remove('invalid');
            nameInput.classList.add('valid');
        }
    });

    ageInput.addEventListener('blur', () => {
        const val = parseInt(ageInput.value);
        const valid = !isNaN(val) && val >= 0 && val <= 150;
        ageInput.classList.toggle('invalid', !valid);
        ageInput.classList.toggle('valid', valid);
    });

    phoneInput.addEventListener('input', () => {
        // Auto-format: remove non-digits
        let cleaned = phoneInput.value.replace(/[^\d]/g, '');
        if (cleaned.length > 10) cleaned = cleaned.substring(0, 10);
        phoneInput.value = cleaned;
        
        if (phoneInput.classList.contains('invalid') && cleaned.length >= 9 && cleaned.startsWith('0')) {
            phoneInput.classList.remove('invalid');
            phoneInput.classList.add('valid');
        }
    });

    phoneInput.addEventListener('blur', () => {
        const val = phoneInput.value.replace(/[^\d]/g, '');
        const valid = val.length >= 9 && val.length <= 10 && val.startsWith('0');
        phoneInput.classList.toggle('invalid', !valid);
        phoneInput.classList.toggle('valid', valid);
    });

    genderSelect.addEventListener('change', () => {
        const valid = genderSelect.value !== '';
        genderSelect.classList.toggle('invalid', !valid);
        genderSelect.classList.toggle('valid', valid);
    });

    branchSelect.addEventListener('change', () => {
        const valid = branchSelect.value !== '';
        branchSelect.classList.toggle('invalid', !valid);
        branchSelect.classList.toggle('valid', valid);
    });

    dateInput.addEventListener('change', () => {
        const valid = dateInput.value !== '';
        dateInput.classList.toggle('invalid', !valid);
        dateInput.classList.toggle('valid', valid);
    });
}

function validateForm() {
    let isValid = true;
    
    const nameInput = document.getElementById('patientName');
    const ageInput = document.getElementById('patientAge');
    const genderSelect = document.getElementById('patientGender');
    const phoneInput = document.getElementById('patientPhone');
    const branchSelect = document.getElementById('branchName');
    const dateInput = document.getElementById('registrationDate');

    if (nameInput.value.trim().length < 3) {
        nameInput.classList.add('invalid'); isValid = false;
    }
    
    const age = parseInt(ageInput.value);
    if (isNaN(age) || age < 0 || age > 150) {
        ageInput.classList.add('invalid'); isValid = false;
    }
    
    if (!genderSelect.value) {
        genderSelect.classList.add('invalid'); isValid = false;
    }
    
    const phone = phoneInput.value.replace(/[^\d]/g, '');
    if (phone.length < 9 || !phone.startsWith('0')) {
        phoneInput.classList.add('invalid'); isValid = false;
    }
    
    if (!branchSelect.value) {
        branchSelect.classList.add('invalid'); isValid = false;
    }
    
    if (!dateInput.value) {
        dateInput.classList.add('invalid'); isValid = false;
    }

    return isValid;
}

// ============ TESTS LIST ============
function renderTestsList(tests = allTests) {
    testsListSmall.innerHTML = '';
    
    const fragment = document.createDocumentFragment();
    tests.forEach(test => {
        const isSelected = selectedTests.some(t => t.id === test.id);
        
        const testItem = document.createElement('div');
        testItem.className = `test-item-small ${isSelected ? 'selected' : ''}`;
        testItem.innerHTML = `
            <div class="test-item-info">
                <input type="checkbox" class="test-checkbox-small" ${isSelected ? 'checked' : ''} data-test-id="${test.id}">
                <div class="test-item-details">
                    <strong>${test.name}</strong>
                    <span class="test-short-name">${test.shortName}</span>
                </div>
            </div>
            <div class="test-item-price">${test.price.toLocaleString('ar-DZ')} دج</div>
        `;
        
        const checkbox = testItem.querySelector('.test-checkbox-small');
        checkbox.addEventListener('change', () => toggleTest(test));
        
        testItem.addEventListener('click', (e) => {
            if (e.target.type !== 'checkbox') {
                checkbox.checked = !checkbox.checked;
                toggleTest(test);
            }
        });
        
        fragment.appendChild(testItem);
    });
    
    testsListSmall.appendChild(fragment);
}

function handleTestSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    const filtered = allTests.filter(test => 
        test.name.toLowerCase().includes(searchTerm) ||
        test.shortName.toLowerCase().includes(searchTerm)
    );
    renderTestsList(filtered);
}

function toggleTest(test) {
    const index = selectedTests.findIndex(t => t.id === test.id);
    if (index > -1) {
        selectedTests.splice(index, 1);
    } else {
        selectedTests.push(test);
    }
    updateSelectedTests();
    
    const searchTerm = testSearch.value.toLowerCase().trim();
    const filtered = allTests.filter(t => 
        t.name.toLowerCase().includes(searchTerm) ||
        t.shortName.toLowerCase().includes(searchTerm)
    );
    renderTestsList(filtered);
}

function updateSelectedTests() {
    if (selectedTests.length === 0) {
        selectedTestsItems.innerHTML = '<p class="empty-message">لم يتم اختيار أي تحليل بعد</p>';
        selectedCount.textContent = '0';
        selectedTotal.textContent = '0 دج';
        return;
    }
    
    selectedTestsItems.innerHTML = '';
    selectedTests.forEach(test => {
        const item = document.createElement('div');
        item.className = 'selected-test-item';
        item.innerHTML = `
            <div class="selected-test-info">
                <strong>${test.name}</strong>
                <span>${test.price.toLocaleString('ar-DZ')} دج</span>
            </div>
            <button class="remove-test-btn" data-test-id="${test.id}">
                <i class="fas fa-times"></i>
            </button>
        `;
        item.querySelector('.remove-test-btn').addEventListener('click', () => toggleTest(test));
        selectedTestsItems.appendChild(item);
    });
    
    const total = selectedTests.reduce((sum, test) => sum + test.price, 0);
    selectedCount.textContent = selectedTests.length;
    selectedTotal.textContent = total.toLocaleString('ar-DZ') + ' دج';
}

// ============ SAVE PATIENT ============
function savePatient() {
    if (!validateForm()) {
        showToast('يرجى ملء جميع الحقول المطلوبة بشكل صحيح', 'error');
        // Scroll to first invalid
        const firstInvalid = patientForm.querySelector('.invalid');
        if (firstInvalid) firstInvalid.focus();
        return;
    }
    
    if (selectedTests.length === 0) {
        showToast('يرجى اختيار تحليل واحد على الأقل', 'warning');
        return;
    }
    
    const formData = new FormData(patientForm);
    const patientData = {
        id: Date.now(),
        name: formData.get('patientName').trim(),
        age: formData.get('patientAge'),
        gender: formData.get('patientGender'),
        phone: formData.get('patientPhone'),
        branch: formData.get('branchName'),
        date: formData.get('registrationDate'),
        notes: formData.get('patientNotes'),
        tests: selectedTests.map(test => ({
            id: test.id,
            name: test.name,
            shortName: test.shortName,
            tube: test.tube,
            price: test.price
        })),
        totalTests: selectedTests.length,
        totalAmount: selectedTests.reduce((sum, test) => sum + test.price, 0),
        registeredAt: new Date().toISOString()
    };
    
    let patients = JSON.parse(localStorage.getItem('raedlab_patients') || '[]');
    patients.push(patientData);
    localStorage.setItem('raedlab_patients', JSON.stringify(patients));
    
    showToast(`تم حفظ بيانات "${patientData.name}" بنجاح! (${patientData.totalTests} تحليل)`, 'success');
    
    resetFormSilent();
    
    setTimeout(() => {
        if (confirm('هل تريد الانتقال إلى قائمة المرضى؟')) {
            window.location.href = 'patients-list.html';
        }
    }, 500);
}

// ============ RESET ============
function resetForm() {
    if (selectedTests.length > 0 || document.getElementById('patientName').value) {
        if (!confirm('هل أنت متأكد من إعادة تعيين النموذج؟')) return;
    }
    resetFormSilent();
    showToast('تم إعادة تعيين النموذج', 'info');
}

function resetFormSilent() {
    patientForm.reset();
    selectedTests = [];
    testSearch.value = '';
    setDefaultDate();
    updateSelectedTests();
    renderTestsList();
    
    // Clear validation states
    patientForm.querySelectorAll('.invalid, .valid').forEach(el => {
        el.classList.remove('invalid', 'valid');
    });
}

// Prevent form submit on Enter
patientForm.addEventListener('submit', (e) => e.preventDefault());
