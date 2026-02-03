// frontend/js/resetp.js
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  if (!form) return;

  // Read token & email from URL: ResetP.html?email=...&token=...
  const params = new URLSearchParams(window.location.search);
  const email = params.get('email');
  const token = params.get('token');

  if (!email || !token) {
    alert('Invalid or missing password reset link.');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const newPassword = form.querySelector('input[placeholder="New password"]').value.trim();
    const rePassword = form.querySelector('input[placeholder="Re-enter new password"]').value.trim();

    if (!newPassword || !rePassword) {
      alert('Please fill in all fields');
      return;
    }

    if (newPassword !== rePassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      const resp = await fetch('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          token,
          newPassword
        })
      });

      const data = await resp.json();

      if (!resp.ok) {
        alert(data.error || 'Password reset failed');
        return;
      }

      alert('Password reset successful. Please log in.');
      window.location.href = 'LogIn.html';

    } catch (err) {
      console.error(err);
      alert('Network error. Please try again.');
    }
  });
});
