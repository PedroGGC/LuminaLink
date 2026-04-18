const form = document.getElementById('unlockForm');
if (form) {
  const shortCode = form.dataset.shortCode;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('password').value;
    try {
      const res = await fetch('/api/links/' + shortCode + '/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (res.ok) {
        window.location.href = '/' + shortCode;
      } else {
        const data = await res.json();
        document.getElementById('error').textContent = data.error || 'Senha incorreta';
      }
    } catch (err) {
      document.getElementById('error').textContent = 'Erro ao desbloquear';
    }
  });
}