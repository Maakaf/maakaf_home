import { apiFetch, saveSession, getSession, dashboardUrl } from './api.js';
import { describeAuthError, showFormMessage, getErrorMessage } from './errors.js';
import { showToast } from './toast.js';

const wrapper = document.getElementById('login-form-wrapper');
const form = document.getElementById('login-form');
const messageEl = document.getElementById('login-message');
const forgotWrapper = document.getElementById('forgot-password-form-wrapper');
const forgotForm = document.getElementById('forgot-password-form');
const forgotMessageEl = document.getElementById('forgot-password-message');
const verifyWrapper = document.getElementById('verify-email-wrapper');
const verifyEmailDisplay = document.getElementById('verify-email-display');
const verifyResendBtn = document.getElementById('verify-resend-btn');
const verifyResendCountdown = document.getElementById('verify-resend-countdown');

// Already logged in — redirect immediately
const existing = getSession();
if (existing) {
  window.location.href = dashboardUrl(existing.role);
}

const resetWrapper      = document.getElementById('reset-password-wrapper');
const resetEmailDisplay = document.getElementById('reset-email-display');
const resetCodeInput    = document.getElementById('reset-code-input');
const resetNewPassword  = document.getElementById('reset-new-password');
const resetConfirm      = document.getElementById('reset-confirm-password');
const resetError        = document.getElementById('reset-error');
const resetSubmitBtn    = document.getElementById('reset-submit-btn');
const resetResendBtn    = document.getElementById('reset-resend-btn');
const resetResendCountdown = document.getElementById('reset-resend-countdown');

let resetEmail = null;
let resetResendTimer = null;

function showLoginForm() {
  forgotWrapper.classList.add('d-none');
  resetWrapper.classList.add('d-none');
  verifyWrapper.classList.add('d-none');
  wrapper.classList.remove('d-none');
  clearInterval(resetResendTimer);
}

function showForgotForm() {
  wrapper.classList.add('d-none');
  resetWrapper.classList.add('d-none');
  forgotWrapper.classList.remove('d-none');
  forgotForm.reset();
  const loginEmail = form.email.value.trim();
  if (loginEmail) document.getElementById('forgot-email-input').value = loginEmail;
  document.getElementById('forgot-email-input').focus();
}

function showResetCard(email) {
  resetEmail = email;
  resetEmailDisplay.textContent = email;
  forgotWrapper.classList.add('d-none');
  resetWrapper.classList.remove('d-none');
  resetCodeInput.value = '';
  resetNewPassword.value = '';
  resetConfirm.value = '';
  resetError.classList.add('d-none');
  resetCodeInput.focus();
  startResetResendCountdown();
}

function startResetResendCountdown() {
  let seconds = 60;
  resetResendBtn.disabled = true;
  resetResendCountdown.textContent = `ניתן לשלוח שוב עוד ${seconds} שניות`;
  resetResendCountdown.classList.remove('d-none');
  clearInterval(resetResendTimer);
  resetResendTimer = setInterval(() => {
    seconds--;
    if (seconds <= 0) {
      clearInterval(resetResendTimer);
      resetResendBtn.disabled = false;
      resetResendCountdown.classList.add('d-none');
    } else {
      resetResendCountdown.textContent = `ניתן לשלוח שוב עוד ${seconds} שניות`;
    }
  }, 1000);
}

document.getElementById('forgot-password-link').addEventListener('click', (e) => {
  e.preventDefault();
  showForgotForm();
});

document.getElementById('back-from-forgot').addEventListener('click', (e) => {
  e.preventDefault();
  showLoginForm();
});

document.getElementById('back-to-login-from-reset').addEventListener('click', (e) => {
  e.preventDefault();
  clearInterval(resetResendTimer);
  showLoginForm();
});

