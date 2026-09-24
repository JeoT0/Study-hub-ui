const rooms = [
  { grade: "Grade 7", icon: "✦", name: "New beginnings", description: "Build strong foundations together.", accent: "#d7f3eb", dark: "#287c68" },
  { grade: "Grade 8", icon: "◈", name: "Keep exploring", description: "Discover ideas that spark curiosity.", accent: "#e5dcff", dark: "#7054bd" },
  { grade: "Grade 9", icon: "⌁", name: "Level up", description: "Challenge yourself and grow.", accent: "#d5eafd", dark: "#3675a9" },
  { grade: "Grade 10", icon: "✺", name: "Find your focus", description: "Turn goals into real progress.", accent: "#ffe7c9", dark: "#b76f21" },
  { grade: "Grade 11", icon: "↗", name: "Go further", description: "Make every lesson count.", accent: "#ffdce8", dark: "#b74c76" },
  { grade: "Grade 12", icon: "⌘", name: "Your next chapter", description: "Prepare for what's ahead.", accent: "#d7e8e7", dark: "#397978" }
];

const activities = [
  { month: "OCT", date: "15", title: "Mathematics Quiz", detail: "Grade 10 · 10:00 AM", tag: "Assessment", color: "#edebff", text: "#6558ce" },
  { month: "OCT", date: "18", title: "Science Reporting", detail: "Grade 8 · 01:30 PM", tag: "Presentation", color: "#e1f5ee", text: "#34866e" },
  { month: "OCT", date: "20", title: "English Presentation", detail: "Grade 11 · 09:00 AM", tag: "Project", color: "#fff0dc", text: "#bd762e" }
];

const roomGrid = document.querySelector("#room-grid");
const activityGrid = document.querySelector("#activity-grid");
const authRoot = document.querySelector("#auth-root");
let signedInUser = null;

function renderRooms(items) {
  roomGrid.innerHTML = items.map((room) => `
    <article class="room-card" style="--accent:${room.accent};--accent-dark:${room.dark}">
      <div class="room-top"><span class="room-icon">${room.icon}</span><span class="room-grade">${room.grade}</span></div>
      <h3>${room.name}</h3><p>${room.description}</p><a class="room-link" href="#activities">Enter room <span aria-hidden="true">→</span></a>
    </article>
  `).join("");
}

function renderActivities() {
  activityGrid.innerHTML = activities.map((activity) => `
    <article class="activity-card">
      <div class="date-tile" style="--date-bg:${activity.color};--date-color:${activity.text}"><strong>${activity.date}</strong><span>${activity.month}</span></div>
      <div><h3>${activity.title}</h3><p>${activity.detail}</p><span class="activity-tag" style="--date-bg:${activity.color};--date-color:${activity.text}">${activity.tag}</span></div>
    </article>
  `).join("");
}

renderRooms(rooms);
renderActivities();

function showAuth(error = "") {
  document.body.classList.add("auth-mode");
  document.querySelector(".site-header").hidden = true;
  document.querySelector("main").hidden = true;
  document.querySelector(".mobile-nav").hidden = true;
  authRoot.hidden = false;
  authRoot.innerHTML = `
    <main class="auth-card" aria-labelledby="auth-title">
      <a class="brand auth-brand" href="/login"><span class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></span><span>Study<span>Hub</span></span></a>
      <p class="section-kicker">Your learning space</p>
      <h1 id="auth-title">Welcome back</h1>
      <p class="auth-subtitle">Sign in to continue learning with your community.</p>
      <div class="auth-error" role="alert" ${error ? "" : "hidden"}>${error}</div>
      <form id="login-form" class="auth-form">
        <label>Email address<input name="email" type="email" autocomplete="email" required placeholder="you@example.com"></label>
        <label>Password<input name="password" type="password" autocomplete="current-password" minlength="8" required placeholder="At least 8 characters"></label>
        <button class="primary-button" type="submit">Login</button>
      </form>
      <div class="auth-links"><button type="button" data-auth="register">Register</button><button type="button" data-auth="forgot">Forgot password?</button></div>
      <p class="auth-status" aria-live="polite"></p>
    </main>`;
  document.querySelector("#login-form").addEventListener("submit", submitLogin);
  document.querySelector("[data-auth=register]").addEventListener("click", showRegister);
  document.querySelector("[data-auth=forgot]").addEventListener("click", showForgot);
}

