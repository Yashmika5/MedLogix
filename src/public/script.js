// Global references for theme changer and navigation
const themeFab = document.getElementById('themeFab');
const themeMenu = document.getElementById('themeMenu');
const html = document.documentElement;
const themeOptions = document.querySelectorAll('.theme-option');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const navMenu = document.getElementById('navMenu');

const themes = ['light', 'dark', 'ocean', 'sunset', 'forest', 'purple'];

// Theme functions
function setTheme(theme) {
  themes.forEach(t => html.classList.remove(t));
  html.classList.add(theme);
  themeOptions.forEach(option => {
    option.classList.toggle('active', option.getAttribute('data-theme') === theme);
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
mobileMenuBtn.addEventListener('click', () => {
  navMenu.classList.toggle('active');
});

// Navigation buttons
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const section = btn.getAttribute('data-section');
    showSection(section);
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    navMenu.classList.remove('active');
  });
});

/// LISTS FORMATTING

function formatListToHTML(listText, itemPrefixRegex = /^\d+\.\s*/, isReminderList = false, highlightFirst = false) {
  if (!listText || listText.toLowerCase().includes('error')) {
    return '<p style="color: var(--muted);">No data available or error loading.</p>';
  }

  // Split lines and ignore the first header line
  const lines = listText.trim().split('\n');

  // For status responses, header line might differ per list. Remove first line if it contains counts or titles
  // Check if first line contains count or headers and remove it, else keep all lines
  if (lines.length > 1 && lines[0].match(/(categories|medicines|reminders|queue|history)/i)) {
    lines.shift();
  }

  if (lines.length === 0) {
    return `<p style="color: var(--muted);">No entries found.</p>`;
  }

  return lines.map((line, idx) => {
    // Remove prefix numbering "1. ", "2. ", etc.
    let content = line.replace(itemPrefixRegex, '').trim();

    // Optionally format reminders (time - medicine)
    if (isReminderList) {
      // Example: "08:00 - Vitamin D3"
      // Highlight first
      return `
        <div class="list-item ${highlightFirst && idx === 0 ? 'highlight' : ''}">
          <div style="font-weight: 600;">🔔 ${content}</div>
        </div>
      `;
    }

    // Default formatted list item with optional first highlight
    return `
      <div class="list-item ${highlightFirst && idx === 0 ? 'highlight' : ''}">
        <div style="font-weight: 600;">${content}</div>
      </div>
    `;
  }).join('');
}


function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(section => {
    section.classList.remove('active');
  });
  document.getElementById(sectionId).classList.add('active');

  if (sectionId === 'categories') updateCategoryList();
  else if (sectionId === 'medicines') updateMedicineList();
  else if (sectionId === 'stock') updateStockList();
  else if (sectionId === 'reminders') updateReminderList();
  else if (sectionId === 'queue') updateQueueList();
  else if (sectionId === 'undo') updateHistoryList();

  updateStatus();
}

// Search medicines by name
async function searchMedicine() {
  const name = document.getElementById('searchName').value.trim();
  
  if (!name) {
    showToast('Please enter a medicine name to search', 'error');
    return;
  }
  
  const result = await apiCall('/api/search_medicine', { name });
  const container = document.getElementById('medicineList');
  
  if (result.toLowerCase().includes('not found')) {
    container.innerHTML = `<p>No medicine named "<strong>${name}</strong>" found.</p>`;
  } else {
    container.innerHTML = `<pre>${result}</pre>`;
  }
}

// Reset search to show all medicines
async function resetSearch() {
  document.getElementById('searchName').value = '';
  await updateMedicineList();
  showToast('Search reset to show all medicines');
}

// Optional: trigger search on pressing Enter key inside input box
document.getElementById('searchName').addEventListener('keyup', function(event) {
  if (event.key === 'Enter') {
    searchMedicine();
  }
});



// Helper: API call
async function apiCall(endpoint, data = null) {
  try {
    const options = { method: data ? 'POST' : 'GET', headers: {} };
    if (data) {
      options.body = new URLSearchParams(data);
      options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }
    const response = await fetch(endpoint, options);
    return await response.text();
  } catch (error) {
    return `ERROR: ${error.message}`;
  }
}