// Submit email → get reset code
forgotForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = forgotForm.querySelector('button[type="submit"]');
  const email = document.getElementById('forgot-email-input').value.trim();
  submitBtn.disabled = true;
  forgotMessageEl.classList.add('d-none');

  const { ok, data } = await apiFetch('/auth/forgot-password', { method: 'POST', body: { email } });

  submitBtn.disabled = false;

  if (!ok) {
    const msg = getErrorMessage(data?.error?.code) || 'אירעה שגיאה. נסו שוב מאוחר יותר.';
    showFormMessage(forgotMessageEl, msg, true);
    return;
  }

  showResetCard(email);
});

// Resend reset code
resetResendBtn.addEventListener('click', async () => {
  if (!resetEmail) return;
  resetResendBtn.disabled = true;
  await apiFetch('/auth/forgot-password', { method: 'POST', body: { email: resetEmail } });
  resetCodeInput.value = '';
  startResetResendCountdown();
});

// Submit code + new password
resetSubmitBtn.addEventListener('click', async () => {
  const code        = resetCodeInput.value.trim();
  const newPassword = resetNewPassword.value;
  const confirm     = resetConfirm.value;

  if (code.length !== 6) {
    resetError.textContent = 'יש להזין קוד בן 6 ספרות.';
    resetError.classList.remove('d-none');
    return;
  }
  if (newPassword.length < 6) {
    resetError.textContent = 'הסיסמה חייבת להכיל לפחות 6 תווים.';
    resetError.classList.remove('d-none');
    return;
  }
  if (newPassword !== confirm) {
    resetError.textContent = 'הסיסמאות אינן תואמות.';
    resetError.classList.remove('d-none');
    return;
  }

  resetError.classList.add('d-none');
  resetSubmitBtn.disabled = true;
  resetSubmitBtn.textContent = 'מאפס...';

  const { ok, data } = await apiFetch('/auth/reset-password', {
    method: 'POST',
    body: { email: resetEmail, code, newPassword },
  });

  if (ok) {
    showToast('הסיסמה אופסה בהצלחה!', () => {
      showLoginForm();
    });
  } else {
    const msg = getErrorMessage(data?.error?.code) || 'שגיאה באיפוס הסיסמה. נסה/י שוב.';
    resetError.textContent = msg;
    resetError.classList.remove('d-none');
    resetSubmitBtn.disabled = false;
    resetSubmitBtn.textContent = 'אפס/י סיסמה';
  }
});

resetCodeInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') resetSubmitBtn.click(); });

// ─── OTP verification screen (shown after EMAIL_NOT_VERIFIED on login) ────────

let verifyResendTimer = null;
let verifyCredentials = null;
let verifyUid = null;
let verifyFlow = 'register'; // 'register' | 'login-2fa'

const verifyCodeInput    = document.getElementById('verify-code-input');
const verifyCodeError    = document.getElementById('verify-code-error');
const verifySubmitBtn    = document.getElementById('verify-submit-btn');

function showVerifyEmailScreen(email, credentials, uid, flow = 'register') {
  wrapper.classList.add('d-none');
  verifyEmailDisplay.textContent = email;
  verifyCredentials = credentials;
  verifyUid = uid;
  verifyFlow = flow;
  verifyWrapper.classList.remove('d-none');
  verifyCodeInput?.focus();
  startVerifyResendCountdown();
}

function startVerifyResendCountdown() {
  let seconds = 60;
  verifyResendBtn.disabled = true;
  verifyResendCountdown.textContent = `ניתן לשלוח שוב עוד ${seconds} שניות`;
  verifyResendCountdown.classList.remove('d-none');
  clearInterval(verifyResendTimer);
  verifyResendTimer = setInterval(() => {
    seconds--;
    if (seconds <= 0) {
      clearInterval(verifyResendTimer);
      verifyResendBtn.disabled = false;
      verifyResendCountdown.classList.add('d-none');
    } else {
      verifyResendCountdown.textContent = `ניתן לשלוח שוב עוד ${seconds} שניות`;
    }
  }, 1000);
}

