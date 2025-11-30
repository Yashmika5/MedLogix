// Show/hide sections
function showSection(sectionId) {
  const sections = document.querySelectorAll('.section');
  sections.forEach(section => {
    section.style.display = 'none';
  });
  document.getElementById(sectionId).style.display = 'block';

  if (sectionId === 'categories') {
    loadCategories();
  } else if (sectionId === 'medicines') {
    loadCategories();
    listAllMedicines();
  } else if (sectionId === 'stock' || sectionId === 'reminders' || sectionId === 'undo') {
    loadMedicineDropdowns();
    if (sectionId === 'stock') viewStockLevels();
    if (sectionId === 'reminders') viewReminders();
    if (sectionId === 'undo') viewHistory();
  } else if (sectionId === 'queue') {
    viewQueue();
  }
}

// Show output message
function showOutput(message, type = 'success') {
  const output = document.getElementById('output');
  output.textContent = message;
  output.className = `output-box ${type}`;
  output.style.display = 'block';

  setTimeout(() => {
    output.style.display = 'none';
  }, 5000);
}

// API call helper
async function apiCall(endpoint, data = null) {
  try {
    const options = {
      method: data ? 'POST' : 'GET',
    };

    if (data) {
      const formData = new URLSearchParams(data);
      options.body = formData;
      options.headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
      };
    }

    const response = await fetch(endpoint, options);
    const text = await response.text();
    return text;
  } catch (error) {
    return 'ERROR: ' + error.message;
  }
}

// Update system status
async function updateStatus() {
  const status = await apiCall('/api/status');
  document.getElementById('systemStatus').textContent = status;
}

// Category functions
async function loadCategories() {
  const categories = await apiCall('/api/categories');
  document.getElementById('categoryList').textContent = categories;

  // Update category dropdowns
  const categoryLines = categories.split('\n');
  const categoryOptions = categoryLines
    .filter(line => line.match(/^\d+\./))
    .map(line => line.replace(/^\d+\.\s*/, '').trim());

  const selects = [
    document.getElementById('medicineCategory'),
    document.getElementById('filterCategory'),
    document.getElementById('stockMedicineCategory'),
  ];

  selects.forEach(select => {
    if (select) {
      select.innerHTML = '<option value="">Select category</option>';
      categoryOptions.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        select.appendChild(option);
      });
    }
  });
}

async function addCategory() {
  const category = document.getElementById('categoryName').value.trim();
  if (!category) {
    showOutput('Please enter a category name', 'error');
    return;
  }

  const result = await apiCall('/api/add_category', { category });
  showOutput(result, result.includes('SUCCESS') ? 'success' : 'error');

  if (result.includes('SUCCESS')) {
    document.getElementById('categoryName').value = '';
    loadCategories();
    updateStatus();
  }
}

async function removeCategory() {
  const category = document.getElementById('categoryName').value.trim();
  if (!category) {
    showOutput('Please enter a category name to remove', 'error');
    return;
  }

  const result = await apiCall('/api/remove_category', { category });
  showOutput(result, result.includes('SUCCESS') ? 'success' : 'error');

  if (result.includes('SUCCESS')) {
    document.getElementById('categoryName').value = '';
    loadCategories();
    updateStatus();
  }
}

// Medicine functions

async function addMedicine() {
  const name = document.getElementById('medicineName').value.trim();
  const dose = document.getElementById('medicineDose').value.trim();
  const timings = document.getElementById('medicineTimings').value.trim();
  const category = document.getElementById('medicineCategory').value;

  if (!name || !dose || !timings || !category) {
    showOutput('Please fill in all fields', 'error');
    return;
  }

  const result = await apiCall('/api/add_medicine', { name, dose, timings, category });
  showOutput(result, result.includes('SUCCESS') ? 'success' : 'error');

  if (result.includes('SUCCESS')) {
    document.getElementById('medicineName').value = '';
    document.getElementById('medicineDose').value = '';
    document.getElementById('medicineTimings').value = '';
    listAllMedicines();
    updateStatus();
  }
}

