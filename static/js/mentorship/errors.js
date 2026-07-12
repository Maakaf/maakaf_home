const AUTH_ERROR_MESSAGES = {
  // Firebase Admin SDK error codes (from /auth/register)
  'auth/email-already-exists': 'כתובת האימייל הזו כבר רשומה במערכת.',
  'auth/email-already-in-use': 'כתובת האימייל הזו כבר רשומה במערכת.',
  'auth/invalid-email': 'כתובת האימייל אינה תקינה.',
  'auth/invalid-password': 'הסיסמה חייבת להיות באורך של 6 תווים לפחות.',
  'auth/weak-password': 'הסיסמה חייבת להיות באורך של 6 תווים לפחות.',
  'auth/too-many-requests': 'יותר מדי ניסיונות כושלים. נסו שוב מאוחר יותר.',
  'auth/operation-not-allowed': 'הרשמה עם אימייל וסיסמה אינה מופעלת עדיין במערכת.',

  // Identity Toolkit REST error codes (from /auth/login)
  EMAIL_NOT_FOUND: 'לא נמצא חשבון עם האימייל הזה.',
  INVALID_PASSWORD: 'הסיסמה שגויה.',
  INVALID_LOGIN_CREDENTIALS: 'אימייל או סיסמה שגויים.',
  USER_DISABLED:   'החשבון הזה הושבת.',
  USER_NOT_FOUND:  'כתובת האימייל אינה רשומה במערכת.',
  TOO_MANY_ATTEMPTS_TRY_LATER: 'יותר מדי ניסיונות כושלים. נסו שוב מאוחר יותר.',
  EMAIL_EXISTS: 'כתובת האימייל הזו כבר רשומה במערכת.',
  WEAK_PASSWORD: 'הסיסמה חייבת להיות באורך של 6 תווים לפחות.',

  // mentorship-backend /auth/register validation codes
  INVALID_ROLE: 'סוג ההרשמה אינו תקין.',
  MISSING_FIELDS: 'יש למלא את כל השדות החובה.',
  MISSING_EXPERTISE: 'יש למלא תחומי התמחות (שדה חובה).',
  MISSING_INTERESTS: 'יש למלא תחומי עניין (שדה חובה).',

  // email verification
  EMAIL_NOT_VERIFIED: 'יש לאמת את כתובת האימייל לפני ההתחברות. בדוק/י את תיבת הדואר שלך.',
  LOGIN_CODE_REQUIRED: 'יש להזין קוד אימות שנשלח לכתובת האימייל שלך.',

  // OTP verification errors
  INVALID_CODE: 'הקוד שגוי. נסה/י שוב.',
  CODE_EXPIRED: 'פג תוקף הקוד. שלח/י קוד חדש.',

  // request-specific errors
  DUPLICATE_REQUEST:    'כבר שלחת בקשה פעילה למנטור/ית זה/זו. המתן/י לתגובה לפני שליחת בקשה חדשה.',
  MENTOR_UNAVAILABLE:   'המנטור/ית אינ/ה פנוי/ה כרגע לקבלת בקשות חדשות.',
  FIELD_TOO_LONG:       'אחד מהשדות ארוך מדי. נושא מוגבל ל-200 תווים, תיאור ל-2000 תווים.',

  // general API errors
  NOT_FOUND: 'הפריט המבוקש לא נמצא.',
  FORBIDDEN: 'אין לך הרשאה לבצע פעולה זו.',
  INTERNAL_ERROR: 'אירעה שגיאה בשרת. אנא נסה/י שוב מאוחר יותר.',

  // admin-specific
  ADMIN_PENDING_APPROVAL: 'החשבון ממתין לאישור. פנה/י למנהל המערכת.',

  // network / timeout
  NETWORK_ERROR: 'לא ניתן להתחבר לשרת. ודא/י שהשרת פועל ונסה/י שוב.',
  TIMEOUT: 'הבקשה ארכה יותר מדי זמן. אנא נסה/י שוב.',
};

// Re-export from utils so files that already import errors.js can get escapeHtml here
export { escapeHtml } from './utils.js';

export function getErrorMessage(code) {
  return AUTH_ERROR_MESSAGES[code] || null;
}

export function describeAuthError(err) {
  return AUTH_ERROR_MESSAGES[err?.code] || err?.message || 'אירעה שגיאה. נסו שוב.';
}

export function showFormMessage(el, text, isError) {
  el.classList.remove('d-none', 'alert-success', 'alert-danger', 'd-flex', 'align-items-center', 'gap-2');
  el.classList.add('d-flex', 'align-items-center', 'gap-2', isError ? 'alert-danger' : 'alert-success');

  const span = document.createElement('span');
  span.className = 'flex-grow-1';
  span.textContent = text;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn-close flex-shrink-0';
  btn.setAttribute('aria-label', 'סגור');
  btn.addEventListener('click', () => {
    el.classList.add('d-none');
    el.classList.remove('d-flex', 'align-items-center', 'gap-2');
  });

  el.replaceChildren(span, btn);
}