// Toast notification
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => toast.classList.remove('show'), 3000);
}

async function updateStatus() {
  const statusText = await apiCall('/api/status');
  try {
    const lines = statusText.split('\n');
    let categories = 0, medicines = 0, reminders = 0, lowStock = 0;

    lines.forEach(line => {
      if (line.startsWith('Categories:')) {
        categories = parseInt(line.split(':')[1].trim()) || 0;
      } else if (line.startsWith('Medicines:')) {
        medicines = parseInt(line.split(':')[1].trim()) || 0;
      } else if (line.startsWith('Scheduled Reminders:')) {
        reminders = parseInt(line.split(':')[1].trim()) || 0;
      } else if (line.startsWith('Queued Reminders:')) {
        // Optionally include queued reminders count if suitable
      }
      // No low stock line given, so lowStock remains 0 here
    });

    document.getElementById('categoryCount').textContent = categories;
    document.getElementById('medicineCount').textContent = medicines;
    document.getElementById('reminderCount').textContent = reminders;
    document.getElementById('lowStockCount').textContent = lowStock;
  } catch {
    document.getElementById('categoryCount').textContent = '0';
    document.getElementById('medicineCount').textContent = '0';
    document.getElementById('reminderCount').textContent = '0';
    document.getElementById('lowStockCount').textContent = '0';
  }
}


// ------------ Category functions ------------

async function updateCategoryList() {
  const categoriesRaw = await apiCall('/api/categories');
  const list = document.getElementById('categoryList');

  if (!categoriesRaw || categoriesRaw.toLowerCase().includes('error')) {
    list.innerHTML = '<p style="color: var(--muted);">Error loading categories.</p>';
    return;
  }

  // Parse lines for categories numbered list
  const lines = categoriesRaw.trim().split('\n').filter(line => /^\d+\./.test(line));
  if (lines.length === 0) {
    list.innerHTML = '<p style="color: var(--muted);">No categories yet.</p>';
    return;
  }

  list.innerHTML = lines.map(line => {
    const category = line.replace(/^\d+\.\s*/, '').trim();
    return `
      <div class="list-item">
        <span>${line}</span>
        <button class="list-item-btn" onclick="removeCategory('${category}')">🗑️</button>
      </div>
    `;
  }).join('');

  updateCategoryDropdowns(categoriesRaw);
}

function updateCategoryDropdowns(categoryText) {
  const lines = categoryText.split('\n').filter(line => line.match(/^\d+\./))
                .map(line => line.replace(/^\d+\.\s*/, '').trim());
  ['medicineCategory', 'filterCategory'].forEach(id => {
    const select = document.getElementById(id);
    if (!select) return;
    const currentVal = select.value;
    select.innerHTML = '<option value="">Select category</option>' +
      lines.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    if(lines.includes(currentVal)) select.value = currentVal;
  });
}

async function addCategory() {
  const name = document.getElementById('categoryName').value.trim();
  if (!name) {
    showToast('Please enter a category name', 'error');
    return;
  }
  const result = await apiCall('/api/add_category', { category: name });
  showToast(result, result.includes('SUCCESS') ? 'success' : 'error');
  if (result.includes('SUCCESS')) {
    document.getElementById('categoryName').value = '';
    updateCategoryList();
    updateStatus();
  }
}

async function removeCategory(name) {
  if (!name) name = document.getElementById('categoryName').value.trim();
  if (!name) {
    showToast('Please enter the category name to remove', 'error');
    return;
  }
  const result = await apiCall('/api/remove_category', { category: name });
  showToast(result, result.includes('SUCCESS') ? 'success' : 'error');
  if (result.includes('SUCCESS')) {
    document.getElementById('categoryName').value = '';
    updateCategoryList();
    updateStatus();
  }
}

// ------------ Medicine functions ------------