async function deleteMedicine() {
  const name = document.getElementById('searchNameDropdown').value;
  if (!name) {
    showOutput('Please select a medicine to delete', 'error');
    return;
  }

  const result = await apiCall('/api/delete_medicine', { name });
  showOutput(result, result.includes('SUCCESS') ? 'success' : 'error');

  if (result.includes('SUCCESS')) {
    document.getElementById('searchNameDropdown').value = '';
    listAllMedicines();
    updateStatus();
  }
}

async function searchMedicine() {
  const name = document.getElementById('searchNameDropdown').value;
  if (!name) {
    showOutput('Please select a medicine to search', 'error');
    return;
  }

  const result = await apiCall('/api/search_medicine', { name });
  document.getElementById('medicineList').textContent = result;
}

async function listAllMedicines() {
  const medicines = await apiCall('/api/medicines');
  document.getElementById('medicineList').textContent = medicines;
}

async function filterByCategory() {
  const category = document.getElementById('filterCategory').value;
  if (!category) {
    showOutput('Please select a category', 'error');
    return;
  }

  const medicines = await apiCall('/api/medicines_by_category', { category });
  document.getElementById('medicineList').textContent = medicines;
}

// Reminder functions

async function scheduleReminder() {
  const medicine = document.getElementById('reminderMedicineDropdown').value;
  const time = document.getElementById('reminderTime').value;

  if (!medicine || !time) {
    showOutput('Please enter medicine name and time', 'error');
    return;
  }

  const result = await apiCall('/api/schedule_reminder', { medicine, time });
  showOutput(result, result.includes('SUCCESS') ? 'success' : 'error');

  if (result.includes('SUCCESS')) {
    document.getElementById('reminderMedicineDropdown').value = '';
    document.getElementById('reminderTime').value = '';
    viewReminders();
    updateStatus();
  }
}

async function viewReminders() {
  const reminders = await apiCall('/api/reminders');
  document.getElementById('reminderList').textContent = reminders;
}

async function getNextReminder() {
  const next = await apiCall('/api/next_reminder');
  document.getElementById('reminderList').textContent = next;
}

async function deleteReminder() {
  const medicine = document.getElementById('deleteReminderMedicineDropdown').value;
  const time = document.getElementById('deleteReminderTime').value;

  if (!medicine || !time) {
    showOutput('Please enter medicine name and time', 'error');
    return;
  }

  const result = await apiCall('/api/delete_reminder', { medicine, time });
  showOutput(result, result.includes('SUCCESS') ? 'success' : 'error');

  if (result.includes('SUCCESS')) {
    document.getElementById('deleteReminderMedicineDropdown').value = '';
    document.getElementById('deleteReminderTime').value = '';
    viewReminders();
    updateStatus();
  }
}

// Queue functions

async function viewQueue() {
  const queue = await apiCall('/api/reminder_queue');
  document.getElementById('queueList').textContent = queue;
}

async function markTaken() {
  const result = await apiCall('/api/mark_taken', {});
  showOutput(result, result.includes('SUCCESS') ? 'success' : 'error');

  viewQueue();
  updateStatus();
}

// Undo functions

async function undoAction() {
  const result = await apiCall('/api/undo', {});
  showOutput(result, result.includes('SUCCESS') ? 'success' : 'error');

  viewHistory();
  updateStatus();
}

async function viewHistory() {
  const history = await apiCall('/api/history');
  document.getElementById('historyList').textContent = history;
}


// Stock tracking functions

