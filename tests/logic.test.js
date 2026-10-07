// Run with: node tests/logic.test.js
// Covers the instructor test cases from the exam (sections 6 and 7) at the logic level.

const assert = require('assert');
const { formatPeso } = require('../js/format.js');
const { PRODUCTS } = require('../js/products.js');
const { createCart, MAX_QUANTITY } = require('../js/cart.js');
const { validateCashPayment, createTransactionNumberGenerator } = require('../js/payment.js');

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ✓ ' + name);
  } catch (err) {
    console.error('  ✗ ' + name + '\n    ' + err.message);
    process.exitCode = 1;
  }
}

function sampleOrder() {
  const cart = createCart(PRODUCTS);
  cart.add('coffee'); cart.add('coffee');
  cart.add('sandwich');
  cart.add('soft-drink');
  return cart;
}

console.log('Selection and order');

test('1. At least six products with names and prices', () => {
  assert.ok(PRODUCTS.length >= 6);
  PRODUCTS.forEach((p) => assert.ok(p.name && p.price > 0));
});

test('2. Add multiple products: subtotals 90/50/35, total 175', () => {
  const cart = sampleOrder();
  assert.deepStrictEqual(cart.items().map((l) => l.subtotal), [9000, 5000, 3500]);
  assert.strictEqual(cart.total(), 17500);
});

test('3. Quantity controls: coffee 3 -> 135 / total 220, back to 2 -> 175', () => {
  const cart = sampleOrder();
  cart.increase('coffee');
  assert.strictEqual(cart.items()[0].subtotal, 13500);
  assert.strictEqual(cart.total(), 22000);
  cart.decrease('coffee');
  assert.strictEqual(cart.total(), 17500);
});

test('3b. Quantity never becomes negative', () => {
  const cart = createCart(PRODUCTS);
  cart.add('cookies');
  cart.decrease('cookies');
  assert.strictEqual(cart.quantityOf('cookies'), 0);
  assert.strictEqual(cart.decrease('cookies').ok, false);
  assert.strictEqual(cart.quantityOf('cookies'), 0);
});

test('3c. Quantity is capped at the maximum', () => {
  const cart = createCart(PRODUCTS);
  for (let i = 0; i < MAX_QUANTITY; i++) cart.add('cookies');
  assert.strictEqual(cart.add('cookies').ok, false);
  assert.strictEqual(cart.quantityOf('cookies'), MAX_QUANTITY);
});

test('4. Remove Soft Drink -> total 140', () => {
  const cart = sampleOrder();
  cart.remove('soft-drink');
  assert.ok(!cart.items().some((l) => l.id === 'soft-drink'));
  assert.strictEqual(cart.total(), 14000);
});

console.log('Payment and receipt');

test('8. Insufficient cash: ₱100 for ₱140 is rejected', () => {
  const r = validateCashPayment('100', 14000);
  assert.strictEqual(r.ok, false);
  assert.match(r.error, /Insufficient payment/);
  assert.match(r.detail, /at least ₱140\.00/);
  assert.match(r.detail, /short by ₱40\.00/);
});

test('9. Successful cash: ₱200 for ₱140 -> change ₱60', () => {
  const r = validateCashPayment('200', 14000);
  assert.deepStrictEqual(r, { ok: true, paid: 20000, change: 6000 });
});

test('9b. Exact payment gives ₱0.00 change', () => {
  assert.deepStrictEqual(validateCashPayment('140', 14000), { ok: true, paid: 14000, change: 0 });
});

test('Sample: ₱200 for ₱175 -> change ₱25', () => {
  assert.strictEqual(validateCashPayment('200', 17500).change, 2500);
});

test('Blank, invalid, negative and zero amounts are rejected', () => {
  ['', '   ', null, 'abc', '12a', '-50', '0', '1.234'].forEach((input) => {
    assert.strictEqual(validateCashPayment(input, 14000).ok, false, 'should reject ' + JSON.stringify(input));
  });
});

test('15. Two transactions get different numbers', () => {
  const store = {};
  const storage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; } };
  const next = createTransactionNumberGenerator(storage);
  const a = next(new Date(2026, 9, 6));
  const b = next(new Date(2026, 9, 6));
  assert.strictEqual(a, 'TXN-2026-00001');
  assert.strictEqual(b, 'TXN-2026-00002');
  // A fresh generator (e.g. after a page reload) continues the sequence.
  assert.strictEqual(createTransactionNumberGenerator(storage)(new Date(2026, 9, 6)), 'TXN-2026-00003');
});

test('Transaction numbers still unique when storage is unavailable', () => {
  const broken = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  const next = createTransactionNumberGenerator(broken);
  assert.notStrictEqual(next(), next());
});

test('14. New Transaction: clearing the cart empties it and total is 0', () => {
  const cart = sampleOrder();
  cart.clear();
  assert.ok(cart.isEmpty());
  assert.strictEqual(cart.total(), 0);
});

test('Peso formatting', () => {
  assert.strictEqual(formatPeso(17500), '₱175.00');
  assert.strictEqual(formatPeso(100000), '₱1,000.00');
  assert.strictEqual(formatPeso(0), '₱0.00');
});

console.log(`\n${passed} tests passed${process.exitCode ? ', some FAILED' : ''}.`);
