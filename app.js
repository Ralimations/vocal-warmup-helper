const state = {
  routine: JSON.parse(localStorage.getItem('vocal-warmup-routine') || '[true,true,true,false,false,false]'),
  currentView: 'dashboard',
};

const views = [...document.querySelectorAll('.view')];
const navItems = [...document.querySelectorAll('[data-view]')];
const toast = document.querySelector('#toast');

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('is-visible'), 3000);
}

function changeView(view) {
  const next = document.querySelector(`#${view}-view`);
  if (!next) return;
  state.currentView = view;
  views.forEach((item) => item.classList.toggle('is-visible', item === next));
  navItems.forEach((item) => item.classList.toggle('is-active', item.dataset.view === view));
  document.querySelector('#breadcrumb-view').textContent = view[0].toUpperCase() + view.slice(1);
  document.querySelector('.sidebar')?.classList.remove('is-open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

navItems.forEach((item) => item.addEventListener('click', () => changeView(item.dataset.view)));
document.querySelector('.mobile-menu').addEventListener('click', () => document.querySelector('.sidebar').classList.toggle('is-open'));

function updateRoutineProgress() {
  const checked = state.routine.filter(Boolean).length;
  const minutes = [3, 5, 5, 5, 7, 5].reduce((total, min, index) => total + (state.routine[index] ? min : 0), 0);
  const percent = Math.round((minutes / 30) * 100);
  document.querySelectorAll('.routine-item').forEach((item, index) => {
    item.classList.toggle('is-complete', state.routine[index]);
    item.querySelector('input').checked = state.routine[index];
  });
  document.querySelector('#routine-progress-label').textContent = `${minutes} / 30 min completed`;
  document.querySelector('#routine-progress-percent').textContent = `${percent}%`;
  document.querySelector('#routine-progress-bar').style.width = `${percent}%`;
  if (checked === 6) showToast('Routine complete — beautifully done.');
  localStorage.setItem('vocal-warmup-routine', JSON.stringify(state.routine));
}

document.querySelectorAll('.routine-item').forEach((item, index) => {
  item.addEventListener('click', (event) => {
    event.preventDefault();
    state.routine[index] = !state.routine[index];
    updateRoutineProgress();
  });
});

function openModal(id) {
  const modal = document.querySelector(`#${id}`);
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  modal.querySelector('.modal-close')?.focus();
}
function closeModal(modal) {
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
}
document.querySelectorAll('[data-close-modal]').forEach((button) => button.addEventListener('click', () => closeModal(button.closest('.modal-backdrop'))));
document.querySelectorAll('.modal-backdrop').forEach((backdrop) => backdrop.addEventListener('click', (event) => { if (event.target === backdrop) closeModal(backdrop); }));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') document.querySelectorAll('.modal-backdrop.is-open').forEach(closeModal); });

document.querySelector('#start-practice').addEventListener('click', () => openModal('practice-modal'));
document.querySelector('#start-practice-alt').addEventListener('click', () => openModal('practice-modal'));
document.querySelector('#practice-start-button').addEventListener('click', () => openModal('practice-modal'));

function openProfileGenerator() { openModal('profile-modal'); }
document.querySelector('#share-profile-top').addEventListener('click', openProfileGenerator);
document.querySelector('#share-profile-bottom').addEventListener('click', openProfileGenerator);
document.querySelectorAll('.generator-controls label').forEach((label) => label.addEventListener('click', () => setTimeout(() => {
  const checked = document.querySelectorAll('.generator-controls label input:checked').length;
  document.querySelector('.control-heading span').textContent = `${checked} selected`;
}, 0)));
document.querySelectorAll('.format-choice').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.format-choice').forEach((choice) => choice.classList.remove('is-active'));
  button.classList.add('is-active');
  showToast(`${button.textContent} format selected`);
}));

