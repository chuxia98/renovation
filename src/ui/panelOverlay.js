const body = document.body;
const buildbar = document.getElementById('buildbar');
const stylePanel = document.getElementById('style-panel');
const schemePanel = document.getElementById('scheme-panel');

// 弹窗高度随底栏顶部位置钳制，避免矮屏/横屏时面板顶部被裁切
export function syncPanelOverlay() {
  const open = !stylePanel.classList.contains('hidden') || !schemePanel.classList.contains('hidden');
  body.classList.toggle('panel-open', open);
  if (!open) return;
  const avail = Math.max(120, buildbar.getBoundingClientRect().top - 18);
  stylePanel.style.maxHeight = `${Math.min(440, avail)}px`;
  schemePanel.style.maxHeight = `${Math.min(320, avail)}px`;
}

new ResizeObserver(syncPanelOverlay).observe(buildbar);