async function updateMedicineList() {
  const medicinesRaw = await apiCall('/api/medicines');
  const list = document.getElementById('medicineList');

  if (!medicinesRaw || medicinesRaw.toLowerCase().includes('error')) {
    list.innerHTML = '<p style="color: var(--muted);">Error loading medicines.</p>';
    return;
  }

  // Parse medicines multiline
  const lines = medicinesRaw.trim().split('\n').filter(line => /^\d+\./.test(line));
  if (lines.length === 0) {
    list.innerHTML = '<p style="color: var(--muted);">No medicines found.</p>';
    return;
  }

  list.innerHTML = lines.map(line => {
    const data = line.replace(/^\d+\.\s*/, '').split('|').map(s => s.trim());
    const name = data[0] || '';
    const dose = data[1] ? data[1].replace('Dose: ', '') : '';
    const timings = data[2] ? data[2].replace('Timings: ', '') : '';
    const category = data[3] ? data[3].replace('Category: ', '') : '';

    return `
      <div class="list-item">
        <div class="list-item-content">
          <div style="font-weight: 600;">${name}</div>
          <div style="font-size: 0.75rem; color: var(--muted);">Dose: ${dose} | Timings: ${timings} | Category: ${category}</div>
        </div>
        <button class="list-item-btn" onclick="deleteMedicine('${name}')">🗑️</button>
      </div>
    `;
  }).join('');

  updateMedicineDropdowns(medicinesRaw);
}



