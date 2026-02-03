// frontend/js/signup.js
document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = form.querySelector('input[type="text"]').value.trim();
      const password = form.querySelector('input[type="password"]').value.trim();
      // Determine userType from checkboxes/radios: prefer radio values 'individual'/'organization'
      const individual = form.querySelector('input[type="checkbox"][value="Individual"]');
      const organization = form.querySelector('input[type="checkbox"][value="Organization"]');
      // If your signup uses radio, use that. We'll check radios first.
      let userType = 'INDIVIDUAL';
      const radio = form.querySelector('input[name="userType"]:checked');
      if (radio) userType = radio.value.toUpperCase();
      else if (organization && organization.checked) userType = 'COMPANY';
      else if (individual && individual.checked) userType = 'INDIVIDUAL';
  
      try {
        const res = await fetch('http://localhost:3000/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, userType })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Signup failed');
  
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('userType', userType);
  
        if (userType === 'INDIVIDUAL') window.location.href = 'C:/Users/Administrator/Desktop/labAder/labAder/frontend/individual_registration.html';
        else window.location.href = 'C:/Users/Administrator/Desktop/labAder/labAder/frontend/organization_registration.html';
      } catch (err) {
        alert('Signup error: ' + err.message);
      }
    });
  });
  