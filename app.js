const STANDARD = 14;
const SCHEDULE_ADJUSTMENT = 0.053;
const LOGIN_USER = 'CVC';
const LOGIN_PASSWORD = 'Lluvias';
const SECURITY_KEY = 'CLIMA';

let records = [];
let pendingRecord = null;
let selectedPhoto = null;

const $ = (selector) => document.querySelector(selector);
const views = { login: $('#login-view'), app: $('#app-view'), register: $('#register-view'), result: $('#result-view'), dashboard: $('#dashboard-view') };

function showView(view) {
  Object.values(views).forEach((element) => element.classList.add('hidden'));
  view.classList.remove('hidden');
  if (view === views.app) views.app.classList.remove('hidden');
}

function showAppView(view) {
  views.app.classList.remove('hidden');
  [views.register, views.result, views.dashboard].forEach((element) => element.classList.add('hidden'));
  view.classList.remove('hidden');
}

function formatNumber(value) {
  return new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function durationInHours(start, end) {
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);
  let startTotal = startHour * 60 + startMinute;
  let endTotal = endHour * 60 + endMinute;
  if (endTotal < startTotal) endTotal += 24 * 60;
  return (endTotal - startTotal) / 60;
}

function isAdjustmentTime(start) {
  const [hour, minute] = start.split(':').map(Number);
  const totalMinutes = hour * 60 + minute;
  return totalMinutes >= 15 * 60 && totalMinutes <= 18 * 60;
}

function normalizeAddress(address) {
  return address.trim().toLowerCase().replace(/\s+/g, ' ');
}

function isDuplicateRecord(candidate) {
  return records.some((record) =>
    normalizeAddress(record.address) === normalizeAddress(candidate.address)
    && record.start === candidate.start
    && record.end === candidate.end
  );
}

function classification(rainfall) {
  if (rainfall > STANDARD) return { label: 'Sobre el estándar', className: 'high', color: '#117d8e' };
  if (rainfall < STANDARD) return { label: 'Bajo el estándar', className: 'low', color: '#90c4d0' };
  return { label: 'En el estándar', className: 'low', color: '#90c4d0' };
}

function clearForm() {
  $('#rain-form').reset();
  selectedPhoto = null;
  $('#photo-status').textContent = 'Sin foto capturada';
  $('#form-error').textContent = '';
  $('#schedule-message').textContent = 'El ajuste se calcula al registrar el evento.';
  $('#schedule-marker').style.left = '47%';
}

function updateSchedulePreview() {
  const start = $('#rain-start').value;
  if (!start) return;
  const [hour, minute] = start.split(':').map(Number);
  const position = Math.max(0, Math.min(100, ((hour * 60 + minute - 12 * 60) / (9 * 60)) * 100));
  $('#schedule-marker').style.left = `${position}%`;
  $('#schedule-message').textContent = isAdjustmentTime(start)
    ? `Inicio ${start}, dentro del rango. Se aplicará el ajuste de 5,3 %.`
    : `Inicio ${start}, sin ajuste por horario.`;
}

function renderResult(record) {
  const duration = durationInHours(record.start, record.end);
  const base = record.rainfall * STANDARD * duration;
  const adjustment = isAdjustmentTime(record.start) ? base * SCHEDULE_ADJUSTMENT : 0;
  const total = base + adjustment;
  const result = classification(record.rainfall);
  const difference = Math.abs(record.rainfall - STANDARD);
  const percent = (record.rainfall / STANDARD) * 100;

  $('#result-zone').textContent = record.address;
  $('#result-meta').textContent = `${record.start} a ${record.end} · Registró: ${record.operator}`;
  $('#result-summary').className = `result-summary ${result.className}`;
  $('#result-rainfall').textContent = `${record.rainfall} mm`;
  $('#result-comparison').textContent = record.rainfall === STANDARD
    ? 'En el estándar de Cali'
    : `${difference} mm ${record.rainfall > STANDARD ? 'por encima' : 'por debajo'} del estándar`;
  $('#result-percent').textContent = `${Math.round(percent)} % del estándar de Cali (14 mm)`;
  $('#detail-rainfall').textContent = `${record.rainfall} mm`;
  $('#detail-duration').textContent = `${formatNumber(duration)} h`;
  $('#detail-formula-label').textContent = `${record.rainfall} × 14 × ${formatNumber(duration)}`;
  $('#detail-base').textContent = formatNumber(base);
  $('#detail-adjustment').textContent = isAdjustmentTime(record.start) ? `Ajuste horario +5,3 % (inicio ${record.start})` : 'Ajuste horario';
  $('#detail-adjustment-value').textContent = `+${formatNumber(adjustment)}`;
  $('#adjustment-row').classList.toggle('hidden', adjustment === 0);
  $('#detail-total').textContent = formatNumber(total);
}

