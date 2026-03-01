const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

const form = document.getElementById('waitlist-form');
const msg = document.getElementById('form-msg');

if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email')?.value?.trim();
    if (!email) return;
    if (msg) msg.textContent = `Thanks! We'll notify ${email} when LunchCrew opens.`;
    form.reset();
  });
}
