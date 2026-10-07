// Payment validation and transaction numbers. No DOM code here.

// Depends on formatPeso() from format.js (loaded first in index.html).

const MAX_CASH_CENTS = 10000000; // ₱100,000.00 upper limit for a kiosk cash entry

// Converts user input ("200", "200.50") to centavos, rejecting blank/invalid/negative values.
function parseAmount(input) {
  const text = String(input == null ? '' : input).trim().replace(/,/g, '');
  if (text === '') return { ok: false, error: 'Please enter the amount paid.' };
  if (text.startsWith('-')) return { ok: false, error: 'Amount paid cannot be negative.' };
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return { ok: false, error: 'Invalid amount. Please enter a valid number.' };
  const cents = Math.round(parseFloat(text) * 100);
  if (cents === 0) return { ok: false, error: 'Please enter an amount greater than ₱0.00.' };
  if (cents > MAX_CASH_CENTS) return { ok: false, error: 'Amount is too large. Maximum is ' + formatPeso(MAX_CASH_CENTS) + '.' };
  return { ok: true, cents };
}

// Change = Amount Paid − Total Amount. Insufficient payment is rejected.
function validateCashPayment(input, totalCents) {
  const parsed = parseAmount(input);
  if (!parsed.ok) return parsed;
  if (parsed.cents < totalCents) {
    return {
      ok: false,
      error: 'Insufficient payment.',
      detail: 'Please enter at least ' + formatPeso(totalCents) +
        '. You are short by ' + formatPeso(totalCents - parsed.cents) + '.',
    };
  }
  return { ok: true, paid: parsed.cents, change: parsed.cents - totalCents };
}

// Sequential numbers like TXN-2026-00001. The counter is kept in localStorage when available
// so numbers stay unique after a page reload; otherwise it falls back to memory.
function createTransactionNumberGenerator(storage, key) {
  const storageKey = key || 'posKiosk.txnSeq';
  let memorySeq = 0;

  return function nextTransactionNumber(date) {
    const year = (date || new Date()).getFullYear();
    let stored = 0;
    try {
      stored = parseInt(storage && storage.getItem(storageKey), 10) || 0;
    } catch (e) { /* storage blocked: use memory only */ }
    const seq = Math.max(stored, memorySeq) + 1;
    memorySeq = seq;
    try {
      if (storage) storage.setItem(storageKey, String(seq));
    } catch (e) { /* ignore */ }
    return 'TXN-' + year + '-' + String(seq).padStart(5, '0');
  };
}

if (typeof module !== 'undefined') {
  module.exports = { parseAmount, validateCashPayment, createTransactionNumberGenerator, MAX_CASH_CENTS };
}
