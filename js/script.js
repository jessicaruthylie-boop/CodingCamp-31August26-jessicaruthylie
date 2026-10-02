/* ============================================
   FINORA - script.js
   Expense Tracker - Vanilla JavaScript
   ============================================ */

'use strict';

/* ===================================================
   STORAGE MANAGER
   Handles all localStorage read/write operations
   =================================================== */
const StorageManager = {
  KEYS: {
    transactions: 'finora_transactions',
    categories:   'finora_categories',
    theme:        'finora_theme',
    sort:         'finora_sort',
  },

  getTransactions() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.transactions)) || [];
    } catch {
      return [];
    }
  },

  saveTransactions(transactions) {
    localStorage.setItem(this.KEYS.transactions, JSON.stringify(transactions));
  },

  getCustomCategories() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.categories)) || [];
    } catch {
      return [];
    }
  },

  saveCustomCategories(categories) {
    localStorage.setItem(this.KEYS.categories, JSON.stringify(categories));
  },

  getTheme() {
    return localStorage.getItem(this.KEYS.theme) || 'light';
  },

  saveTheme(theme) {
    localStorage.setItem(this.KEYS.theme, theme);
  },

  getSort() {
    return localStorage.getItem(this.KEYS.sort) || 'newest';
  },

  saveSort(sort) {
    localStorage.setItem(this.KEYS.sort, sort);
  },
};

/* ===================================================
   CATEGORY MANAGER
   Manages default and custom categories
   =================================================== */
const CategoryManager = {
  DEFAULT_CATEGORIES: [
    { value: 'Food',      label: '🍜 Food',      emoji: '🍜' },
    { value: 'Transport', label: '🚗 Transport',  emoji: '🚗' },
    { value: 'Fun',       label: '🎉 Fun',        emoji: '🎉' },
  ],

  getAll() {
    const customs = StorageManager.getCustomCategories().map((name) => ({
      value: name,
      label: `✨ ${name}`,
      emoji: '✨',
      isCustom: true,
    }));
    return [...this.DEFAULT_CATEGORIES, ...customs];
  },

  getEmoji(categoryValue) {
    const found = this.getAll().find((c) => c.value === categoryValue);
    return found ? found.emoji : '✨';
  },

  isDefault(value) {
    return this.DEFAULT_CATEGORIES.some((c) => c.value === value);
  },

  add(name) {
    const trimmed = name.trim();
    if (!trimmed) return { success: false, message: 'Nama kategori tidak boleh kosong.' };

    const existing = this.getAll().map((c) => c.value.toLowerCase());
    if (existing.includes(trimmed.toLowerCase())) {
      return { success: false, message: 'Kategori sudah ada.' };
    }

    const customs = StorageManager.getCustomCategories();
    customs.push(trimmed);
    StorageManager.saveCustomCategories(customs);
    return { success: true, value: trimmed };
  },
};

/* ===================================================
   TRANSACTION MANAGER
   Handles transaction CRUD operations
   =================================================== */
const TransactionManager = {
  getAll() {
    return StorageManager.getTransactions();
  },

  add(name, amount, category) {
    const transactions = this.getAll();
    const newTransaction = {
      id:       Date.now().toString(),
      name:     name.trim(),
      amount:   parseFloat(amount),
      category: category,
      date:     new Date().toISOString(),
    };
    transactions.unshift(newTransaction); // newest first in storage
    StorageManager.saveTransactions(transactions);
    return newTransaction;
  },

  delete(id) {
    const transactions = this.getAll().filter((t) => t.id !== id);
    StorageManager.saveTransactions(transactions);
  },

  getTotal() {
    return this.getAll().reduce((sum, t) => sum + t.amount, 0);
  },

  getTotalByCategory() {
    const totals = {};
    this.getAll().forEach((t) => {
      totals[t.category] = (totals[t.category] || 0) + t.amount;
    });
    return totals;
  },
};

/* ===================================================
   SORT HANDLER
   Sorts transactions without mutating stored data
   =================================================== */
