# CS Campus Store — Touchscreen POS Kiosk

IT415 Application Development and Emerging Technologies — Practical Examination.

A self-service touchscreen Point of Sale kiosk. Customers tap products, review the order, pay by Cash, QR Payment, or Credit/Debit Card (simulated), and receive a digital receipt.

**Flow:** Select Items → Review Order → Select Payment Method → Complete Payment → Payment Successful → View Receipt → New Transaction

## Requirements analysis

**Problem.** The campus outlet relies on a cashier to manually encode orders and compute totals. This is slow during peak hours and prone to computation errors. The outlet wants a self-service kiosk that customers operate by touch.

**Target users**
- *Primary:* students, faculty, staff, and visitors buying food and drinks. They may be first-time users in a hurry, so the interface needs large buttons, minimal typing, and clear steps.
- *Secondary:* store staff who assist customers and check receipts.

**Inputs**
| Input | How the user provides it |
|---|---|
| Product selection | Tap a product card |
| Quantity changes | Tap +, −, or Remove in the cart |
| Navigation | Proceed to Payment, Back, Continue, Change payment method |
| Payment method | Tap Cash, QR Payment, or Credit/Debit Card |
| Cash amount paid | On-screen keypad or quick-amount buttons (no physical keyboard needed) |
| Payment confirmation | Pay Now, Confirm Payment (QR), Process Payment (card) |
| Reset | New Transaction |

**Outputs**
- Cart with each item's quantity and subtotal, plus the running total
- Order Summary with products, quantities, unit prices, subtotals, and total
- Change for cash payments, or an error message for invalid or insufficient amounts
- Payment Successful screen with transaction number, method, amount, amount paid, and change
- Digital receipt (optionally printed)
- Feedback messages, e.g. "Product added", "Insufficient payment", "Transaction completed successfully"

**Required kiosk functions**
1. Show at least six products with names and prices.
2. Select products by tapping.
3. Adjust quantities and remove items, with no negative quantities.
4. Compute subtotals and the total automatically.
5. Show an Order Summary with Back navigation that keeps the cart.
6. Offer Cash, QR, and Card payment.
7. Validate cash payments and compute change.
8. Simulate QR and card payments.
9. Show a Payment Successful screen with a unique transaction number.
10. Show a digital receipt.
11. Start a new transaction that clears all previous data.

**Constraints:** touch-first interface; no real payment gateway (simulated); a database is not required; any technology is allowed.

## How to run

No installation or build step is needed.

**Dependencies:** none to run the app; only a modern web browser (Chrome or Edge). [Node.js](https://nodejs.org/) is needed only to run the automated tests. The project uses no npm packages.

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
- Senior Citizen / PWD 20% discount toggle on the Order Summary; the discount appears in the cart, payment screens, Payment Successful screen, and receipt
- Product categories (All / Drinks / Food / Snacks)
- Print Receipt (prints only the receipt)
- Step indicator (Order → Review → Payment → Receipt)
- Responsive layout for tablets and phones
- Physical keyboard support on the Cash screen (digits, Backspace, Esc, Enter)

## Tests

`node tests/logic.test.js` runs 21 automated checks:
- the instructor test cases: totals ₱175 / ₱220 / ₱140, quantity never negative, ₱100 rejected, ₱60 change, exact payment, unique transaction numbers, New Transaction reset
- input validation: blank, invalid, negative, and zero amounts
- the Senior Citizen / PWD discount: ₱175 → −₱35 → ₱140, ₱60 change on ₱200, rounding, reset on New Transaction

## Group contributions — member register

Group: BSIT 4B · Repository: https://github.com/Yesua4/pos-kiosk · Integration branch: `main`

| ID | Member | GitHub username | Branch | Task | Commit(s) | PR | Reviewed by | Merge status |
|---|---|---|---|---|---|---|---|---|
| M1 | Molid | [Yesua4](https://github.com/Yesua4) | `main` | Project setup, README, peso formatting helper | `3a1302f` | — (initial commit) | — | On `main` |
| M1 | Molid | Yesua4 | `feature/core-logic` | Cart logic; cash validation, change, transaction numbers | `9f854d5`, `9fb2d36` | #1 | Earl-404 (approved) | Merged by Earl-404 |
| M2 | Gabatino | [Earl-404](https://github.com/Earl-404) | `feature/kiosk-ui` | Kiosk interface, touchscreen styling, product catalog | `097ebce` | #2 | chuialnaj-cyber (approved) | Merged by chuialnaj-cyber |
| M3 | Chu | [chuialnaj-cyber](https://github.com/chuialnaj-cyber) | `feature/transaction-flow` | Screen flow, QR/card simulation, receipt, reset, logic tests | `fe46254` | #3 | Yesua4 (approved) | Merged by Yesua4 |
| M3 | Chu | chuialnaj-cyber | `fix/enter-key-double-payment` | AI-assisted bug fix: Enter key completed a payment twice | `b0527f9` | #4 | Yesua4 (approved) | Merged by Yesua4 |
| M1 | Molid | Yesua4 | `refactor/payment-formatting` | AI-assisted refactor: explicit `formatPeso` dependency | `675183f` | #5 | chuialnaj-cyber (approved) | Merged by chuialnaj-cyber |
| M2 | Gabatino | Earl-404 | `feature/discount` | AI-assisted generation: Senior Citizen / PWD discount; fix after review | `98728db`, `613ad49` | #6 | Yesua4 (requested changes, then approved) | Merged by Yesua4 |
| M3 | Chu | chuialnaj-cyber | `docs/final-docs` | Final README, member register, AI development log | _(this PR)_ | #7 | | |

**Review feedback resolved (PR #6):** Yesua4 requested changes because the order-screen cart still showed ₱180.00 after the discount brought the total to ₱144.00. Earl-404 fixed it in `613ad49` (the cart now shows the discount and the discounted total). Yesua4 re-tested and approved before merging.

### Development stages in the commit history

| Stage | Commit(s) |
|---|---|
| Setup | `3a1302f` |
| User interface | `097ebce` |
| Core functionality | `9f854d5`, `fe46254` |
| Validation | `9fb2d36` |
| Bug fix | `b0527f9`, `613ad49` |
| Refactoring | `675183f` |
| Enhancement | `98728db` |
| Documentation | `3a1302f` (initial README), `docs/final-docs` (this update) |

## AI-assisted development

See [AI_DEVELOPMENT_LOG.md](AI_DEVELOPMENT_LOG.md).