function renderDashboard() {
  const chart = $('#chart');
  const saved = $('#saved-records');
  const photoPreview = $('#photo-preview');

  if (records.length === 0) {
    chart.innerHTML = '<p class="chart-empty">No hay registros todavía. Registra una zona para verla aquí.</p>';
    saved.innerHTML = '<p class="muted">Todavía no has registrado ninguna zona.</p>';
    photoPreview.innerHTML = '<span class="camera-icon">▣</span><span>Sin foto registrada</span>';
    return;
  }

  const max = Math.max(35, ...records.map((record) => record.rainfall));
  chart.style.setProperty('--standard-position', `${(STANDARD / max) * 100}%`);
  chart.innerHTML = records.map((record) => {
    const height = (record.rainfall / max) * 100;
    const result = classification(record.rainfall);
    return `<div class="bar-item"><strong class="bar-value" style="--height:${height}%">${record.rainfall}</strong><div class="bar ${result.className}" style="height:${height}%" title="${record.address}: ${record.rainfall} mm"></div><span class="bar-label">${record.address}</span></div>`;
  }).join('');

  saved.innerHTML = records.map((record) => {
    const duration = durationInHours(record.start, record.end);
    const base = record.rainfall * STANDARD * duration;
    const adjustment = isAdjustmentTime(record.start) ? base * SCHEDULE_ADJUSTMENT : 0;
    const total = base + adjustment;
    const result = classification(record.rainfall);
    return `<div class="saved-record"><span>${record.address}</span><strong>${record.rainfall} mm</strong><small class="status-${result.className}">${result.label} · ${record.start} a ${record.end}</small><small>${record.rainfall} × 14 × ${formatNumber(duration)} h = ${formatNumber(base)}${adjustment > 0 ? ` · Ajuste +5,3 %: +${formatNumber(adjustment)}` : ''}</small><small class="record-total">Total: ${formatNumber(total)}</small></div>`;
  }).join('');

  const latest = records.at(-1);
  photoPreview.innerHTML = latest?.photo
    ? `<img src="${latest.photo}" alt="Foto de ${latest.address}" />`
    : '<span class="camera-icon">▣</span><span>Sin foto para mostrar</span>';
}

function readPhoto(file, callback) {
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result));
  reader.readAsDataURL(file);
}

$('#login-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const user = $('#login-user').value.trim();
  const password = $('#login-password').value;
  if (user === LOGIN_USER && password === LOGIN_PASSWORD) {
    views.login.classList.add('hidden');
    showAppView(views.register);
    return;
  }
  $('#login-error').textContent = 'Usuario o contraseña incorrectos.';
});

$('#logout-button').addEventListener('click', () => {
  views.app.classList.add('hidden');
  views.login.classList.remove('hidden');
  $('#login-form').reset();
  $('#login-error').textContent = '';
  showView(views.login);
});

$('#rain-start').addEventListener('input', updateSchedulePreview);
$('#clear-button').addEventListener('click', clearForm);
$('#photo-input').addEventListener('change', (event) => readPhoto(event.target.files[0], (photo) => { selectedPhoto = photo; $('#photo-status').textContent = 'Foto lista para adjuntar'; }));

$('#rain-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const start = formData.get('start');
  const end = formData.get('end');
  if (durationInHours(start, end) === 0) { $('#form-error').textContent = 'La hora de fin debe ser diferente a la de inicio.'; return; }
  const candidate = { address: formData.get('address').trim(), start, end, rainfall: Number(formData.get('rainfall')), operator: formData.get('operator').trim(), photo: selectedPhoto };
  if (isDuplicateRecord(candidate)) { $('#form-error').textContent = 'Ya existe un registro para esta dirección con el mismo horario.'; return; }
  pendingRecord = candidate;
  renderResult(pendingRecord);
  showAppView(views.result);
  let elapsed = 0;
  const timer = setInterval(() => { elapsed += 1; $('#clock-counter').textContent = `00:0${Math.min(elapsed, 3)} / 00:03`; if (elapsed >= 3) clearInterval(timer); }, 1000);
});

$('#finish-button').addEventListener('click', () => { $('#security-key').value = ''; $('#security-error').textContent = ''; $('#security-modal').classList.remove('hidden'); $('#security-key').focus(); });
$('#cancel-security').addEventListener('click', () => $('#security-modal').classList.add('hidden'));
$('#confirm-security').addEventListener('click', () => {
  if ($('#security-key').value === SECURITY_KEY) {
    if (isDuplicateRecord(pendingRecord)) {
      $('#security-error').textContent = 'Ya existe un registro para esta dirección con el mismo horario.';
      return;
    }
    records.push(pendingRecord);
    pendingRecord = null;
    $('#security-modal').classList.add('hidden');
    clearForm();
    renderDashboard();
    showAppView(views.dashboard);
  } else {
    $('#security-error').textContent = 'Clave incorrecta. Serás devuelto al inicio de sesión.';
    setTimeout(() => { $('#security-modal').classList.add('hidden'); views.app.classList.add('hidden'); views.login.classList.remove('hidden'); showView(views.login); }, 1000);
  }
});
$('#new-record-button').addEventListener('click', () => { clearForm(); showAppView(views.register); });
$('#view-records-button').addEventListener('click', () => { renderDashboard(); showAppView(views.dashboard); });
$('#dashboard-photo-input').addEventListener('change', (event) => readPhoto(event.target.files[0], (photo) => { const latest = records.at(-1); if (latest) latest.photo = photo; renderDashboard(); }));

renderDashboard();
