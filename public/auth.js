async function apiLogin(email, password) {
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

async function apiRegister(username, email, password) {
  const res = await fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

async function handleLoginClick(emailElId, passElId) {
  const email = document.getElementById(emailElId).value;
  const password = document.getElementById(passElId).value;
  if (!email || !password) return alert("All fields are required");

  try {
    const { ok, data } = await apiLogin(email, password);
    if (ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.username);
      return { ok: true, data };
    } else {
      return { ok: false, data };
    }
  } catch (err) {
    console.error(err);
    return { ok: false, data: { message: "Server error" } };
  }
}

async function handleRegisterClick(usernameElId, emailElId, passElId) {
  const username = document.getElementById(usernameElId).value;
  const email = document.getElementById(emailElId).value;
  const password = document.getElementById(passElId).value;
  if (!username || !email || !password) return alert("All fields are required");

  try {
    const { ok, data } = await apiRegister(username, email, password);
    if (ok) {
      const loginResult = await apiLogin(email, password);
      if (loginResult.ok) {
        localStorage.setItem("token", loginResult.data.token);
        localStorage.setItem("username", loginResult.data.username);
        return { ok: true, data: loginResult.data };
      } else {
        return { ok: false, data: { message: "Registered. Please sign in." } };
      }
    } else {
      return { ok: false, data };
    }
  } catch (err) {
    console.error(err);
    return { ok: false, data: { message: "Server error" } };
  }
}
