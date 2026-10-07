// Cart logic: no DOM code here, so it can be unit-tested with Node.

const MAX_QUANTITY = 99;
const SENIOR_PWD_DISCOUNT_PERCENT = 20;

// Senior Citizen / PWD discount on an amount in centavos, rounded to the nearest centavo.
function computeDiscount(subtotalCents, percent) {
  return Math.round((subtotalCents * percent) / 100);
}

function createCart(products) {
  // Map of productId -> quantity, kept in insertion order.
  const lines = new Map();
  let discountOn = false;

  function findProduct(id) {
    const product = products.find((p) => p.id === id);
    if (!product) throw new Error('Unknown product: ' + id);
    return product;
  }

  return {
    // Returns { ok, error? } so the UI can show feedback.
    add(id) {
      findProduct(id);
      const qty = lines.get(id) || 0;
      if (qty >= MAX_QUANTITY) {
        return { ok: false, error: 'Invalid quantity — maximum is ' + MAX_QUANTITY + ' per item.' };
      }
      lines.set(id, qty + 1);
      return { ok: true };
    },

    increase(id) {
      return this.add(id);
    },

    // Decreasing from 1 removes the line, so quantity never becomes 0 or negative.
    decrease(id) {
      const qty = lines.get(id) || 0;
      if (qty <= 0) return { ok: false, error: 'Invalid quantity.' };
      if (qty === 1) {
        lines.delete(id);
        return { ok: true, removed: true };
      }
      lines.set(id, qty - 1);
      return { ok: true };
    },

    remove(id) {
      return { ok: lines.delete(id) };
    },

    quantityOf(id) {
      return lines.get(id) || 0;
    },

    // Subtotal = Unit Price × Quantity
    items() {
      return Array.from(lines, ([id, quantity]) => {
        const product = findProduct(id);
        return {
          id,
          name: product.name,
          unitPrice: product.price,
          quantity,
          subtotal: product.price * quantity,
        };
      });
    },

    // Total Amount = Sum of all item subtotals (before any discount)
    total() {
      return this.items().reduce((sum, line) => sum + line.subtotal, 0);
    },

    setDiscount(on) {
      discountOn = Boolean(on);
    },

    hasDiscount() {
      return discountOn;
    },

    discount() {
      return discountOn ? computeDiscount(this.total(), SENIOR_PWD_DISCOUNT_PERCENT) : 0;
    },

    // Amount Due = Total − Discount. This is what the customer pays.
    amountDue() {
      return this.total() - this.discount();
    },

    count() {
      let n = 0;
      lines.forEach((qty) => { n += qty; });
      return n;
    },

    isEmpty() {
      return lines.size === 0;
    },

    clear() {
      lines.clear();
      discountOn = false;
    },
  };
}

if (typeof module !== 'undefined') {
  module.exports = { createCart, computeDiscount, MAX_QUANTITY, SENIOR_PWD_DISCOUNT_PERCENT };
}