function downloadProfileCard() {
  const canvas = document.createElement('canvas');
  canvas.width = 1080; canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 1080, 1080);
  gradient.addColorStop(0, '#21123c'); gradient.addColorStop(.6, '#10162f'); gradient.addColorStop(1, '#07102a');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 1080, 1080);
  const glow = ctx.createRadialGradient(190, 120, 10, 190, 120, 470);
  glow.addColorStop(0, 'rgba(220,120,255,.32)'); glow.addColorStop(1, 'rgba(220,120,255,0)');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, 1080, 600);
  ctx.strokeStyle = '#a96bfa'; ctx.lineWidth = 5; ctx.strokeRect(32, 32, 1016, 1016);
  ctx.fillStyle = '#c59cff'; ctx.font = '600 24px Arial'; ctx.letterSpacing = '4px'; ctx.fillText('VOCAL WARMUP  ✦', 80, 92);
  ctx.beginPath(); ctx.arc(540, 260, 95, 0, Math.PI * 2); ctx.fillStyle = '#7645bb'; ctx.fill(); ctx.strokeStyle = '#d29bff'; ctx.lineWidth = 6; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = '700 82px Arial'; ctx.textAlign = 'center'; ctx.fillText('R', 540, 288);
  ctx.fillStyle = '#f6f0ff'; ctx.font = '700 58px Arial'; ctx.fillText('Ralskies', 540, 430);
  ctx.fillStyle = '#b67bff'; ctx.font = '500 27px Arial'; ctx.fillText('Soprano  ·  Musical theatre / cover vocalist', 540, 478);
  ctx.strokeStyle = 'rgba(214,177,255,.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(110, 555); ctx.lineTo(970, 555); ctx.stroke();
  ctx.fillStyle = '#8d91aa'; ctx.font = '600 19px Arial'; ctx.fillText('CONFIRMED RANGE', 540, 620);
  ctx.fillStyle = '#fff'; ctx.font = '700 68px Arial'; ctx.fillText('G2  —  G4', 540, 700);
  const range = ctx.createLinearGradient(180, 0, 900, 0); range.addColorStop(0, '#be74ff'); range.addColorStop(1, '#6b9eff');
  ctx.fillStyle = range; ctx.fillRect(180, 750, 720, 8);
  ctx.fillStyle = '#d3b3ff'; ctx.font = '600 31px Arial'; ctx.fillText('2 OCTAVES', 540, 835);
  ctx.fillStyle = '#aeb4c6'; ctx.font = '500 22px Arial'; ctx.fillText('25 practice sessions   ·   10 day streak   ·   92% accuracy', 540, 905);
  ctx.fillStyle = '#7e8099'; ctx.font = '500 17px Arial'; ctx.fillText('Private. Powerful. Personal.', 540, 985);
  const link = document.createElement('a'); link.download = 'ralskies-singer-profile.png'; link.href = canvas.toDataURL('image/png'); link.click();
  showToast('Singer card downloaded as PNG');
}
document.querySelector('#download-card').addEventListener('click', downloadProfileCard);

document.querySelector('#privacy-details').addEventListener('click', () => showToast('Your microphone audio is processed locally and never uploaded.'));
document.querySelector('#edit-profile').addEventListener('click', () => showToast('Profile editing is ready for your next pass.'));
document.querySelector('#export-data').addEventListener('click', () => {
  const backup = { profile: { displayName: 'Ralskies', voiceType: 'Soprano', confirmedRange: 'G2 – G4' }, routine: state.routine, exportedAt: new Date().toISOString() };
  const link = document.createElement('a'); link.download = 'vocal-warmup-backup.json'; link.href = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })); link.click(); URL.revokeObjectURL(link.href); showToast('Local backup exported');
});
document.querySelector('#clear-data').addEventListener('click', () => { if (confirm('Clear saved routine progress from this device?')) { localStorage.removeItem('vocal-warmup-routine'); state.routine = [false, false, false, false, false, false]; updateRoutineProgress(); showToast('Local routine progress cleared'); } });

updateRoutineProgress();
document.querySelector('.control-heading span').textContent = '4 selected';
document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') openModal('practice-modal');
});