const SortHandler = {
  apply(transactions, sortValue) {
    const copy = [...transactions];
    switch (sortValue) {
      case 'newest':
        return copy.sort((a, b) => new Date(b.date) - new Date(a.date));
      case 'oldest':
        return copy.sort((a, b) => new Date(a.date) - new Date(b.date));
      case 'highest':
        return copy.sort((a, b) => b.amount - a.amount);
      case 'lowest':
        return copy.sort((a, b) => a.amount - b.amount);
      case 'az':
        return copy.sort((a, b) => a.name.localeCompare(b.name, 'id'));
      default:
        return copy;
    }
  },
};

/* ===================================================
   THEME MANAGER
   Handles dark / light mode toggle
   =================================================== */
const ThemeManager = {
  current: 'light',

  init() {
    this.current = StorageManager.getTheme();
    this.apply(this.current);
  },

  toggle() {
    this.current = this.current === 'light' ? 'dark' : 'light';
    this.apply(this.current);
    StorageManager.saveTheme(this.current);
  },

  apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const icon = document.getElementById('themeToggle').querySelector('.theme-icon');
    if (icon) {
      icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  },
};

/* ===================================================
   CHART RENDERER
   Renders and updates Pie Chart using Chart.js
   =================================================== */
const ChartRenderer = {
  instance: null,

  COLORS: {
    Food:      '#FF8A65',
    Transport: '#42A5F5',
    Fun:       '#AB47BC',
    // custom categories get colors from a rotation
  },

  CUSTOM_COLOR_POOL: [
    '#26C6DA', '#66BB6A', '#FFA726', '#EF5350',
    '#EC407A', '#7E57C2', '#78909C', '#8D6E63',
  ],

  getColor(category, index) {
    if (this.COLORS[category]) return this.COLORS[category];
    return this.CUSTOM_COLOR_POOL[index % this.CUSTOM_COLOR_POOL.length];
  },

  render(totals) {
    const canvas = document.getElementById('spendingChart');
    const emptyMsg = document.getElementById('chartEmpty');

    const labels = Object.keys(totals);
    const data   = Object.values(totals);
    const hasData = data.length > 0 && data.some((v) => v > 0);

    // Show/hide empty state
    emptyMsg.style.display = hasData ? 'none' : 'flex';
    canvas.style.display   = hasData ? 'block' : 'none';

    if (!hasData) {
      if (this.instance) {
        this.instance.destroy();
        this.instance = null;
      }
      return;
    }

    const colors = labels.map((label, i) => this.getColor(label, i));

    const chartData = {
      labels,
      datasets: [{
        data,
        backgroundColor:   colors.map((c) => c + 'CC'), // ~80% opacity
        borderColor:       colors,
        borderWidth:       2,
        hoverOffset:       8,
      }],
    };

    const chartOptions = {
      responsive:          true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding:   14,
            font:      { size: 12, weight: '600' },
            color:     getComputedStyle(document.documentElement)
                         .getPropertyValue('--color-text').trim() || '#2D2D2D',
            usePointStyle: true,
            pointStyle:    'circle',
          },
        },
        tooltip: {
          callbacks: {
            label(ctx) {
              const val = ctx.parsed;
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct   = ((val / total) * 100).toFixed(1);
              return ` ${formatRupiah(val)} (${pct}%)`;
            },
          },
        },
      },
    };

    if (this.instance) {
      // Update existing chart
      this.instance.data = chartData;
      this.instance.options.plugins.legend.labels.color =
        getComputedStyle(document.documentElement)
          .getPropertyValue('--color-text').trim() || '#2D2D2D';
      this.instance.update();
    } else {
      // Create new chart
      this.instance = new Chart(canvas, {
        type:    'pie',
        data:    chartData,
        options: chartOptions,
      });
    }
  },
};

/* ===================================================
   UI RENDERER
   Renders transaction list, balance, and triggers chart
   =================================================== */
