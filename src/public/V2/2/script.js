// Theme system
const themeFab = document.getElementById('themeFab');
const themeMenu = document.getElementById('themeMenu');
const html = document.documentElement;
const themeOptions = document.querySelectorAll('.theme-option');

const themes = ['light', 'dark', 'ocean', 'sunset', 'forest', 'purple'];

function setTheme(theme) {
    themes.forEach(t => html.classList.remove(t));
    html.classList.add(theme);
    themeOptions.forEach(option => {
        if (option.getAttribute('data-theme') === theme) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
    localStorage.setItem('theme', theme);
}

themeFab.addEventListener('click', (e) => {
    e.stopPropagation();
    themeFab.classList.toggle('active');
    themeMenu.classList.toggle('active');
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('.theme-fab-container')) {
        themeFab.classList.remove('active');
        themeMenu.classList.remove('active');
    }
});

themeOptions.forEach(option => {
    option.addEventListener('click', () => {
        const theme = option.getAttribute('data-theme');
        setTheme(theme);
        themeFab.classList.remove('active');
        themeMenu.classList.remove('active');
        showToast(`Theme changed to ${theme.charAt(0).toUpperCase() + theme.slice(1)}`);
    });
});

const savedTheme = localStorage.getItem('theme') || 'dark';
setTheme(savedTheme);

// Mobile menu toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const navMenu = document.getElementById('navMenu');

mobileMenuBtn.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

// Navigation
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const section = btn.getAttribute('data-section');
        showSection(section);

        // Update active state
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Close mobile menu
        navMenu.classList.remove('active');
    });
});

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');

    if (sectionId === 'categories') loadCategories();
    if (sectionId === 'medicines') {
        loadCategories();
        listAllMedicines();
    }
    if (sectionId === 'stock') viewStockLevels();
    if (sectionId === 'reminders') viewReminders();
    if (sectionId === 'queue') viewQueue();
    if (sectionId === 'undo') viewHistory();

    updateStatus();
}

// Toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// API call helper
async function apiCall(endpoint, data = null) {
    try {
        const options = { method: data ? 'POST' : 'GET' };
        if (data) {
            options.body = new URLSearchParams(data);
            options.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
        }
        const response = await fetch(endpoint, options);
        return await response.text();
    } catch (error) {
        return 'ERROR: ' + error.message;
    }
}

// Update status panel
async function updateStatus() {
    const text = await apiCall('/api/status');
    try {
        const status = JSON.parse(text);
        document.getElementById('categoryCount').textContent = status.categoryCount || 0;
        document.getElementById('medicineCount').textContent = status.medicineCount || 0;
        document.getElementById('reminderCount').textContent = status.reminderCount || 0;
        document.getElementById('lowStockCount').textContent = status.lowStockCount || 0;
    } catch {
        console.warn('Failed to parse status JSON');
    }
}

// Category functions
async function loadCategories() {
    const text = await apiCall('/api/categories');
    let categories;
    try {
        categories = JSON.parse(text);
    } catch {
        categories = text.split('\n').filter(line => line.trim());
    }
    const list = document.getElementById('categoryList');
    if (!categories || categories.length === 0) {
        list.innerHTML = '<p style="color: var(--muted);">No categories yet. Add one above.</p>';
        updateCategoryDropdowns([]);
        return;
    }
    list.innerHTML = categories.map((cat, idx) => `
        <div class="list-item">
            <span>${idx + 1}. ${cat}</span>
            <button class="list-item-btn" onclick="removeCategory('${cat}')">🗑️</button>
        </div>
    `).join('');
    updateCategoryDropdowns(categories);
}

function updateCategoryDropdowns(categories) {
    const selects = ['medicineCategory', 'filterCategory'];
    selects.forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;
        const currentValue = select.value;
        select.innerHTML = '<option value="">Select category</option>' + categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
        if (categories.includes(currentValue)) {
            select.value = currentValue;
        }
    });
}

