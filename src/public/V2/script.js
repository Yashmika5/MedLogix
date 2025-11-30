// Global state
let categories = ['Antibiotics', 'Pain Relief', 'Vitamins'];
let medicines = [
    { name: 'Amoxicillin', dose: '500mg', timings: 'Morning, Evening', category: 'Antibiotics' },
    { name: 'Ibuprofen', dose: '200mg', timings: 'After meals', category: 'Pain Relief' },
    { name: 'Vitamin D3', dose: '1000 IU', timings: 'Morning', category: 'Vitamins' }
];
let stockLevels = [
    { medicine: 'Amoxicillin', quantity: 15, threshold: 10 },
    { medicine: 'Ibuprofen', quantity: 5, threshold: 10 },
    { medicine: 'Vitamin D3', quantity: 25, threshold: 15 }
];
let reminders = [
    { medicine: 'Amoxicillin', time: '09:00' },
    { medicine: 'Ibuprofen', time: '14:00' },
    { medicine: 'Vitamin D3', time: '08:00' }
];
let queue = [
    { medicine: 'Vitamin D3', time: '08:00' },
    { medicine: 'Amoxicillin', time: '09:00' },
    { medicine: 'Ibuprofen', time: '14:00' }
];
let history = [
    { action: 'Added medicine: Amoxicillin', timestamp: new Date().toLocaleString() },
    { action: 'Updated stock: Ibuprofen (15 units)', timestamp: new Date(Date.now() - 60000).toLocaleString() }
];

// Theme system
const themeFab = document.getElementById('themeFab');
const themeMenu = document.getElementById('themeMenu');
const html = document.documentElement;
const themeOptions = document.querySelectorAll('.theme-option');

const themes = ['light', 'dark', 'ocean', 'sunset', 'forest', 'purple'];

