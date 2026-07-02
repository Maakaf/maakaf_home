export function showErrorPopup(message) {
  const backdrop = document.createElement('div');
  backdrop.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:9998;cursor:pointer;`;

  const el = document.createElement('div');
  el.dir = 'rtl';
  el.style.cssText = `position:fixed;top:24px;left:50%;transform:translateX(-50%);z-index:9999;min-width:300px;max-width:90vw;`;

  const alert = document.createElement('div');
  alert.className = 'alert alert-danger shadow mb-0 d-flex align-items-center gap-3';

  const span = document.createElement('span');
  span.className = 'flex-grow-1';
  span.textContent = message;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn-close flex-shrink-0';
  btn.setAttribute('aria-label', 'סגור');

  function dismiss() { backdrop.remove(); el.remove(); }
  btn.addEventListener('click', dismiss);
  backdrop.addEventListener('click', dismiss);

  alert.append(span, btn);
  el.appendChild(alert);
  document.body.appendChild(backdrop);
  document.body.appendChild(el);
}

export function showBlockingMessage(message) {
  const backdrop = document.createElement('div');
  backdrop.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 9998;
  `;

  const el = document.createElement('div');
  el.dir = 'rtl';
  el.style.cssText = `
    position: fixed;
    top: 24px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    min-width: 280px;
    max-width: 90vw;
  `;

  const alert = document.createElement('div');
  alert.className = 'alert alert-success shadow mb-0';
  alert.textContent = message;

  el.appendChild(alert);
  document.body.appendChild(backdrop);
  document.body.appendChild(el);

  return function dismiss() {
    backdrop.remove();
    el.remove();
  };
}

export function showToast(message, then) {
  const el = document.createElement('div');
  el.dir = 'rtl';
  el.style.cssText = `
    position: fixed;
    top: 24px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    min-width: 280px;
    max-width: 90vw;
    pointer-events: auto;
  `;
  const alert = document.createElement('div');
  alert.className = 'alert alert-success shadow mb-0 d-flex align-items-center gap-3';

  const span = document.createElement('span');
  span.className = 'flex-grow-1';
  span.textContent = message;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn-close flex-shrink-0';
  btn.setAttribute('aria-label', 'סגור');

  alert.append(span, btn);
  el.appendChild(alert);

  document.body.appendChild(el);

  function dismiss() {
    el.remove();
    then();
  }

  btn.addEventListener('click', dismiss);
  setTimeout(dismiss, 4000);
}
