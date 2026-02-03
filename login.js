// frontend/js/login.js
// Attach this to LogIn.html (add <script src="js/login.js"></script>)
document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = form.querySelector('input[type="text"]').value.trim();
      const password = form.querySelector('input[type="password"]').value.trim();
      const userType = form.querySelector('input[name="userType"]:checked')?.value || 'INDIVIDUAL';
  
      try {
        const res = await fetch('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');
  
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('userType', data.userType);
  
        // redirect based on userType; if profile not completed, you may check profile endpoint
        if (data.userType === 'INDIVIDUAL') {
          window.location.href = 'individual_registration.html';
        } else {
          window.location.href = 'organization_registration.html';
        }
      } catch (err) {
        alert('Login error: ' + err.message);
      }
    });
  });
  