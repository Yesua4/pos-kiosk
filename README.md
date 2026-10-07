# CS Campus Store — Touchscreen POS Kiosk

IT415 Application Development and Emerging Technologies — Practical Examination.

A self-service touchscreen Point of Sale kiosk. Customers tap products, review the order, pay by Cash, QR Payment, or Credit/Debit Card (simulated), and receive a digital receipt.

**Flow:** Select Items → Review Order → Select Payment Method → Complete Payment → Payment Successful → View Receipt → New Transaction

## How to run

No installation or build step is needed.

1. Clone the repository:
   ```bash
   git clone <REPOSITORY_URL>
   cd pos-kiosk
   ```
2. Open `index.html` in Google Chrome or Microsoft Edge (double-click it).
3. Optional: press **F11** for full-screen kiosk mode.

To run the logic tests (requires [Node.js](https://nodejs.org/)):

```bash
node tests/logic.test.js
```

## Technology and storage choices

| Choice | What we used | Why |
|---|---|---|
| Platform | Web application (HTML, CSS, vanilla JavaScript) | Runs on any touchscreen device with a browser; no installation, framework, or build step. |
| Product data | Hard-coded in `js/products.js` | The kiosk has a small, fixed catalog of six products. A database is not required by the exam. |
| Money | Integer centavos (₱45.00 = `4500`) | Avoids floating-point rounding errors in subtotals, totals, and change. |
| Transaction numbers | Sequential `TXN-YYYY-NNNNN`, counter saved in `localStorage` | Every completed transaction gets a unique number, even after the page is reloaded. Falls back to an in-memory counter if storage is blocked. |
| Cart / payment state | In memory (JavaScript objects) | A kiosk serves one customer at a time; New Transaction clears everything. |

## Project structure

```
pos-kiosk/
├── index.html          All screens (Item Selection, Review, Payment Method, Cash/QR/Card, Success, Receipt)
├── css/styles.css      Touchscreen kiosk styling, responsive layout, print styles for the receipt
├── js/format.js        Peso and date formatting
├── js/products.js      Product catalog and categories
├── js/cart.js          Cart logic: add, increase, decrease, remove, subtotals, total
├── js/payment.js       Cash validation, change computation, transaction numbers
├── js/app.js           UI controller: screen navigation, rendering, events, feedback
└── tests/logic.test.js Automated checks based on the instructor test cases
```

`cart.js` and `payment.js` contain no DOM code, so they can be tested with Node.

## Features

**Required**
- Six products shown as large tappable cards with name and price
- Quantity + / − buttons and Remove. Quantity never goes negative; decreasing from 1 removes the item
- Automatic subtotal (unit price × quantity) and total
- Order Summary with Back, which keeps the cart, and Continue to Payment
- Three payment methods: Cash, QR Payment, Credit/Debit Card
- Cash: on-screen keypad, quick amounts, live change preview. Blank, zero, negative, invalid, and insufficient amounts are rejected with a clear message
- QR: QR placeholder, scanning instructions, Confirm Payment (simulated)
- Card: tap/insert/swipe instruction, Process Payment, "Processing payment…" state (simulated)
- Payment Successful screen with transaction number, method, amount, amount paid, change
- Digital receipt with transaction number, date, items, quantities, unit prices, subtotals, total, method, amount paid, change, status
- New Transaction clears the cart, payment details, and receipt, then returns to Item Selection
- Feedback messages such as "Product added", "Insufficient payment", and "Transaction completed successfully"

**Optional enhancements**
- Product categories (All / Drinks / Food / Snacks)
- Print Receipt (prints only the receipt)
- Step indicator (Order → Review → Payment → Receipt)
- Responsive layout for tablets and phones

## Group contributions

| ID | Member | GitHub username | Feature branch | Feature / task |
|---|---|---|---|---|
| M1 | | | `feature/project-setup` | Project setup, layout, README |
| M2 | | | `feature/item-selection` | Product catalog and Item Selection screen |
| M3 | | | `feature/cart` | Cart logic, quantity controls, Order Summary |
| M4 | | | `feature/cash-payment` | Payment Method screen, Cash payment and validation |
| M5 | | | `feature/qr-card-payment` | QR and card simulation |
| M6 | | | `feature/receipt` | Payment Successful, Receipt, New Transaction |

## AI-assisted development

See [AI_DEVELOPMENT_LOG.md](AI_DEVELOPMENT_LOG.md).