function setTheme(theme) {
    // Remove all theme classes
    themes.forEach(t => html.classList.remove(t));
    
    // Add selected theme class
    html.classList.add(theme);
    
    // Update active state in menu
    themeOptions.forEach(option => {
        if (option.getAttribute('data-theme') === theme) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
}

// Toggle theme menu
themeFab.addEventListener('click', (e) => {
    e.stopPropagation();
    themeFab.classList.toggle('active');
    themeMenu.classList.toggle('active');
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.theme-fab-container')) {
        themeFab.classList.remove('active');
        themeMenu.classList.remove('active');
    }
});

// Theme option selection
themeOptions.forEach(option => {
    option.addEventListener('click', () => {
        const theme = option.getAttribute('data-theme');
        setTheme(theme);
        themeFab.classList.remove('active');
        themeMenu.classList.remove('active');
        showToast(`Theme changed to ${theme.charAt(0).toUpperCase() + theme.slice(1)}`);
    });
});

// Load saved theme
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
    
    // Update content
    if (sectionId === 'categories') updateCategoryList();
    if (sectionId === 'medicines') updateMedicineList();
    if (sectionId === 'stock') updateStockList();
    if (sectionId === 'reminders') updateReminderList();
    if (sectionId === 'queue') updateQueueList();
    if (sectionId === 'undo') updateHistoryList();
    
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

// Add to history
function addToHistory(action) {
    history.unshift({ action, timestamp: new Date().toLocaleString() });
    updateStatus();
}

// Update status panel
function updateStatus() {
    document.getElementById('categoryCount').textContent = categories.length;
    document.getElementById('medicineCount').textContent = medicines.length;
    document.getElementById('reminderCount').textContent = reminders.length;
    
    const lowStockCount = stockLevels.filter(s => s.quantity <= s.threshold).length;
    document.getElementById('lowStockCount').textContent = lowStockCount;
}

// Category functions
function updateCategoryList() {
    const list = document.getElementById('categoryList');
    if (categories.length === 0) {
        list.innerHTML = '<p style="color: var(--muted);">No categories yet. Add one above.</p>';
        return;
    }
    
    list.innerHTML = categories.map((cat, idx) => `
        <div class="list-item">
            <span>${idx + 1}. ${cat}</span>
            <button class="list-item-btn" onclick="removeCategory('${cat}')">🗑️</button>
        </div>
    `).join('');
    
    // Update dropdowns
    updateCategoryDropdowns();
}

function updateCategoryDropdowns() {
    const selects = ['medicineCategory', 'filterCategory'];
    selects.forEach(id => {
        const select = document.getElementById(id);
        const currentValue = select.value;
        select.innerHTML = '<option value="">Select category</option>' + 
            categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
        if (categories.includes(currentValue)) {
            select.value = currentValue;
        }
    });
}

function addCategory() {
    const name = document.getElementById('categoryName').value.trim();
    if (!name) {
        showToast('Please enter a category name', 'error');
        return;
    }
    
    if (categories.includes(name)) {
        showToast('Category already exists', 'error');
        return;
    }
    
    categories.push(name);
    document.getElementById('categoryName').value = '';
    updateCategoryList();
    addToHistory(`Added category: ${name}`);
    showToast(`Category "${name}" added`);
}

function removeCategory(name) {
    if (!name) {
        name = document.getElementById('categoryName').value.trim();
    }
    
    if (!name) {
        showToast('Please enter a category name', 'error');
        return;
    }
    
    categories = categories.filter(c => c !== name);
    document.getElementById('categoryName').value = '';
    updateCategoryList();
    addToHistory(`Removed category: ${name}`);
    showToast(`Category "${name}" removed`);
}

// Medicine functions
function updateMedicineList() {
    const list = document.getElementById('medicineList');
    const searchTerm = document.getElementById('searchName').value.toLowerCase();
    const filterCat = document.getElementById('filterCategory').value;
    
    let filtered = medicines.filter(med => {
        const matchesSearch = !searchTerm || med.name.toLowerCase().includes(searchTerm);
        const matchesCategory = !filterCat || med.category === filterCat;
        return matchesSearch && matchesCategory;
    });
    
    if (filtered.length === 0) {
        list.innerHTML = '<p style="color: var(--muted);">No medicines found.</p>';
        return;
    }
    
    list.innerHTML = filtered.map((med, idx) => `
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
    
    updateMedicineDropdowns();
}

function updateMedicineDropdowns() {
    const medicineNames = medicines.map(m => m.name);
    const selects = ['updateStockMedicine', 'decreaseStockMedicine', 'reminderMedicine'];
    
    selects.forEach(id => {
        const select = document.getElementById(id);
        const currentValue = select.value;
        select.innerHTML = '<option value="">Select Medicine</option>' +
            medicineNames.map(name => `<option value="${name}">${name}</option>`).join('');
        if (medicineNames.includes(currentValue)) {
            select.value = currentValue;
        }
    });
}

function addMedicine() {
    const name = document.getElementById('medicineName').value.trim();
    const dose = document.getElementById('medicineDose').value.trim();
    const timings = document.getElementById('medicineTimings').value.trim();
    const category = document.getElementById('medicineCategory').value;
    
    if (!name || !dose || !timings || !category) {
        showToast('Please fill all fields', 'error');
        return;
    }
    
    medicines.push({ name, dose, timings, category });
    stockLevels.push({ medicine: name, quantity: 0, threshold: 10 });
    
    document.getElementById('medicineName').value = '';
    document.getElementById('medicineDose').value = '';
    document.getElementById('medicineTimings').value = '';
    document.getElementById('medicineCategory').value = '';
    
    updateMedicineList();
    addToHistory(`Added medicine: ${name}`);
    showToast(`Medicine "${name}" added`);
}

function deleteMedicine(name) {
    medicines = medicines.filter(m => m.name !== name);
    stockLevels = stockLevels.filter(s => s.medicine !== name);
    updateMedicineList();
    addToHistory(`Deleted medicine: ${name}`);
    showToast(`Medicine "${name}" deleted`);
}

function filterMedicines() {
    updateMedicineList();
}

// Stock functions
function updateStockList() {
    const list = document.getElementById('stockList');
    
    if (stockLevels.length === 0) {
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
}

function updateStock() {
    const medicine = document.getElementById('updateStockMedicine').value;
    const quantity = parseInt(document.getElementById('updateStockQuantity').value);
    
    if (!medicine || isNaN(quantity)) {
        showToast('Please fill all fields', 'error');
        return;
    }
    
    const stock = stockLevels.find(s => s.medicine === medicine);
    if (stock) {
        stock.quantity = quantity;
        document.getElementById('updateStockMedicine').value = '';
        document.getElementById('updateStockQuantity').value = '';
        updateStockList();
        addToHistory(`Updated stock: ${medicine} (${quantity} units)`);
        showToast(`Stock updated for "${medicine}"`);
        updateStatus();
    }
}

function decreaseStock() {
    const medicine = document.getElementById('decreaseStockMedicine').value;
    const amount = parseInt(document.getElementById('decreaseStockAmount').value);
    
    if (!medicine || isNaN(amount)) {
        showToast('Please fill all fields', 'error');
        return;
    }
    
    const stock = stockLevels.find(s => s.medicine === medicine);
    if (stock) {
        stock.quantity = Math.max(0, stock.quantity - amount);
        document.getElementById('decreaseStockMedicine').value = '';
        document.getElementById('decreaseStockAmount').value = '1';
        updateStockList();
        addToHistory(`Decreased stock: ${medicine} (-${amount} units)`);
        showToast(`Stock decreased for "${medicine}"`);
        updateStatus();
    }
}

// Reminder functions
function updateReminderList() {
    const list = document.getElementById('reminderList');
    const sorted = [...reminders].sort((a, b) => a.time.localeCompare(b.time));
    
    if (sorted.length === 0) {
        list.innerHTML = '<p style="color: var(--muted);">No reminders scheduled.</p>';
        return;
    }
    
    list.innerHTML = sorted.map((r, idx) => `
        <div class="list-item ${idx === 0 ? 'highlight' : ''}">
            <div class="list-item-content">
                <div style="font-weight: 600;">🔔 ${r.medicine}</div>
                <div style="font-size: 0.75rem; color: var(--muted);">⏰ ${r.time}</div>
            </div>
            <button class="list-item-btn" onclick="deleteReminder('${r.medicine}', '${r.time}')">🗑️</button>
        </div>
    `).join('');
}

function scheduleReminder() {
    const medicine = document.getElementById('reminderMedicine').value;
    const time = document.getElementById('reminderTime').value;
    
    if (!medicine || !time) {
        showToast('Please fill all fields', 'error');
        return;
    }
    
    reminders.push({ medicine, time });
    queue.push({ medicine, time });
    queue.sort((a, b) => a.time.localeCompare(b.time));
    
    document.getElementById('reminderMedicine').value = '';
    document.getElementById('reminderTime').value = '';
    
    updateReminderList();
    addToHistory(`Scheduled reminder: ${medicine} at ${time}`);
    showToast(`Reminder scheduled for "${medicine}"`);
    updateStatus();
}

function deleteReminder(medicine, time) {
    reminders = reminders.filter(r => !(r.medicine === medicine && r.time === time));
    queue = queue.filter(r => !(r.medicine === medicine && r.time === time));
    updateReminderList();
    addToHistory(`Deleted reminder: ${medicine} at ${time}`);
    showToast('Reminder deleted');
    updateStatus();
}

// Queue functions
function updateQueueList() {
    const list = document.getElementById('queueList');
    
    if (queue.length === 0) {
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

function markTaken() {
    if (queue.length === 0) {
        showToast('Queue is empty', 'error');
        return;
    }
    
    const taken = queue.shift();
    updateQueueList();
    addToHistory(`Marked as taken: ${taken.medicine}`);
    showToast(`Marked "${taken.medicine}" as taken`);
}

// Undo functions
function updateHistoryList() {
    const list = document.getElementById('historyList');
    
    if (history.length === 0) {
        list.innerHTML = '<p style="color: var(--muted);">No history available.</p>';
        return;
    }
    
    list.innerHTML = history.map((item, idx) => `
        <div class="list-item ${idx === 0 ? 'highlight' : ''}">
            <div class="list-item-content">
                <div style="font-weight: 600;">${item.action}</div>
                <div style="font-size: 0.75rem; color: var(--muted);">${item.timestamp}</div>
            </div>
            ${idx === 0 ? '<span style="color: var(--primary); font-weight: 600; font-size: 0.75rem;">LATEST</span>' : ''}
        </div>
    `).join('');
}

function undoAction() {
    if (history.length === 0) {
        showToast('No actions to undo', 'error');
        return;
    }
    
    const undone = history.shift();
    updateHistoryList();
    showToast(`Undone: ${undone.action}`);
}

// Initialize
updateStatus();
updateCategoryList();
updateMedicineList();