verifySubmitBtn.addEventListener('click', async () => {
  const code = verifyCodeInput.value.trim();
  if (code.length !== 6) {
    verifyCodeError.textContent = 'יש להזין קוד בן 6 ספרות.';
    verifyCodeError.classList.remove('d-none');
    return;
  }
  verifyCodeError.classList.add('d-none');
  verifySubmitBtn.disabled = true;
  verifySubmitBtn.textContent = 'מאמת...';

  const endpoint = verifyFlow === 'login-2fa' ? '/auth/login/verify-code' : '/auth/verify-code';
  const { ok, data } = await apiFetch(endpoint, {
    method: 'POST',
    body: {
      uid: verifyUid,
      code,
      email: verifyCredentials?.email,
      password: verifyCredentials?.password,
    },
  });

  if (ok) {
    if (verifyCredentials) { verifyCredentials.email = ''; verifyCredentials.password = ''; }
    const successMsg = verifyFlow === 'login-2fa' ? 'ההתחברות אושרה בהצלחה!' : 'האימות הושלם בהצלחה!';
    saveSession(data);
    showToast(successMsg, () => {
      window.location.href = dashboardUrl(data.role);
    });
  } else {
    const msg = getErrorMessage(data?.error?.code) || 'שגיאה באימות. נסה/י שוב.';
    verifyCodeError.textContent = msg;
    verifyCodeError.classList.remove('d-none');
    verifySubmitBtn.disabled = false;
    verifySubmitBtn.textContent = 'אמת/י';
  }
});

verifyCodeInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') verifySubmitBtn.click();
});

verifyResendBtn.addEventListener('click', async () => {
  const email = verifyEmailDisplay.textContent;
  verifyResendBtn.disabled = true;
  const endpoint = verifyFlow === 'login-2fa' ? '/auth/login/resend-code' : '/auth/resend-verification';
  const body = verifyFlow === 'login-2fa' ? { uid: verifyUid, email } : { email };
  const { ok } = await apiFetch(endpoint, { method: 'POST', body });
  if (!ok) {
    verifyCodeError.textContent = 'שגיאה בשליחת קוד חדש. נסה/י שוב.';
    verifyCodeError.classList.remove('d-none');
    verifyResendBtn.disabled = false;
    return;
  }
  verifyCodeInput.value = '';
  startVerifyResendCountdown();
});

document.getElementById('back-to-login-from-verify').addEventListener('click', (e) => {
  e.preventDefault();
  verifyWrapper.classList.add('d-none');
  clearInterval(verifyResendTimer);
  verifyCredentials = null;
  verifyUid = null;
  verifyFlow = 'register';
  wrapper.classList.remove('d-none');
});

// ─── Login ────────────────────────────────────────────────────────────────────

async function handleLoginSubmit(event) {
  event.preventDefault();
  const submitBtn = form.querySelector('button[type="submit"]');
  const email = form.email.value.trim();
  const password = form.password.value;

  submitBtn.disabled = true;
  try {
    const { ok, data } = await apiFetch('/auth/login', {
      method: 'POST',
      body: { email, password },
    });

    if (!ok) {
      if (data.error?.code === 'EMAIL_NOT_VERIFIED') {
        showVerifyEmailScreen(email, { email, password }, data.uid, 'register');
      } else if (data.error?.code === 'LOGIN_CODE_REQUIRED') {
        showVerifyEmailScreen(email, { email, password }, data.uid, 'login-2fa');
      } else {
        showFormMessage(messageEl, describeAuthError(data.error), true);
      }
      return;
    }

    saveSession(data);
    form.hidden = true;
    const dest = dashboardUrl(data.role);
    showToast(`התחברת בהצלחה כ-${data.fullName ?? data.email}`, () => {
      window.location.href = dest;
    });
  } catch (err) {
    showFormMessage(messageEl, describeAuthError(err), true);
  } finally {
    submitBtn.disabled = false;
  }
}

form.addEventListener('submit', handleLoginSubmit);
