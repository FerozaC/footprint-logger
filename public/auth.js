// Shared auth helpers for signin.html and register.html
async function apiLogin(email, password) {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

async function apiRegister(username, email, password) {
  const res = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

// Called by signin.html
async function handleLoginClick(emailElId, passElId) {
  const email = document.getElementById(emailElId).value;
  const password = document.getElementById(passElId).value;
  if (!email || !password) return alert('All fields are required');

  try {
    const { ok, data } = await apiLogin(email, password);
    if (ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
      window.location.href = 'index.html';
    } else {
      alert(data.message || 'Login failed');
    }
  } catch (err) {
    console.error(err);
    alert('Server error. Please try again.');
  }
}

// Called by register.html — performs registration then auto-login by calling /api/login
async function handleRegisterClick(usernameElId, emailElId, passElId) {
  const username = document.getElementById(usernameElId).value;
  const email = document.getElementById(emailElId).value;
  const password = document.getElementById(passElId).value;
  if (!username || !email || !password) return alert('All fields are required');

  try {
    const { ok, data } = await apiRegister(username, email, password);
    if (ok) {
      // Auto-login after successful registration
      const loginResult = await apiLogin(email, password);
      if (loginResult.ok) {
        localStorage.setItem('token', loginResult.data.token);
        localStorage.setItem('username', loginResult.data.username);
        window.location.href = 'index.html';
      } else {
        alert('Registered successfully. Please sign in.');
        window.location.href = 'signin.html';
      }
    } else {
      alert(data.message || 'Registration failed');
    }
  } catch (err) {
    console.error(err);
    alert('Server error. Please try again.');
  }
}
