export function initTouchControls({ controls, isTouch, enterBuild, rotateGhost, ctx }) {
  const buildFab = document.getElementById('build-fab');
  const joystickEl = document.getElementById('joystick');
  const joystickKnob = document.getElementById('joystick-knob');

  document.getElementById('btn-rotate').addEventListener('click', rotateGhost);

  if (!isTouch) return;

  buildFab.classList.remove('hidden');
  buildFab.addEventListener('click', () => {
    enterBuild();
  });

  joystickEl.classList.remove('hidden');
  const JOY_RADIUS = 44;
  let joyId = null;

  const moveJoystick = (e) => {
    const rect = joystickEl.getBoundingClientRect();
    let dx = e.clientX - (rect.left + rect.width / 2);
    let dy = e.clientY - (rect.top + rect.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > JOY_RADIUS) {
      dx = (dx / len) * JOY_RADIUS;
      dy = (dy / len) * JOY_RADIUS;
    }
    joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
    controls.setTouchInput(dx / JOY_RADIUS, -dy / JOY_RADIUS);
  };

  joystickEl.addEventListener('pointerdown', (e) => {
    if (joyId !== null) return;
    joyId = e.pointerId;
    joystickEl.setPointerCapture(e.pointerId);
    moveJoystick(e);
  });
  joystickEl.addEventListener('pointermove', (e) => {
    if (e.pointerId === joyId) moveJoystick(e);
  });
  ctx.resetJoystick = () => {
    joyId = null;
    joystickKnob.style.transform = 'translate(0, 0)';
    controls.setTouchInput(0, 0);
  };
  const endJoystick = (e) => {
    if (e.pointerId !== joyId) return;
    ctx.resetJoystick();
  };
  joystickEl.addEventListener('pointerup', endJoystick);
  joystickEl.addEventListener('pointercancel', endJoystick);
}