function updateMedicineDropdowns(medicineText) {
  const lines = medicineText.split('\n').filter(line => line.trim() !== '' && !line.toLowerCase().startsWith('all medicines'));
  const names = lines.map(line => {
    let part = line.replace(/^\d+\.\s*/, '').trim();
    return part.split('|')[0].trim();
  });
  ['updateStockMedicine', 'decreaseStockMedicine', 'reminderMedicine'].forEach(id => {
    const select = document.getElementById(id);
    if (!select) return;
    const currentVal = select.value;
    select.innerHTML = '<option value="">Select Medicine</option>' +
      names.map(name => `<option value="${name}">${name}</option>`).join('');
    if (names.includes(currentVal)) select.value = currentVal;
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
  showToast(result, result.includes('SUCCESS') ? 'success' : 'error');
  if (result.includes('SUCCESS')) {
    document.getElementById('medicineName').value = '';
    document.getElementById('medicineDose').value = '';
    document.getElementById('medicineTimings').value = '';
    document.getElementById('medicineCategory').value = '';
    updateMedicineList();
    updateStatus();
  }
}

async function deleteMedicine(name) {
  if (!name) {
    showToast('Please select a medicine to delete', 'error');
    return;
  }
  const result = await apiCall('/api/delete_medicine', { name });
  showToast(result, result.includes('SUCCESS') ? 'success' : 'error');
  if (result.includes('SUCCESS')) {
    updateMedicineList();
    updateStatus();
  }
}

async function filterMedicines() {
  const category = document.getElementById('filterCategory').value;
  if (!category) {
    updateMedicineList();
    return;
  }
  const medicines = await apiCall('/api/medicines_by_category', { category });
  const list = document.getElementById('medicineList');
  list.textContent = medicines;
  updateMedicineDropdowns(medicines);
}

// ------------ Stock functions ------------

async function updateStockList() {
  const list = document.getElementById('stockList');
  const stockData = await apiCall('/api/stock_levels');

  if (!stockData || stockData.toLowerCase().includes('error')) {
    list.innerHTML = '<p style="color: var(--muted);">Error loading stock data.</p>';
    return;
  }

  const lines = stockData.trim().split('\n').slice(1); // skip header
  if (lines.length === 0) {
    list.innerHTML = '<p style="color: var(--muted);">No stock information available.</p>';
    return;
  }

  const LOW_STOCK_THRESHOLD = 15; // fixed value per your requirement

  const htmlItems = lines.map(line => {
    let cleaned = line.replace(/^\d+\.\s*/, '').trim();
    let [medPart, rest] = cleaned.split(' - ');
    if (!rest) return '';

    const stockMatch = rest.match(/Stock:\s*(\d+)/i);
    const thresholdMatch = rest.match(/Threshold:\s*(\d+)/i);
    if (!stockMatch || !thresholdMatch) return '';

    const quantity = parseInt(stockMatch[1], 10);
    // threshold still displayed but not used here
    const threshold = parseInt(thresholdMatch[1], 10);

    // Determine icon and bar color class based on fixed quantity threshold
    let icon = '📦';
    let barClass = 'success'; // default green

    if (quantity === 0) {
      icon = '❌';
      barClass = 'danger';
    } else if (quantity < LOW_STOCK_THRESHOLD) {
      icon = '⚠️';
      barClass = 'warning';
    }

    // Percentage bar relative to a max capacity (e.g., 100 or threshold) - choose fixed max for consistent bar scale
    const MAX_CAPACITY = 100;
    const percentage = Math.min(Math.max((quantity / MAX_CAPACITY) * 100, 0), 100);

    return `
      <div class="stock-item">
        <div class="stock-header">
          <span style="font-weight: 600;">${icon} ${medPart}</span>
          <span style="font-family: 'JetBrains Mono', monospace; font-size: 0.875rem;">
            ${quantity} units (Threshold shown as ${threshold})
          </span>
        </div>
        <div class="stock-bar">
          <div class="stock-bar-fill ${barClass}" style="width: ${percentage}%;"></div>
        </div>
      </div>
    `;
  });

  list.innerHTML = htmlItems.join('');
}


async function updateStock() {
  const medicine = document.getElementById('updateStockMedicine').value;
  const quantity = document.getElementById('updateStockQuantity').value;
  if (!medicine || !quantity) {
    showToast('Please fill all fields', 'error');
    return;
  }
  const result = await apiCall('/api/update_stock', { name: medicine, quantity });
  showToast(result, result.includes('SUCCESS') ? 'success' : 'error');
  if (result.includes('SUCCESS')) {
    document.getElementById('updateStockMedicine').value = '';
    document.getElementById('updateStockQuantity').value = '';
    updateStockList();
    updateStatus();
  }
}

async function decreaseStock() {
  const medicine = document.getElementById('decreaseStockMedicine').value;
  const amount = document.getElementById('decreaseStockAmount').value;
  if (!medicine || !amount) {
    showToast('Please fill all fields', 'error');
    return;
  }
  const result = await apiCall('/api/decrease_stock', { name: medicine, quantity: amount });
  showToast(result, result.includes('SUCCESS') ? 'success' : 'error');
  if (result.includes('SUCCESS')) {
    document.getElementById('decreaseStockMedicine').value = '';
    document.getElementById('decreaseStockAmount').value = '1';
    updateStockList();
    updateStatus();
  }
}

// ------------ Reminder functions ------------
function fixMojibake(text) {
  return text.replace(/â€¢/g, '•');
}


async function updateReminderList() {
  const remindersRaw = await apiCall('/api/reminders');
  const list = document.getElementById('reminderList');

  if (!remindersRaw || remindersRaw.toLowerCase().includes('error')) {
    list.innerHTML = '<p style="color: var(--muted);">Error loading reminders.</p>';
    return;
  }

  // Split lines and remove the header line which contains "Scheduled Reminders"
  const lines = remindersRaw.trim().split('\n');
  if (lines.length === 0) {
    list.innerHTML = '<p style="color: var(--muted);">No reminders scheduled.</p>';
    return;
  }

  // Remove first header line
  if (lines[0].toLowerCase().startsWith('scheduled reminders')) {
    lines.shift();
  }

  // Filter lines that start with "- "
  const reminderLines = lines.filter(line => line.trim().startsWith('- '));
  if (reminderLines.length === 0) {
    list.innerHTML = '<p style="color: var(--muted);">No reminders scheduled.</p>';
    return;
  }

  list.innerHTML = reminderLines.map((line, idx) => {
    // Remove leading '- ' and trim
    const content = line.replace(/^- /, '').trim();
    const parts = content.split(' - ');
    const time = parts[0] || '';
    const medicine = parts[1] || '';

    return `
      <div class="list-item ${idx === 0 ? 'highlight' : ''}">
        <div class="list-item-content">
          <div style="font-weight: 600;">🔔 ${medicine}</div>
          <div style="font-size: 0.75rem; color: var(--muted);">⏰ ${time}</div>
        </div>
        <button class="list-item-btn" onclick="deleteReminder('${medicine}', '${time}')">🗑️</button>
      </div>
    `;
  }).join('');
}


async function scheduleReminder() {
  const medicine = document.getElementById('reminderMedicine').value;
  const time = document.getElementById('reminderTime').value;
  if (!medicine || !time) {
    showToast('Please fill all fields', 'error');
    return;
  }
  const result = await apiCall('/api/schedule_reminder', { medicine, time });
  showToast(result, result.includes('SUCCESS') ? 'success' : 'error');
  if (result.includes('SUCCESS')) {
    document.getElementById('reminderMedicine').value = '';
    document.getElementById('reminderTime').value = '';
    updateReminderList();
    updateStatus();
  }
}

async function deleteReminder(medicine, time) {
  if (!medicine || !time) {
    showToast('Please provide medicine and time to delete reminder', 'error');
    return;
  }
  const result = await apiCall('/api/delete_reminder', { medicine, time });
  showToast(result, result.includes('SUCCESS') ? 'success' : 'error');
  if (result.includes('SUCCESS')) {
    updateReminderList();
    updateStatus();
  }
}

// ------------ Queue functions ------------

async function updateQueueList() {
  const queueRaw = await apiCall('/api/reminder_queue');
  const list = document.getElementById('queueList');

  if (!queueRaw || queueRaw.toLowerCase().includes('error')) {
    list.innerHTML = '<p style="color: var(--muted);">Error loading queue.</p>';
    return;
  }

  const lines = queueRaw.trim().split('\n').filter(line => /^\d+\./.test(line));
  if (lines.length === 0) {
    list.innerHTML = '<p style="color: var(--muted);">Queue is empty.</p>';
    return;
  }

  list.innerHTML = lines.map((line, idx) => {
    const content = line.replace(/^\d+\.\s*/, '').trim();
    const parts = content.split(' - ');
    const time = parts[0] || '';
    const medicine = parts[1] || '';

    return `
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
            ">
            ${idx + 1}
          </div>
          <div>
            <div style="font-weight: 600;">${medicine}</div>
            <!--<div style="font-size: 0.75rem; color: var(--muted);">⏰ ${time}</div>-->
          </div>
        </div>
        ${idx === 0 ? '<span style="color: var(--primary); font-weight: 600; font-size: 0.75rem;">NEXT</span>' : ''}
      </div>
    `;
  }).join('');
}

async function markTaken() {
  const result = await apiCall('/api/mark_taken');
  showToast(result, result.includes('SUCCESS') ? 'success' : 'error');
  updateQueueList();
  updateStatus();
}

// ------------ Undo functions ------------

async function updateHistoryList() {
  const historyRaw = await apiCall('/api/history');
  const list = document.getElementById('historyList');

  if (!historyRaw || historyRaw.toLowerCase().includes('error')) {
    list.innerHTML = '<p style="color: var(--muted);">Error loading history.</p>';
    return;
  }

  const lines = historyRaw.trim().split('\n').filter(line => /^\d+\./.test(line));
  if (lines.length === 0) {
    list.innerHTML = '<p style="color: var(--muted);">No history available.</p>';
    return;
  }

  list.innerHTML = lines.map((line, idx) => {
    const content = line.replace(/^\d+\.\s*/, '').trim();
    return `
      <div class="list-item ${idx === 0 ? 'highlight' : ''}">
        <div class="list-item-content">
          <div style="font-weight: 600;">${content}</div>
        </div>
        ${idx === 0 ? '<span style="color: var(--primary); font-weight: 600; font-size: 0.75rem;">LATEST</span>' : ''}
      </div>
    `;
  }).join('');
}

async function undoAction() {
  const result = await apiCall('/api/undo');
  showToast(result, result.includes('SUCCESS') ? 'success' : 'error');
  updateHistoryList();
  updateStatus();
}

// Initialization on window load
window.onload = () => {
  updateStatus();
  showSection('categories');
};
