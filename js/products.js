// Hard-coded product catalog. Prices are in centavos.
const PRODUCTS = [
  { id: 'coffee', name: 'Coffee', price: 4500, category: 'Drinks', icon: '☕' },
  { id: 'sandwich', name: 'Sandwich', price: 5000, category: 'Food', icon: '🥪' },
  { id: 'soft-drink', name: 'Soft Drink', price: 3500, category: 'Drinks', icon: '🥤' },
  { id: 'cookies', name: 'Cookies', price: 2500, category: 'Snacks', icon: '🍪' },
  { id: 'bottled-water', name: 'Bottled Water', price: 2000, category: 'Drinks', icon: '💧' },
  { id: 'chocolate', name: 'Chocolate', price: 2500, category: 'Snacks', icon: '🍫' },
];

const CATEGORIES = ['All', 'Drinks', 'Food', 'Snacks'];

if (typeof module !== 'undefined') module.exports = { PRODUCTS, CATEGORIES };