async function addCategory() {
    const name = document.getElementById('categoryName').value.trim();
    if (!name) {
        showToast('Please enter a category name', 'error');
        return;
    }
    const result = await apiCall('/api/add_category', { category: name });
    const isSuccess = result.includes('SUCCESS');
    showToast(isSuccess ? `Category "${name}" added` : result, isSuccess ? 'success' : 'error');
    if (isSuccess) {
        document.getElementById('categoryName').value = '';
        loadCategories();
        updateStatus();
    }
}

async function removeCategory(name) {
    if (!name) name = document.getElementById('categoryName').value.trim();
    if (!name) {
        showToast('Please enter a category name', 'error');
        return;
    }
    const result = await apiCall('/api/remove_category', { category: name });
    const isSuccess = result.includes('SUCCESS');
    showToast(isSuccess ? `Category "${name}" removed` : result, isSuccess ? 'success' : 'error');
    if (isSuccess) {
        document.getElementById('categoryName').value = '';
        loadCategories();
        updateStatus();
    }
}

// Medicine functions
async function updateMedicineList() {
    await listAllMedicines();
}

async function listAllMedicines() {
    const text = await apiCall('/api/medicines');
    let medicines;
    try {
        medicines = JSON.parse(text);
    } catch {
        medicines = [];
    }
    const list = document.getElementById('medicineList');
    if (!medicines || medicines.length === 0) {
        list.innerHTML = '<p style="color: var(--muted);">No medicines found.</p>';
        updateMedicineDropdowns([]);
        return;
    }
    list.innerHTML = medicines.map((med, idx) => `
        <div class="list-item">
            <div class="list-item-content">
                <div style="font-weight: 600;">${med.name}</div>
                <div style="font-size: 0.75rem; color: var(--muted);">
                    Dose: ${med.dose} | Timings: ${med.timings} | Category: ${med.category}
                </div>
            </div>
            <button class="list-item-btn" onclick="deleteMedicine('${med.name}')">🗑️</button>
        </div>
    `).join('');
    updateMedicineDropdowns(medicines.map(m => m.name));
}

function updateMedicineDropdowns(medicineNames) {
    const selects = ['updateStockMedicine', 'decreaseStockMedicine', 'reminderMedicine'];
    selects.forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;
        const currentValue = select.value;
        select.innerHTML = '<option value="">Select Medicine</option>' + medicineNames.map(name => `<option value="${name}">${name}</option>`).join('');
        if (medicineNames.includes(currentValue)) {
            select.value = currentValue;
        }
    });
}

async function addMedicine() {
    const name = document.getElementById('medicineName').value.trim();
    const dose = document.getElementById('medicineDose').value.trim();
    const timings = document.getElementById('medicineTimings').value.trim();
    const category = document.getElementById('medicineCategory').value;
    if (!name || !dose || !timings || !category) {
        showToast('Please fill all fields', 'error');
        return;
    }
    const result = await apiCall('/api/add_medicine', { name, dose, timings, category });
    const isSuccess = result.includes('SUCCESS');
    showToast(isSuccess ? `Medicine "${name}" added` : result, isSuccess ? 'success' : 'error');
    if (isSuccess) {
        document.getElementById('medicineName').value = '';
        document.getElementById('medicineDose').value = '';
        document.getElementById('medicineTimings').value = '';
        listAllMedicines();
        updateStatus();
    }
}

async function deleteMedicine(name) {
    if (!name) {
        showToast('Please provide a medicine name to delete', 'error');
        return;
    }
    const result = await apiCall('/api/delete_medicine', { name });
    const isSuccess = result.includes('SUCCESS');
    showToast(isSuccess ? `Medicine "${name}" deleted` : result, isSuccess ? 'success' : 'error');
    if (isSuccess) {
        listAllMedicines();
        updateStatus();
    }
}

function filterMedicines() {
    // Simplified: re-fetch medicines
    updateMedicineList();
}

