// UI controller: screen navigation, rendering, and event handling.
// Business logic lives in cart.js and payment.js.

(function () {
  const STEP_OF_SCREEN = { order: 1, review: 2, method: 3, cash: 3, qr: 3, card: 3, success: 4, receipt: 4 };
  const METHOD_LABEL = { cash: 'Cash', qr: 'QR Payment', card: 'Credit/Debit Card' };
  const MAX_CASH_DIGITS = 6; // up to ₱999,999 from the keypad
  const SIMULATED_DELAY_MS = { qr: 1200, card: 2000 };

  const cart = createCart(PRODUCTS);
  const nextTransactionNumber = createTransactionNumberGenerator(getStorage());

  const state = {
    screen: 'order',
    category: 'All',
    cashInput: '',      // digits typed on the keypad, e.g. "200"
    busy: false,        // true while a simulated QR/card payment is processing
    transaction: null,  // completed transaction shown on Success/Receipt
  };

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  function getStorage() {
    try { return window.localStorage; } catch (e) { return null; }
  }

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // ---------- Feedback ----------
  let toastTimer = null;
  function toast(message, kind) {
    const el = $('#toast');
    el.textContent = message;
    el.className = 'toast' + (kind ? ' is-' + kind : '');
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
  }

  // ---------- Navigation ----------
  function go(screen) {
    state.screen = screen;
    $$('.screen').forEach((el) => { el.hidden = el.dataset.screen !== screen; });
    renderStepper();
    render();
    window.scrollTo(0, 0);
  }

  function renderStepper() {
    const current = STEP_OF_SCREEN[state.screen];
    $$('#stepper li').forEach((li) => {
      const step = Number(li.dataset.step);
      // After payment succeeds, the Payment step counts as done.
      const done = step < current || (state.transaction && step <= 3);
      li.classList.toggle('is-done', done && step !== current);
      li.classList.toggle('is-current', step === current);
      li.querySelector('.step-dot').textContent = done && step !== current ? '✓' : String(step);
    });
  }

  function render() {
    $$('[data-bind="total"]').forEach((el) => { el.textContent = formatPeso(cart.total()); });
    switch (state.screen) {
      case 'order': renderCategories(); renderProducts(); renderCart(); break;
      case 'review': renderReview(); break;
      case 'cash': renderCash(); break;
      case 'success': renderSuccess(); break;
      case 'receipt': renderReceipt(); break;
    }
  }

  // ---------- Screen 1: Item Selection ----------
  function renderCategories() {
    $('#category-chips').innerHTML = CATEGORIES.map((c) =>
      `<button class="chip${c === state.category ? ' is-active' : ''}" data-action="category" data-category="${c}">${c}</button>`
    ).join('');
  }

  function renderProducts() {
    const visible = PRODUCTS.filter((p) => state.category === 'All' || p.category === state.category);
    $('#product-grid').innerHTML = visible.map((p) => {
      const qty = cart.quantityOf(p.id);
      return `
        <button class="product-card${qty ? ' in-cart' : ''}" data-action="add" data-id="${p.id}" aria-label="Add ${escapeHtml(p.name)}">
          ${qty ? `<span class="qty-badge">${qty}</span>` : ''}
          <span class="product-icon" aria-hidden="true">${p.icon}</span>
          <span class="product-name">${escapeHtml(p.name)}</span>
          <span class="product-price">${formatPeso(p.price)}</span>
        </button>`;
    }).join('');
  }

  function renderCart() {
    const items = cart.items();
    const count = cart.count();
    $('#cart-count').textContent = count + (count === 1 ? ' item' : ' items');
    $('#cart-total').textContent = formatPeso(cart.total());
    $('#btn-proceed').disabled = items.length === 0;

    if (items.length === 0) {
      $('#cart-list').innerHTML = `
        <li class="cart-empty">
          <span class="cart-empty-icon" aria-hidden="true">🛒</span>
          <strong>Your order is empty</strong><br>Tap a product on the left to add it to your order.
        </li>`;
      return;
    }

    $('#cart-list').innerHTML = items.map((line) => `
      <li class="cart-line">
        <div class="cart-line-top">
          <div>
            <div class="cart-line-name">${escapeHtml(line.name)}</div>
            <div class="cart-line-unit">${formatPeso(line.unitPrice)} each</div>
          </div>
          <button class="remove-btn" data-action="remove" data-id="${line.id}" aria-label="Remove ${escapeHtml(line.name)}">✕ Remove</button>
        </div>
        <div class="cart-line-bottom">
          <div class="qty-control">
            <button class="qty-btn" data-action="decrease" data-id="${line.id}" aria-label="Decrease quantity">−</button>
            <span class="qty-value">${line.quantity}</span>
            <button class="qty-btn" data-action="increase" data-id="${line.id}" aria-label="Increase quantity">+</button>
          </div>
          <span class="cart-line-subtotal">${formatPeso(line.subtotal)}</span>
        </div>
      </li>`).join('');
  }

  function productName(id) {
    return PRODUCTS.find((p) => p.id === id).name;
  }

  // ---------- Screen 2: Order Summary ----------
  function renderReview() {
    $('#review-rows').innerHTML = cart.items().map((line) => `
      <tr>
        <td>${escapeHtml(line.name)}</td>
        <td class="num">${line.quantity}</td>
        <td class="num">${formatPeso(line.unitPrice)}</td>
        <td class="num">${formatPeso(line.subtotal)}</td>
      </tr>`).join('');
    const count = cart.count();
    $('#review-count').textContent = count + (count === 1 ? ' item' : ' items');
    $('#review-total').textContent = formatPeso(cart.total());
  }

  // ---------- Cash payment ----------
  function renderCash() {
    const total = cart.total();
    $('#cash-display').value = state.cashInput ? formatPeso(Number(state.cashInput) * 100) : '';

    // Live change preview; errors are only shown after tapping Pay Now.
    const result = state.cashInput ? validateCashPayment(state.cashInput, total) : null;
    if (result && result.ok) {
      $('#change-value').textContent = formatPeso(result.change);
      $('#change-formula').textContent = formatPeso(result.paid) + ' − ' + formatPeso(total);
    } else {
      $('#change-value').textContent = '—';
      $('#change-formula').textContent = '';
    }
  }

  function showCashError(result) {
    $('#cash-error-title').textContent = result ? result.error : '';
    $('#cash-error-detail').textContent = result && result.detail ? result.detail : '';
    $('#cash-error').hidden = !result;
    $('#cash-display').classList.toggle('has-error', !!result);
  }

  function pressKey(key) {
    if (key === 'clear') state.cashInput = '';
    else if (key === 'back') state.cashInput = state.cashInput.slice(0, -1);
    else if (state.cashInput.length >= MAX_CASH_DIGITS) {
      toast('Maximum amount reached.', 'error');
      return;
    } else if (state.cashInput === '' && key === '0') {
      return; // no leading zeros
    } else state.cashInput += key;
    showCashError(null);
    renderCash();
  }

  function setQuickAmount(amount) {
    // "Exact" uses the total; totals with centavos are entered as a decimal string.
    state.cashInput = amount === 'exact' ? String(cart.total() / 100) : amount;
    showCashError(null);
    renderCash();
  }

  function payCash() {
    const result = validateCashPayment(state.cashInput, cart.total());
    if (!result.ok) {
      showCashError(result);
      toast(result.error, 'error');
      return; // stay on the payment screen; no transaction is created
    }
    completePayment('cash', result.paid, result.change);
  }

  // ---------- QR & card (simulated) ----------
  function setBusy(busy) {
    state.busy = busy;
    $$('[data-busy-lock]').forEach((btn) => { btn.disabled = busy; });
  }

  function simulatePayment(method) {
    if (state.busy) return;
    setBusy(true);
    $('#' + method + '-status').hidden = false;
    if (method === 'card') $('#card-visual').classList.add('is-processing');

    setTimeout(() => {
      $('#' + method + '-status').hidden = true;
      $('#card-visual').classList.remove('is-processing');
      setBusy(false);
      const total = cart.total();
      completePayment(method, total, 0); // simulated: amount paid = total, change = ₱0.00
    }, SIMULATED_DELAY_MS[method]);
  }

  // ---------- Completing a payment ----------
  function completePayment(method, paid, change) {
    // An order can only be paid once; ignore repeated calls (double tap, Enter + click).
    if (state.transaction) return;
    if (cart.isEmpty()) {
      toast('Your order is empty.', 'error');
      go('order');
      return;
    }
    const date = new Date();
    state.transaction = {
      number: nextTransactionNumber(date),
      date,
      items: cart.items(), // snapshot of the order at payment time
      total: cart.total(),
      method: METHOD_LABEL[method],
      paid,
      change,
      status: 'Payment Successful',
    };
    toast('Transaction completed successfully', 'success');
    go('success');
  }

  function renderSuccess() {
    const t = state.transaction;
    const rows = [
      ['Transaction No.', t.number],
      ['Payment method', t.method],
      ['Transaction amount', formatPeso(t.total)],
      ['Amount paid', formatPeso(t.paid)],
      ['Change', formatPeso(t.change)],
    ];
    $('#success-details').innerHTML = rows.map(([k, v]) =>
      `<div><dt>${k}</dt><dd>${escapeHtml(v)}</dd></div>`).join('');
  }

  // ---------- Receipt ----------
  function renderReceipt() {
    const t = state.transaction;
    $('#receipt').innerHTML = `
      <div class="receipt-title">CAMPUS STORE POS</div>
      <div class="receipt-sub">Self-Service Kiosk · Official Digital Receipt</div>
      <div class="r-row"><span>Transaction No.</span><strong>${escapeHtml(t.number)}</strong></div>
      <div class="r-row"><span>Date</span><span>${escapeHtml(formatDateTime(t.date))}</span></div>
      <hr>
      <div class="r-row r-head"><span>ITEM</span><span>SUBTOTAL</span></div>
      ${t.items.map((line) => `
        <div class="r-row">
          <div>
            <div class="r-item-name">${escapeHtml(line.name)}</div>
            <div class="r-item-calc">${line.quantity} × ${formatPeso(line.unitPrice)}</div>
          </div>
          <span>${formatPeso(line.subtotal)}</span>
        </div>`).join('')}
      <hr>
      <div class="r-row r-total"><span>TOTAL</span><span>${formatPeso(t.total)}</span></div>
      <hr>
      <div class="r-row"><span>Payment method</span><span>${escapeHtml(t.method)}</span></div>
      <div class="r-row"><span>Amount paid</span><span>${formatPeso(t.paid)}</span></div>
      <div class="r-row"><span>Change</span><span>${formatPeso(t.change)}</span></div>
      <div class="r-row"><span>Status</span><span class="r-status">${escapeHtml(t.status)}</span></div>
      <hr>
      <div class="receipt-thanks">Thank you for your purchase!</div>`;
  }

  // ---------- New Transaction ----------
  function newTransaction() {
    cart.clear();
    state.transaction = null;
    state.cashInput = '';
    state.category = 'All';
    showCashError(null);
    $('#receipt').innerHTML = '';
    $('#success-details').innerHTML = '';
    go('order');
    toast('New transaction started — previous order cleared', 'success');
  }

  // ---------- Event handling (one delegated listener) ----------
  const actions = {
    category: (el) => { state.category = el.dataset.category; render(); },
    add: (el) => {
      const result = cart.add(el.dataset.id);
      if (result.ok) toast('Product added — ' + productName(el.dataset.id), 'success');
      else toast(result.error, 'error');
      render();
    },
    increase: (el) => {
      const result = cart.increase(el.dataset.id);
      if (!result.ok) toast(result.error, 'error');
      render();
    },
    decrease: (el) => {
      const name = productName(el.dataset.id);
      const result = cart.decrease(el.dataset.id);
      if (result.removed) toast(name + ' removed from your order');
      render();
    },
    remove: (el) => {
      const name = productName(el.dataset.id);
      cart.remove(el.dataset.id);
      toast(name + ' removed from your order');
      render();
    },
    'go-order': () => go('order'),
    'go-review': () => {
      if (cart.isEmpty()) { toast('Your order is empty. Please add a product first.', 'error'); go('order'); return; }
      go('review');
    },
    'go-method': () => { if (!state.busy) go('method'); },
    'choose-method': (el) => {
      const method = el.dataset.method;
      if (method === 'cash') {
        state.cashInput = '';
        showCashError(null);
      }
      if (method === 'qr') $('#qr-ref').textContent = 'Ref: QR-' + Date.now().toString(36).toUpperCase();
      go(method);
    },
    key: (el) => pressKey(el.dataset.key),
    'cash-quick': (el) => setQuickAmount(el.dataset.amount),
    'pay-cash': payCash,
    'confirm-qr': () => simulatePayment('qr'),
    'process-card': () => simulatePayment('card'),
    'go-receipt': () => go('receipt'),
    'new-transaction': newTransaction,
    'print-receipt': () => window.print(),
  };

  document.addEventListener('click', (event) => {
    const el = event.target.closest('[data-action]');
    if (!el || el.disabled) return;
    const handler = actions[el.dataset.action];
    if (handler) handler(el);
  });

  // Physical keyboard support on the cash screen (optional convenience for testing on a PC).
  document.addEventListener('keydown', (event) => {
    if (state.screen !== 'cash') return;
    if (/^[0-9]$/.test(event.key)) pressKey(event.key);
    else if (event.key === 'Backspace') pressKey('back');
    else if (event.key === 'Escape') pressKey('clear');
    else if (event.key === 'Enter') {
      // Without this, Enter on a focused button also triggers a click, so payCash() ran twice.
      event.preventDefault();
      payCash();
    }
  });

  go('order');
})();
