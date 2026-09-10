// passwordeeri — login page script

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector("button");
  const errEl = document.getElementById("error-msg");
  const data = { username: form.username.value, password: form.password.value };
  btn.disabled = true;
  btn.textContent = "Signing in...";
  errEl.style.display = "none";
  try {
    const res = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) { window.location.href = "/dashboard"; return; }
    const body = await res.json();
    errEl.textContent = body.error || "Login failed";
    errEl.style.display = "block";
  } catch {
    errEl.textContent = "Network error";
    errEl.style.display = "block";
  }
  btn.disabled = false;
  btn.textContent = "Log in";
});