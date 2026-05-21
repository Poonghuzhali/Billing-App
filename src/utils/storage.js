const STORAGE_KEYS = {
  inventory: 'billing_inventory',
  customers: 'billing_customers',
  sellers: 'billing_sellers',
  bills: 'billing_bills',
  categories: 'billing_categories',
  shop: 'billing_shop',
};

export async function loadData(key, jsonFile) {
  const stored = localStorage.getItem(STORAGE_KEYS[key]);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {}
  }
  const res = await fetch(`${import.meta.env.BASE_URL}data/${jsonFile}`);
  const data = await res.json();
  localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(data));
  return data;
}

export function saveData(key, data) {
  localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(data));
}
