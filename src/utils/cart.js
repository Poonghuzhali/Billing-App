const CART_KEY = 'billing_cart';

export function getCart() {
  try {
    const stored = localStorage.getItem(CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
}

export function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function addToCart(product) {
  const cart = getCart();
  const idx = cart.findIndex(item => item.id === product.id);
  const inCartQty = idx >= 0 ? cart[idx].quantity : 0;
  if (inCartQty >= (product.stock ?? 0)) {
    return { success: false, name: product.name };
  }
  if (idx >= 0) {
    cart[idx].quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  saveCart(cart);
  return { success: true, name: product.name };
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
  return [];
}
