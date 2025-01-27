interface RateLimitConfig {
  maxRequests: number;  // Maksimum istek sayısı
  windowMs: number;     // Zaman penceresi (milisaniye)
}

interface RateLimitStore {
  [key: string]: {
    requests: number;
    resetTime: number;
  };
}

const rateLimitStore: RateLimitStore = {};

const defaultConfig: RateLimitConfig = {
  maxRequests: 5,      // 5 istek
  windowMs: 5000       // 5 saniye
};

export const checkRateLimit = (
  action: string,
  config: RateLimitConfig = defaultConfig
): boolean => {
  const now = Date.now();
  const store = rateLimitStore[action] || {
    requests: 0,
    resetTime: now + config.windowMs
  };

  // Zaman penceresi dolduysa sıfırla
  if (now > store.resetTime) {
    store.requests = 0;
    store.resetTime = now + config.windowMs;
  }

  // İstek limitini kontrol et
  if (store.requests >= config.maxRequests) {
    return false;
  }

  // İstek sayısını artır
  store.requests++;
  rateLimitStore[action] = store;

  return true;
};

export const getRateLimitResetTime = (action: string): number => {
  const store = rateLimitStore[action];
  if (!store) return 0;
  return Math.max(0, store.resetTime - Date.now());
};

// Örnek kullanım limitleri
export const rateLimits = {
  message: {
    maxRequests: 3,    // 3 mesaj
    windowMs: 2000     // 2 saniye
  },
  comment: {
    maxRequests: 5,    // 5 yorum
    windowMs: 10000    // 10 saniye
  },
  groupCreate: {
    maxRequests: 1,    // 1 grup
    windowMs: 30000    // 30 saniye
  },
  search: {
    maxRequests: 10,   // 10 arama
    windowMs: 10000    // 10 saniye
  },
  notification: {
    maxRequests: 5,    // 5 bildirim
    windowMs: 5000     // 5 saniye
  }
}; 