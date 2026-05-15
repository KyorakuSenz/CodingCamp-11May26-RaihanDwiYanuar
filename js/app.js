// ============================================
//   EXPENSE & BUDGET VISUALIZER — app.js
//   Features: CRUD, LocalStorage, Pie Chart,
//   Dark Mode, Sort, Spending Limit Highlight
// ============================================

// === STATE ===
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let spendingLimit = parseFloat(localStorage.getItem('spendingLimit')) || 0;
let chart = null;

// === DOM ELEMENTS ===
const itemNameEl     = document.getElementById('item-name');
const itemAmountEl   = document.getElementById('item-amount');
const itemCategoryEl = document.getElementById('item-category');
const addBtn         = document.getElementById('add-btn');
const totalBalanceEl = document.getElementById('total-balance');
const listEl         = document.getElementById('transaction-list');
const emptyMsg       = document.getElementById('empty-msg');
const themeToggle    = document.getElementById('theme-toggle');
const sortSelect     = document.getElementById('sort-select');
const limitInput     = document.getElementById('limit-input');
const setLimitBtn    = document.getElementById('set-limit-btn');
const limitDisplay   = document.getElementById('limit-display');

// ============================================
//   THEME — Dark / Light Mode
// ============================================
function applyTheme(isDark) {
  if (isDark) {
    document.body.classList.add('dark');
    themeToggle.textContent = '☀️ Light Mode';
  } else {
    document.body.classList.remove('dark');
    themeToggle.textContent = '🌙 Dark Mode';
  }
}

// Load saved theme on start
applyTheme(localStorage.getItem('theme') === 'dark');

themeToggle.addEventListener('click', () => {
  const isDark = !document.body.classList.contains('dark');
  applyTheme(isDark);
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// ============================================
//   SPENDING LIMIT
// ============================================
function updateLimitDisplay() {
  if (spendingLimit > 0) {
    limitDisplay.textContent = `Limit aktif: Rp ${spendingLimit.toLocaleString('id-ID')} per transaksi`;
    limitDisplay.classList.add('active');
  } else {
    limitDisplay.textContent = 'No limit set';
    limitDisplay.classList.remove('active');
  }
}

setLimitBtn.addEventListener('click', () => {
  const val = parseFloat(limitInput.value);
  if (!isNaN(val) && val > 0) {
    spendingLimit = val;
    localStorage.setItem('spendingLimit', val);
    updateLimitDisplay();
    renderList();
    limitInput.value = '';
  } else {
    alert('Masukkan nominal limit yang valid!');
  }
});

// ============================================
//   SAVE TO LOCALSTORAGE
// ============================================
function saveData() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

// ============================================
//   UPDATE TOTAL BALANCE
// ============================================
function updateBalance() {
  const total = transactions.reduce((sum, t) => sum + t.amount, 0);
  totalBalanceEl.textContent = 'Rp ' + total.toLocaleString('id-ID');
}

// ============================================
//   RENDER TRANSACTION LIST
// ============================================
function renderList() {
  listEl.innerHTML = '';

  if (transactions.length === 0) {
    listEl.innerHTML = '<p class="empty-msg">No transactions yet. Add one above!</p>';
    return;
  }

  // Sort
  const sortValue = sortSelect.value;
  let sorted = [...transactions];

  if (sortValue === 'amount-asc') {
    sorted.sort((a, b) => a.amount - b.amount);
  } else if (sortValue === 'amount-desc') {
    sorted.sort((a, b) => b.amount - a.amount);
  } else if (sortValue === 'category') {
    sorted.sort((a, b) => a.category.localeCompare(b.category));
  }

  sorted.forEach((t) => {
    const originalIndex = transactions.indexOf(t);
    const isOverLimit = spendingLimit > 0 && t.amount > spendingLimit;

    const item = document.createElement('div');
    item.className = 'transaction-item' + (isOverLimit ? ' over-limit' : '');

    item.innerHTML = `
      <div class="t-info">
        <div class="t-name">${t.name}</div>
        <div class="t-amount">Rp ${t.amount.toLocaleString('id-ID')}</div>
        <span class="t-category">${t.category}</span>
        ${isOverLimit ? '<div class="over-limit-badge">⚠️ Over spending limit!</div>' : ''}
      </div>
      <button class="delete-btn" onclick="deleteTransaction(${originalIndex})">Delete</button>
    `;

    listEl.appendChild(item);
  });
}

// ============================================
//   RENDER PIE CHART
// ============================================
function renderChart() {
  const categories  = ['Food', 'Transport', 'Fun'];
  const colors      = ['#10b981', '#3b82f6', '#f59e0b'];
  const hoverColors = ['#059669', '#2563eb', '#d97706'];

  const data = categories.map(cat =>
    transactions
      .filter(t => t.category === cat)
      .reduce((sum, t) => sum + t.amount, 0)
  );

  const ctx = document.getElementById('pie-chart').getContext('2d');
  if (chart) chart.destroy();

  // Cek apakah semua data 0 (belum ada transaksi)
  const hasData = data.some(v => v > 0);

  chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: categories,
      datasets: [{
        data: hasData ? data : [1, 1, 1],
        backgroundColor: hasData ? colors : ['#e2e8f0', '#e2e8f0', '#e2e8f0'],
        hoverBackgroundColor: hasData ? hoverColors : ['#cbd5e0', '#cbd5e0', '#cbd5e0'],
        borderWidth: 2,
        borderColor: document.body.classList.contains('dark') ? '#1e293b' : '#ffffff'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: document.body.classList.contains('dark') ? '#94a3b8' : '#4a5568',
            font: { family: 'DM Sans', size: 12 },
            padding: 16
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              if (!hasData) return ' No data yet';
              const label = context.label || '';
              const value = context.raw || 0;
              return ` ${label}: Rp ${value.toLocaleString('id-ID')}`;
            }
          }
        }
      }
    }
  });
}

// ============================================
//   ADD TRANSACTION
// ============================================
addBtn.addEventListener('click', () => {
  const name     = itemNameEl.value.trim();
  const amount   = parseFloat(itemAmountEl.value);
  const category = itemCategoryEl.value;

  // Validasi
  if (!name) {
    alert('Item Name tidak boleh kosong!');
    itemNameEl.focus();
    return;
  }
  if (isNaN(amount) || amount <= 0) {
    alert('Amount harus berupa angka dan lebih dari 0!');
    itemAmountEl.focus();
    return;
  }

  // Tambahkan transaksi baru
  transactions.push({ name, amount, category });
  saveData();
  updateBalance();
  renderList();
  renderChart();

  // Reset form
  itemNameEl.value   = '';
  itemAmountEl.value = '';
  itemNameEl.focus();
});

// Bisa tambah transaksi dengan tekan Enter di field amount
itemAmountEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addBtn.click();
});

// ============================================
//   DELETE TRANSACTION
// ============================================
function deleteTransaction(index) {
  if (!confirm(`Hapus transaksi "${transactions[index].name}"?`)) return;
  transactions.splice(index, 1);
  saveData();
  updateBalance();
  renderList();
  renderChart();
}

// ============================================
//   SORT EVENT
// ============================================
sortSelect.addEventListener('change', renderList);

// ============================================
//   INIT — Jalankan saat halaman dibuka
// ============================================
updateLimitDisplay();
updateBalance();
renderList();
renderChart();
