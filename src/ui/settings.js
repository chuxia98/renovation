import { setLang, getLang } from '../i18n.js';
import { applyGlossyEnv } from '../furniture.js';
import { applyModelEnv } from '../models.js';
import { scene, envTexture } from '../core/scene.js';

const ENV_KEY = 'hourse-env-v1';

const settingsBtn = document.getElementById('btn-settings');
const settingsPanel = document.getElementById('settings-panel');
const langSelect = document.getElementById('lang-select');
const envToggle = document.getElementById('env-toggle');

export function initSettings({ daylightLights, glossyMaterials }) {
  function applyEnvLight(on) {
    // 关掉环境光只影响天空补光与反射，窗外天空保持不变
    scene.environment = on ? envTexture : null;
    for (const light of daylightLights) light.visible = on;
    for (const mat of glossyMaterials) {
      mat.envMap = on ? envTexture : null;
      mat.needsUpdate = true;
    }
    applyGlossyEnv(on ? envTexture : null);
    applyModelEnv(on ? envTexture : null);
  }

  settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    settingsPanel.classList.toggle('hidden');
  });

  envToggle.checked = localStorage.getItem(ENV_KEY) !== 'off';
  applyEnvLight(envToggle.checked);
  envToggle.addEventListener('change', () => {
    applyEnvLight(envToggle.checked);
    localStorage.setItem(ENV_KEY, envToggle.checked ? 'on' : 'off');
  });

  langSelect.addEventListener('change', () => setLang(langSelect.value));

  document.addEventListener('pointerdown', (e) => {
    if (settingsPanel.classList.contains('hidden')) return;
    if (e.target.closest('#settings')) return;
    settingsPanel.classList.add('hidden');
  });

  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Escape' || settingsPanel.classList.contains('hidden')) return;
    e.stopImmediatePropagation();
    e.preventDefault();
    settingsPanel.classList.add('hidden');
  }, { capture: true });
}

export function renderLangSelect() {
  langSelect.value = getLang();
}