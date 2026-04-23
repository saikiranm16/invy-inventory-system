const crypto = require("crypto");

const CAPTCHA_TTL_MS = 5 * 60 * 1000;
const captchaStore = new Map();

const cleanupExpiredCaptchas = () => {
  const now = Date.now();

  for (const [id, challenge] of captchaStore.entries()) {
    if (challenge.expiresAt <= now) {
      captchaStore.delete(id);
    }
  }
};

const createCaptchaChallenge = () => {
  cleanupExpiredCaptchas();

  const left = Math.floor(Math.random() * 9) + 1;
  const right = Math.floor(Math.random() * 9) + 1;
  const id = crypto.randomUUID();

  captchaStore.set(id, {
    answer: String(left + right),
    expiresAt: Date.now() + CAPTCHA_TTL_MS,
  });

  return {
    captchaId: id,
    prompt: `What is ${left} + ${right}?`,
    expiresInSeconds: CAPTCHA_TTL_MS / 1000,
  };
};

const verifyCaptchaChallenge = (captchaId, captchaAnswer) => {
  cleanupExpiredCaptchas();

  if (!captchaId || captchaAnswer === undefined || captchaAnswer === null) {
    return false;
  }

  const challenge = captchaStore.get(String(captchaId));
  captchaStore.delete(String(captchaId));

  if (!challenge) {
    return false;
  }

  return challenge.answer === String(captchaAnswer).trim();
};

module.exports = {
  createCaptchaChallenge,
  verifyCaptchaChallenge,
};