const UIRenderer = {
  renderAll() {
    this.renderBalance();
    this.renderList();
    this.renderChart();
  },

  renderBalance() {
    const total      = TransactionManager.getTotal();
    const count      = TransactionManager.getAll().length;
    const balanceEl  = document.getElementById('totalBalance');
    const countEl    = document.getElementById('totalCount');

    balanceEl.textContent = formatRupiah(total);
    countEl.textContent   = `${count} transaksi`;
  },

  renderList() {
    const listEl   = document.getElementById('transactionList');
    const emptyEl  = document.getElementById('listEmpty');
    const sortVal  = document.getElementById('sortSelect').value;

    const transactions = SortHandler.apply(TransactionManager.getAll(), sortVal);

    // Clear existing items (keep the empty state element)
    const items = listEl.querySelectorAll('.transaction-item');
    items.forEach((el) => el.remove());

    if (transactions.length === 0) {
      emptyEl.style.display = 'flex';
      return;
    }

    emptyEl.style.display = 'none';

    transactions.forEach((t) => {
      const item = this.createTransactionElement(t);
      listEl.appendChild(item);
    });
  },

  createTransactionElement(transaction) {
    const { id, name, amount, category, date } = transaction;

    const emoji       = CategoryManager.getEmoji(category);
    const badgeClass  = CategoryManager.isDefault(category)
      ? `category-badge-${category}`
      : 'category-badge-custom';
    const dataCategory = CategoryManager.isDefault(category) ? category : 'custom';
    const formattedDate = formatDate(date);

    const item = document.createElement('div');
    item.className = 'transaction-item';
    item.setAttribute('data-id', id);
    item.setAttribute('data-category', dataCategory);

    item.innerHTML = `
      <span class="transaction-emoji">${emoji}</span>
      <div class="transaction-info">
        <div class="transaction-name" title="${escapeHtml(name)}">${escapeHtml(name)}</div>
        <div class="transaction-meta">
          <span class="transaction-category ${badgeClass}">${escapeHtml(category)}</span>
          <span class="transaction-date">${formattedDate}</span>
        </div>
      </div>
      <span class="transaction-amount">${formatRupiah(amount)}</span>
      <button class="btn-delete" data-id="${id}" aria-label="Hapus transaksi ${escapeHtml(name)}">🗑️</button>
    `;

    // Attach delete handler
    item.querySelector('.btn-delete').addEventListener('click', () => {
      FormHandler.handleDelete(id, name);
    });

    return item;
  },

  renderChart() {
    const totals = TransactionManager.getTotalByCategory();
    ChartRenderer.render(totals);
  },

  populateCategorySelect() {
    const select     = document.getElementById('itemCategory');
    const currentVal = select.value;

    // Remove all options except the placeholder (index 0)
    while (select.options.length > 1) {
      select.remove(1);
    }

    CategoryManager.getAll().forEach((cat) => {
      const option = document.createElement('option');
      option.value       = cat.value;
      option.textContent = cat.label;
      select.appendChild(option);
    });

    // Restore selection if still valid
    if (currentVal) {
      const exists = [...select.options].some((o) => o.value === currentVal);
      if (exists) select.value = currentVal;
    }
  },
};

/* ===================================================
   FORM HANDLER
   Handles form validation, submit, and custom category
   =================================================== */
