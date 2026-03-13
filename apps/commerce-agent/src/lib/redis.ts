import { createClient } from 'redis';

const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redis.on('error', (err) => console.error('Redis Client Error', err));

export async function connectRedis() {
  if (!redis.isOpen) {
    await redis.connect();
  }
}

export default redis;

// Cart Helpers
export const getCartKey = (userId: string) => `cart:${userId}`;

export interface CartItem {
  productId: string;
  quantity: number;
}

export async function getCart(userId: string): Promise<CartItem[]> {
  await connectRedis();
  const data = await redis.get(getCartKey(userId));
  return data ? JSON.parse(data) : [];
}

export async function addToCart(userId: string, productId: string, quantity: number) {
  await connectRedis();
  const cart = await getCart(userId);
  const existing = cart.find(item => item.productId === productId);
  
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ productId, quantity });
  }
  
  await redis.set(getCartKey(userId), JSON.stringify(cart), {
    EX: 60 * 60 * 24 // 24 hour expiry
  });
  
  return cart;
}

export async function clearCart(userId: string) {
  await connectRedis();
  await redis.del(getCartKey(userId));
}
