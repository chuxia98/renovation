const toastEl = document.getElementById('toast');
let toastTimer = 0;

export function toast(msg, warn = false) {
  toastEl.textContent = msg;
  toastEl.classList.remove('hidden');
  toastEl.classList.toggle('warn', warn);
  requestAnimationFrame(() => toastEl.classList.add('show'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove('show');
    setTimeout(() => toastEl.classList.add('hidden'), 220);
  }, 1800);
}