// Stock functions
async function updateStockList() {
    const text = await apiCall('/api/stock_levels');
    let stockLevels;
    try {
        stockLevels = JSON.parse(text);
    } catch {
        stockLevels = [];
    }
    const list = document.getElementById('stockList');
    if (!stockLevels || stockLevels.length === 0) {
        list.innerHTML = '<p style="color: var(--muted);">No stock information available.</p>';
        return;
    }
    list.innerHTML = stockLevels.map(item => {
        const percentage = Math.min((item.quantity / (item.threshold * 2)) * 100, 100);
        const isLow = item.quantity <= item.threshold;
        return `
            <div class="stock-item">
                <div class="stock-header">
                    <span style="font-weight: 600;">${isLow ? '⚠️' : '📦'} ${item.medicine}</span>
                    <span style="font-family: 'JetBrains Mono', monospace; font-size: 0.875rem;">
                        ${item.quantity} / ${item.threshold} threshold
                    </span>
                </div>
                <div class="stock-bar">
                    <div class="stock-bar-fill ${isLow ? 'warning' : ''}" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }).join('');

    const alerts = await apiCall('/api/low_stock_alerts');
    if (!alerts.includes('adequate stock')) {
        showToast('⚠️ Low Stock Alert: Some medicines are running low!', 'error');
    }
}

async function updateStock() {
    const medicine = document.getElementById('updateStockMedicine').value;
    const quantity = parseInt(document.getElementById('updateStockQuantity').value);
    if (!medicine || isNaN(quantity)) {
        showToast('Please fill all fields', 'error');
        return;
    }
    const result = await apiCall('/api/update_stock', { name: medicine, quantity });
    const isSuccess = result.includes('SUCCESS');
    showToast(isSuccess ? `Stock updated for "${medicine}"` : result, isSuccess ? 'success' : 'error');
    if (isSuccess) {
        document.getElementById('updateStockMedicine').value = '';
        document.getElementById('updateStockQuantity').value = '';
        updateStockList();
        updateStatus();
    }
}

async function decreaseStock() {
    const medicine = document.getElementById('decreaseStockMedicine').value;
    const amount = parseInt(document.getElementById('decreaseStockAmount').value);
    if (!medicine || isNaN(amount)) {
        showToast('Please fill all fields', 'error');
        return;
    }
    const result = await apiCall('/api/decrease_stock', { name: medicine, quantity: amount });
    const isSuccess = result.includes('SUCCESS');
    showToast(isSuccess ? `Stock decreased for "${medicine}"` : result, isSuccess ? 'success' : 'error');
    if (isSuccess) {
        document.getElementById('decreaseStockMedicine').value = '';
        document.getElementById('decreaseStockAmount').value = '1';
        updateStockList();
        updateStatus();
    }
}

// Reminder functions
async function updateReminderList() {
    await viewReminders();
}

async function viewReminders() {
    const response = await apiCall('/api/reminders');
    const list = document.getElementById('reminderList');
    let reminders;
    try {
        reminders = JSON.parse(response);
    } catch {
        reminders = [];
    }
    if (!reminders.length) {
        list.innerHTML = '<p style="color: var(--muted);">No reminders scheduled.</p>';
        return;
    }
    reminders.sort((a,b) => a.time.localeCompare(b.time));
    list.innerHTML = reminders.map((r, idx) => `
        <div class="list-item ${idx === 0 ? 'highlight' : ''}">
            <div class="list-item-content">
                <div style="font-weight: 600;">🔔 ${r.medicine}</div>
                <div style="font-size: 0.75rem; color: var(--muted);">⏰ ${r.time}</div>
            </div>
            <button class="list-item-btn" onclick="deleteReminder('${r.medicine}', '${r.time}')">🗑️</button>
        </div>
    `).join('');
}

async function scheduleReminder() {
    const medicine = document.getElementById('reminderMedicine').value;
    const time = document.getElementById('reminderTime').value;
    if (!medicine || !time) {
        showToast('Please fill all fields', 'error');
        return;
    }
    const result = await apiCall('/api/schedule_reminder', { medicine, time });
    const isSuccess = result.includes('SUCCESS');
    showToast(isSuccess ? `Reminder scheduled for "${medicine}"` : result, isSuccess ? 'success' : 'error');
    if (isSuccess) {
        document.getElementById('reminderMedicine').value = '';
        document.getElementById('reminderTime').value = '';
        viewReminders();
        updateStatus();
    }
}

async function deleteReminder(medicine, time) {
    if (!medicine || !time) {
        showToast('Please enter medicine name and time', 'error');
        return;
    }
    const result = await apiCall('/api/delete_reminder', { medicine, time });
    const isSuccess = result.includes('SUCCESS');
    showToast(isSuccess ? 'Reminder deleted' : result, isSuccess ? 'success' : 'error');
    if (isSuccess) {
        viewReminders();
        updateStatus();
    }
}

// Queue functions
async function updateQueueList() {
    await viewQueue();
}

async function viewQueue() {
    const response = await apiCall('/api/reminder_queue');
    const list = document.getElementById('queueList');
    let queue;
    try {
        queue = JSON.parse(response);
    } catch {
        queue = [];
    }
    if (!queue.length) {
        list.innerHTML = '<p style="color: var(--muted);">Queue is empty.</p>';
        return;
    }
    list.innerHTML = queue.map((item, idx) => `
        <div class="list-item ${idx === 0 ? 'highlight' : ''}">
            <div style="display: flex; align-items: center; gap: 1rem;">
                <div style="
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: ${idx === 0 ? 'var(--primary)' : 'var(--secondary)'};
                    color: ${idx === 0 ? 'var(--primary-foreground)' : 'var(--muted)'};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                ">${idx + 1}</div>
                <div>
                    <div style="font-weight: 600;">${item.medicine}</div>
                    <div style="font-size: 0.75rem; color: var(--muted);">⏰ ${item.time}</div>
                </div>
            </div>
            ${idx === 0 ? '<span style="color: var(--primary); font-weight: 600; font-size: 0.75rem;">NEXT</span>' : ''}
        </div>
    `).join('');
}

async function markTaken() {
    const result = await apiCall('/api/mark_taken');
    const isSuccess = result.includes('SUCCESS');
    showToast(isSuccess ? 'Marked medicine as taken' : result, isSuccess ? 'success' : 'error');
    if (isSuccess) {
        viewQueue();
        updateStatus();
    }
}

// Undo functions
async function updateHistoryList() {
    await viewHistory();
}

async function viewHistory() {
    const response = await apiCall('/api/history');
    const list = document.getElementById('historyList');
    let historyArr;
    try {
        historyArr = JSON.parse(response);
    } catch {
        historyArr = [];
    }
    if (!historyArr.length) {
        list.innerHTML = '<p style="color: var(--muted);">No history available.</p>';
        return;
    }
    list.innerHTML = historyArr.map((item, idx) => `
        <div class="list-item ${idx === 0 ? 'highlight' : ''}">
            <div class="list-item-content">
                <div style="font-weight: 600;">${item.action}</div>
                <div style="font-size: 0.75rem; color: var(--muted);">${item.timestamp}</div>
            </div>
            ${idx === 0 ? '<span style="color: var(--primary); font-weight: 600; font-size: 0.75rem;">LATEST</span>' : ''}
        </div>
    `).join('');
}

async function undoAction() {
    const result = await apiCall('/api/undo');
    const isSuccess = result.includes('SUCCESS');
    showToast(isSuccess ? 'Undone last action' : result, isSuccess ? 'success' : 'error');
    if (isSuccess) {
        viewHistory();
        updateStatus();
    }
}

// Load medicines into dropdowns
async function loadMedicineDropdowns() {
    const text = await apiCall('/api/medicines');
    let medicines;
    try {
        medicines = JSON.parse(text);
    } catch {
        medicines = [];
    }
    const medicineNames = medicines.map(m => m.name);
    [
        'updateStockMedicine',
        'decreaseStockMedicine',
        'reminderMedicine',
        'deleteReminderMedicine',
        'searchName'
    ].forEach(id => {
        const dropdown = document.getElementById(id);
        if (!dropdown) return;
        const currentValue = dropdown.value;
        dropdown.innerHTML = '<option value="">Select Medicine</option>' + medicineNames.map(name => `<option value="${name}">${name}</option>`).join('');
        if (medicineNames.includes(currentValue)) dropdown.value = currentValue;
    });
}

// Initialize
updateStatus();
loadCategories();
listAllMedicines();
