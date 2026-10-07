// Money is stored as integer centavos (₱45.00 -> 4500) to avoid floating-point errors.

function formatPeso(cents) {
  const pesos = (cents / 100).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return '₱' + pesos;
}

function formatDateTime(date) {
  const day = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return day + ' · ' + time;
}

if (typeof module !== 'undefined') module.exports = { formatPeso, formatDateTime };
