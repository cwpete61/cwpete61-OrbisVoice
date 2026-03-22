import { createClient } from 'redis';

const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    connectTimeout: 2000,
    reconnectStrategy: (retries) => (retries > 3 ? new Error('Redis connection failed') : 1000)
  }
});

redis.once('error', (err) => console.error('Redis Client Error (Suppressing future errors)', err));

let isConnecting = false;

const useMemoryOnly = true;

export async function connectRedis() {
  if (useMemoryOnly) return;
  if (!redis.isOpen && !isConnecting) {
    isConnecting = true;
    try {
      await redis.connect();
    } finally {
      isConnecting = false;
    }
  }
}

export default redis;

// Cart Helpers
export const getCartKey = (userId: string) => `cart:${userId}`;

export interface CartItem {
  productId: string;
  quantity: number;
}

// In-memory fallback if Redis is unavailable
const memoryCart = new Map<string, string>();

export async function getCart(userId: string): Promise<CartItem[]> {
  if (useMemoryOnly) {
    const data = memoryCart.get(getCartKey(userId));
    return data ? JSON.parse(data) : [];
  }
  try {
    await connectRedis();
    const data = await redis.get(getCartKey(userId));
    return data ? JSON.parse(data) : [];
  } catch (err) {
    const data = memoryCart.get(getCartKey(userId));
    return data ? JSON.parse(data) : [];
  }
}

export async function addToCart(userId: string, productId: string, quantity: number) {
  const cart = await getCart(userId);
  const existing = cart.find(item => item.productId === productId);
  
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ productId, quantity });
  }
  
  const serialized = JSON.stringify(cart);
  if (useMemoryOnly) {
    memoryCart.set(getCartKey(userId), serialized);
    return cart;
  }

  try {
    await connectRedis();
    await redis.set(getCartKey(userId), serialized, {
      EX: 60 * 60 * 24
    });
  } catch (err) {
    memoryCart.set(getCartKey(userId), serialized);
  }
  
  return cart;
}

export async function removeFromCart(userId: string, productId: string) {
  const cart = await getCart(userId);
  const updated = cart.filter(item => item.productId !== productId);
  const serialized = JSON.stringify(updated);
  
  if (useMemoryOnly) {
    memoryCart.set(getCartKey(userId), serialized);
    return updated;
  }

  try {
    await connectRedis();
    await redis.set(getCartKey(userId), serialized, {
      EX: 60 * 60 * 24
    });
  } catch (err) {
    memoryCart.set(getCartKey(userId), serialized);
  }
  return updated;
}

export async function clearCart(userId: string) {
  if (useMemoryOnly) {
    memoryCart.delete(getCartKey(userId));
    return;
  }
  try {
    await connectRedis();
    await redis.del(getCartKey(userId));
  } catch (err) {
    memoryCart.delete(getCartKey(userId));
  }
}