const FormHandler = {
  init() {
    const form = document.getElementById('transactionForm');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    // Custom category toggle
    document.getElementById('toggleCustomCategory').addEventListener('click', () => {
      this.toggleCustomCategoryInput(true);
    });

    document.getElementById('confirmAddCategory').addEventListener('click', () => {
      this.handleAddCustomCategory();
    });

    document.getElementById('cancelAddCategory').addEventListener('click', () => {
      this.toggleCustomCategoryInput(false);
    });

    // Allow Enter key in custom category input
    document.getElementById('newCategoryName').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.handleAddCustomCategory();
      }
      if (e.key === 'Escape') {
        this.toggleCustomCategoryInput(false);
      }
    });

    // Clear error on input
    ['itemName', 'itemAmount', 'itemCategory'].forEach((id) => {
      const el = document.getElementById(id);
      el.addEventListener('input', () => this.clearError(id));
      el.addEventListener('change', () => this.clearError(id));
    });
  },

  handleSubmit() {
    const name     = document.getElementById('itemName').value;
    const amount   = document.getElementById('itemAmount').value;
    const category = document.getElementById('itemCategory').value;

    if (!this.validate(name, amount, category)) return;

    TransactionManager.add(name, amount, category);
    this.resetForm();
    UIRenderer.renderAll();
    showToast('Transaksi berhasil ditambahkan! 🎉', 'success');
  },

  validate(name, amount, category) {
    let isValid = true;

    if (!name.trim()) {
      this.showError('itemName', 'Nama item wajib diisi.');
      isValid = false;
    }

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      this.showError('itemAmount', 'Jumlah harus berupa angka lebih dari 0.');
      isValid = false;
    }

    if (!category) {
      this.showError('itemCategory', 'Kategori wajib dipilih.');
      isValid = false;
    }

    return isValid;
  },

  showError(fieldId, message) {
    const field   = document.getElementById(fieldId);
    const errorEl = document.getElementById(fieldId + 'Error');
    if (field)   field.classList.add('input-error');
    if (errorEl) errorEl.textContent = message;
  },

  clearError(fieldId) {
    const field   = document.getElementById(fieldId);
    const errorEl = document.getElementById(fieldId + 'Error');
    if (field)   field.classList.remove('input-error');
    if (errorEl) errorEl.textContent = '';
  },

  resetForm() {
    document.getElementById('transactionForm').reset();
    ['itemName', 'itemAmount', 'itemCategory'].forEach((id) => this.clearError(id));
    this.toggleCustomCategoryInput(false);
  },

  handleDelete(id, name) {
    TransactionManager.delete(id);
    UIRenderer.renderAll();
    showToast(`"${name}" dihapus.`, 'success');
  },

  toggleCustomCategoryInput(show) {
    const inputSection = document.getElementById('customCategoryInput');
    const toggleBtn    = document.getElementById('toggleCustomCategory');
    inputSection.style.display = show ? 'flex' : 'none';
    toggleBtn.style.display    = show ? 'none' : 'block';
    if (show) {
      document.getElementById('newCategoryName').focus();
    } else {
      document.getElementById('newCategoryName').value = '';
    }
  },

  handleAddCustomCategory() {
    const input  = document.getElementById('newCategoryName');
    const result = CategoryManager.add(input.value);

    if (!result.success) {
      showToast(result.message, 'error');
      input.focus();
      return;
    }

    UIRenderer.populateCategorySelect();
    // Auto-select the newly added category
    document.getElementById('itemCategory').value = result.value;
    this.toggleCustomCategoryInput(false);
    showToast(`Kategori "${result.value}" ditambahkan! ✨`, 'success');
  },
};

/* ===================================================
   UTILITY FUNCTIONS
   =================================================== */

/**
 * Format number to Rupiah string
 * e.g. 15000 → "Rp 15.000"
 */
function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style:    'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format ISO date string to readable date
 * e.g. "2026-10-02T10:00:00.000Z" → "2 Okt 2026"
 */
function formatDate(isoString) {
  return new Intl.DateTimeFormat('id-ID', {
    day:   'numeric',
    month: 'short',
    year:  'numeric',
  }).format(new Date(isoString));
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(str).replace(/[&<>"']/g, (c) => map[c]);
}

/* ===================================================
   TOAST NOTIFICATION
   =================================================== */
let toastTimeout = null;

function showToast(message, type = 'success') {
  // Remove existing toast if any
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  if (toastTimeout) clearTimeout(toastTimeout);

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('toast-show'));
  });

  toastTimeout = setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.remove(), 350);
  }, 2800);
}

/* ===================================================
   INIT
   Entry point — runs when DOM is ready
   =================================================== */
function init() {
  // 1. Apply saved theme
  ThemeManager.init();

  // 2. Populate category dropdown (default + custom)
  UIRenderer.populateCategorySelect();

  // 3. Restore saved sort preference
  const savedSort = StorageManager.getSort();
  document.getElementById('sortSelect').value = savedSort;

  // 4. Render balance, list, and chart from stored data
  UIRenderer.renderAll();

  // 5. Attach form handlers
  FormHandler.init();

  // 6. Theme toggle button
  document.getElementById('themeToggle').addEventListener('click', () => {
    ThemeManager.toggle();
    // Re-render chart so legend color updates to match new theme
    UIRenderer.renderChart();
  });

  // 7. Sort change handler
  document.getElementById('sortSelect').addEventListener('change', (e) => {
    StorageManager.saveSort(e.target.value);
    UIRenderer.renderList();
  });
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