function showRegister() {
  const card = document.querySelector(".auth-card");
  card.querySelector("#auth-title").textContent = "Create your account";
  card.querySelector(".auth-subtitle").textContent = "Join your grade room and start learning together.";
  card.querySelector("#login-form").innerHTML = `<label>Your name<input name="name" required minlength="2" placeholder="Alex Morgan"></label><label>Email address<input name="email" type="email" autocomplete="email" required placeholder="you@example.com"></label><label>Password<input name="password" type="password" autocomplete="new-password" minlength="8" required placeholder="At least 8 characters"></label><button class="primary-button" type="submit">Register</button>`;
  card.querySelector("#login-form").removeEventListener("submit", submitLogin);
  card.querySelector("#login-form").addEventListener("submit", submitRegister);
  card.querySelector("[data-auth=register]").textContent = "Back to login";
  card.querySelector("[data-auth=register]").onclick = () => showAuth();
}

function showForgot() {
  const error = document.querySelector(".auth-error");
  error.hidden = false;
  error.textContent = "Password recovery is not enabled yet. Contact an administrator.";
}

async function submitAuth(form, endpoint) {
  const status = document.querySelector(".auth-status");
  status.textContent = "Please wait...";
  try {
    const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Request failed.");
    window.location.href = result.user.role === "admin" ? "/admin" : "/dashboard";
  } catch (error) {
    document.querySelector(".auth-error").hidden = false;
    document.querySelector(".auth-error").textContent = error.message;
    status.textContent = "";
  }
}

function submitLogin(event) { event.preventDefault(); submitAuth(event.currentTarget, "/api/login"); }
function submitRegister(event) { event.preventDefault(); submitAuth(event.currentTarget, "/api/register"); }

function renderAdmin(user) {
  document.querySelector("main").innerHTML = `<section class="admin-panel"><div class="section-heading"><div><p class="section-kicker">Administrator workspace</p><h1>System overview</h1></div><button class="primary-button logout-button">Log out</button></div><p class="welcome-copy">Signed in as ${user.email}. Student access is protected by the server.</p><div class="admin-notice">Reviewer uploads and calendar notifications are planned for a later release.</div><div id="admin-users" class="admin-users">Loading users...</div></section>`;
  document.querySelector(".logout-button").addEventListener("click", logout);
  fetch("/api/admin/overview").then((response) => response.json()).then((data) => {
    document.querySelector("#admin-users").innerHTML = `<h2>Registered users</h2>${data.users.map((item) => `<div class="user-row"><strong>${item.name}</strong><span>${item.email}</span><b>${item.role}</b></div>`).join("")}`;
  }).catch(() => { document.querySelector("#admin-users").textContent = "Unable to load users."; });
}

async function logout() { await fetch("/api/logout", { method: "POST" }); window.location.href = "/login"; }

async function initializeAuth() {
  try {
    const response = await fetch("/api/me");
    if (!response.ok) throw new Error("Unauthenticated");
    const data = await response.json();
    signedInUser = data.user;
    if (window.location.pathname === "/admin") renderAdmin(signedInUser);
    else {
      document.querySelector(".profile-name").textContent = signedInUser.name;
      document.querySelector(".avatar").textContent = signedInUser.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
      document.querySelector(".profile-chip").addEventListener("click", logout);
    }
  } catch {
    if (window.location.pathname === "/login") showAuth();
  }
}

document.querySelector("#search-input").addEventListener("input", (event) => {
  const query = event.target.value.toLowerCase().trim();
  renderRooms(rooms.filter((room) => `${room.grade} ${room.name} ${room.description}`.toLowerCase().includes(query)));
});

document.querySelector(".theme-toggle").addEventListener("click", () => {
  const root = document.documentElement;
  const dark = root.dataset.theme === "dark";
  root.dataset.theme = dark ? "light" : "dark";
  document.querySelector(".theme-toggle").setAttribute("aria-label", dark ? "Switch to dark mode" : "Switch to light mode");
});

initializeAuth();
