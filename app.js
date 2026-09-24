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