async function addMedicineWithStock() {
  const name = document.getElementById('stockMedicineNameDropdown').value;
  const dose = document.getElementById('stockMedicineDose').value.trim();
  const timings = document.getElementById('stockMedicineTimings').value.trim();
  const category = document.getElementById('stockMedicineCategory').value;
  const stock = document.getElementById('stockQuantity').value;
  const threshold = document.getElementById('stockThreshold').value;

  if (!name || !dose || !timings || !category || !stock || !threshold) {
    showOutput('Please fill in all fields', 'error');
    return;
  }

  const result = await apiCall('/api/add_medicine_with_stock', {
    name,
    dose,
    timings,
    category,
    stock,
    threshold
  });
  showOutput(result, result.includes('SUCCESS') ? 'success' : 'error');

  if (result.includes('SUCCESS')) {
    document.getElementById('stockMedicineNameDropdown').value = '';
    document.getElementById('stockMedicineDose').value = '';
    document.getElementById('stockMedicineTimings').value = '';
    document.getElementById('stockQuantity').value = '';
    document.getElementById('stockThreshold').value = '5';
    viewStockLevels();
    updateStatus();
  }
}

async function updateStockLevel() {
  const name = document.getElementById('updateStockNameDropdown').value;
  const quantity = document.getElementById('updateStockQuantity').value;

  if (!name || !quantity) {
    showOutput('Please enter medicine name and quantity', 'error');
    return;
  }

  const result = await apiCall('/api/update_stock', { name, quantity });
  showOutput(result, result.includes('SUCCESS') ? 'success' : 'error');

  if (result.includes('SUCCESS')) {
    document.getElementById('updateStockNameDropdown').value = '';
    document.getElementById('updateStockQuantity').value = '';
    viewStockLevels();
    updateStatus();
  }
}

async function decreaseStockLevel() {
  const name = document.getElementById('decreaseStockNameDropdown').value;
  const quantity = document.getElementById('decreaseStockQuantity').value;

  if (!name || !quantity) {
    showOutput('Please enter medicine name and quantity', 'error');
    return;
  }

  const result = await apiCall('/api/decrease_stock', { name, quantity });
  showOutput(result, result.includes('SUCCESS') ? 'success' : 'error');

  if (result.includes('SUCCESS')) {
    document.getElementById('decreaseStockNameDropdown').value = '';
    document.getElementById('decreaseStockQuantity').value = '1';
    viewStockLevels();
    updateStatus();
  }
}

async function viewStockLevels() {
  const stockLevels = await apiCall('/api/stock_levels');
  document.getElementById('stockList').textContent = stockLevels;

  // Also check for low stock alerts
  const alerts = await apiCall('/api/low_stock_alerts');
  if (!alerts.includes('adequate stock')) {
    showOutput('⚠️ Low Stock Alert: Some medicines are running low!', 'error');
  }
}

async function viewLowStockAlerts() {
  const alerts = await apiCall('/api/low_stock_alerts');
  document.getElementById('stockList').textContent = alerts;
}

// Load medicines into dropdowns (except Medicines section)
async function loadMedicineDropdowns() {
  const response = await apiCall('/api/medicines');
  const lines = response.trim().split('\n');

  if (lines.length > 0 && lines[0].startsWith('All Medicines')) {
    lines.shift(); // Remove first summary line
  }

  // Extract medicine names from detailed lines
  const medicines = lines.map(line => {
    const afterNumber = line.replace(/^\d+\.\s*/, '').trim();
    const namePart = afterNumber.split('|')[0].trim();
    return namePart;
  });

  const dropdownIds = [
    'stockMedicineNameDropdown',
    'updateStockNameDropdown',
    'decreaseStockNameDropdown',
    'reminderMedicineDropdown',
    'deleteReminderMedicineDropdown',
    'searchNameDropdown'
  ];

  dropdownIds.forEach(id => {
    const dropdown = document.getElementById(id);
    if (!dropdown) return;
    dropdown.innerHTML = '<option value="">Select Medicine</option>';
    medicines.forEach(med => {
      const option = document.createElement('option');
      option.value = med;
      option.textContent = med;
      dropdown.appendChild(option);
    });
  });
}

// Initialize on page load
window.onload = function () {
  updateStatus();
  setInterval(updateStatus, 5000); // Update status every 5 seconds
  showSection('categories');
};
