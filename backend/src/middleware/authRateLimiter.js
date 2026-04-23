const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 60;
const requestStore = new Map();

const cleanupExpiredEntries = (now) => {
  for (const [key, value] of requestStore.entries()) {
    if (value.resetAt <= now) {
      requestStore.delete(key);
    }
  }
};

module.exports = (req, res, next) => {
  const now = Date.now();
  cleanupExpiredEntries(now);

  const forwardedFor = String(req.headers["x-forwarded-for"] || "")
    .split(",")[0]
    .trim();
  const clientIp = forwardedFor || req.ip || "unknown";
  const key = `${clientIp}:${req.method}:${req.path}`;
  const record = requestStore.get(key);

  if (!record || record.resetAt <= now) {
    requestStore.set(key, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });

    return next();
  }

  if (record.count >= MAX_REQUESTS) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((record.resetAt - now) / 1000)
    );

    res.setHeader("Retry-After", String(retryAfterSeconds));
    return res.status(429).json({
      message: "Too many authentication requests. Please wait and try again.",
    });
  }

  record.count += 1;
  requestStore.set(key, record);
  next();
};
