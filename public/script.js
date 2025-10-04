let token = null;
let username = null;

let socket = null;
let selectedCategory = null; // null = show all

const today = new Date();
const tomorrow = new Date();
tomorrow.setDate(today.getDate() + 1);
document
  .getElementById("activityDate")
  .setAttribute("max", tomorrow.toISOString().split("T")[0]);

document.getElementById("logoutBtn").addEventListener("click", () => {
  token = null;
  username = null;
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  document.getElementById("dashboard").classList.add("hidden");
  window.location.href = "signin.html";
});

document.getElementById("logActivity").addEventListener("click", async () => {
  const btn = document.getElementById("logActivity");
  btn.disabled = true;
  window.showGlobalSpinner();

  const select = document.getElementById("activitySelect");
  const val = select.value;

  let name, co2, category;
  if (val === "custom") {
    name = document.getElementById("customName").value;
    co2 = parseFloat(document.getElementById("customCO2").value);
    category = document.getElementById("customCategory").value;
  } else {
    const opt = select.options[select.selectedIndex];
    name = opt.textContent;
    co2 = parseFloat(opt.getAttribute("data-co2"));
    category = opt.getAttribute("data-category");
  }

  const date = document.getElementById("activityDate").value;
  if (!name || !co2 || !category || !date)
    return alert("Please fill all fields");

  try {
    await fetch("/api/activities", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, co2, category, date }),
    });
    await loadActivities();
    await loadWeeklySummary();
    await loadLeaderboard();
    await loadCommunityAverage();
    btn.disabled = false;
    window.hideGlobalSpinner();
  } catch (err) {
    console.error(err);
    alert("Failed to log activity. Try again.");
    btn.disabled = false;
    window.hideGlobalSpinner();
  }
});

async function loadActivities() {
  if (!token) return;
  try {
    const res = await fetch("/api/activities", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const activities = await res.json();

    const logDiv = document.getElementById("activityLog");
    logDiv.innerHTML = "";
    const initial = 10;

  const filtered = selectedCategory ? activities.filter(a => a.category === selectedCategory) : activities;

  filtered.forEach((a, i) => {
      const dateStr = new Date(a.date).toLocaleDateString();
      const div = document.createElement("div");
      div.classList.add("activity-item");
      div.innerHTML = `
        <div class="activity-info">
          <h4>${a.name}</h4>
          <div class="activity-meta">${dateStr} - ${a.category}</div>
        </div>
        <div class="activity-co2">${a.co2} kg</div>
      `;
      if (i >= initial) div.classList.add("hidden-activity");
      logDiv.appendChild(div);
    });

    let moreBtn = document.getElementById("moreActivitiesBtn");
    if (!moreBtn && activities.length > initial) {
      moreBtn = document.createElement("button");
      moreBtn.id = "moreActivitiesBtn";
      moreBtn.textContent = "Show More Activities";
      moreBtn.classList.add("btn", "btn-primary");
      moreBtn.style.marginTop = "10px";

      moreBtn.addEventListener("click", () => {
        document
          .querySelectorAll(".hidden-activity")
          .forEach((el) => el.classList.remove("hidden-activity"));
        moreBtn.remove();
      });

      logDiv.parentNode.insertBefore(moreBtn, logDiv.nextSibling);
    }

    const total = filtered.reduce((sum, a) => sum + a.co2, 0);
    document.getElementById("dailyTotal").textContent =
      total.toFixed(1) + " kg";
  } catch (err) {
    console.error(err);
    alert("Failed to load activities.");
  }
}

async function loadWeeklySummary() {
  if (!token) return;
  try {
    const res = await fetch("/api/activities/weekly", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    const canvas = document.getElementById("weeklyChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const weekDays = [];
    const co2PerDay = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const entry = data.find((e) => e._id === dateStr);
      weekDays.push(
        d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      );
      co2PerDay.push(entry ? entry.totalCO2 : 0);
    }

    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    const barWidth = (chartWidth - 20) / 7;

    const maxCO2 = Math.max(...co2PerDay, 1);
    const scaleFactor = chartHeight / maxCO2;

    ctx.fillStyle = "#4caf50";
    co2PerDay.forEach((val, i) => {
      const barHeight = val * scaleFactor;
      const x = padding + i * (barWidth + 5);
      const y = canvas.height - padding - barHeight;
      ctx.fillRect(x, y, barWidth, barHeight);
      ctx.fillStyle = "#000";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(val.toFixed(1) + "kg", x + barWidth / 2, y - 5);
      ctx.fillText(weekDays[i], x + barWidth / 2, canvas.height - padding + 15);
    });

    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let i = 0; i <= 5; i++) {
      const value = (maxCO2 / 5) * i;
      const y = canvas.height - padding - (chartHeight / 5) * i;
      ctx.fillText(value.toFixed(1) + "kg", padding - 5, y);
    }
  } catch (err) {
    console.error("Error loading weekly summary:", err);
  }
}

async function loadLeaderboard() {
  try {
    const rangeEl = document.getElementById('leaderboardRange');
    const days = rangeEl ? parseInt(rangeEl.value, 10) : 0;
    const url = days && days > 0 ? `/api/leaderboard?days=${days}` : '/api/leaderboard';
    const res = await fetch(url);
    const data = await res.json();
    const div = document.getElementById('leaderboard');
    div.innerHTML = data.map((u) => `<div>${u.username}: ${u.totalCO2.toFixed(1)} kg</div>`).join('');
  } catch (err) {
    console.error(err);
    alert('Failed to load leaderboard.');
  }
}

async function loadCommunityAverage() {
  try {
    const res = await fetch("/api/activities/average");
    const data = await res.json();
    let avgDiv = document.getElementById("communityAverage");
    if (!avgDiv) {
      avgDiv = document.createElement("div");
      avgDiv.id = "communityAverage";
      document
        .getElementById("dashboard")
        .insertBefore(avgDiv, document.getElementById("logoutBtn"));
    }
    avgDiv.textContent = `Community Avg CO2: ${data.avgCO2.toFixed(1)} kg`;
  } catch (err) {
    console.error(err);
    alert("Failed to load community average.");
  }
}

if (localStorage.getItem("token")) {
  token = localStorage.getItem("token");
  username = localStorage.getItem("username");
  const usernameEl = document.getElementById("usernameDisplay");
  if (usernameEl) usernameEl.textContent = username;
  const dashboard = document.getElementById("dashboard");
  if (dashboard) dashboard.classList.remove("hidden");
  (async function initDashboard() {
    await loadActivities();
    await loadWeeklySummary();
    await loadLeaderboard();
    await loadCommunityAverage();
    setupSocket();
    await loadWeeklyGoal();
    renderCategoryFilters();
    await loadCategorySummary();
  })();
}

function setupSocket() {
  if (typeof io === "undefined") return;
  socket = io();
  socket.on("connect", () => {
    if (username && socket && token) {
      socket.emit("register", token);
    }
  });
  socket.on("tip", (data) => {
    showTip(data.message);
  });
}

function showTip(message) {
  let tipEl = document.getElementById("realtimeTip");
  if (!tipEl) {
    tipEl = document.createElement("div");
    tipEl.id = "realtimeTip";
    tipEl.style.position = "fixed";
    tipEl.style.right = "20px";
    tipEl.style.bottom = "20px";
    tipEl.style.background = "#fff";
    tipEl.style.border = "1px solid #ddd";
    tipEl.style.padding = "12px 16px";
    tipEl.style.borderRadius = "8px";
    tipEl.style.boxShadow = "0 4px 14px rgba(0,0,0,0.12)";
    document.body.appendChild(tipEl);
  }
  tipEl.textContent = message;
  setTimeout(() => {
    if (tipEl) tipEl.remove();
  }, 10000);
}

async function loadWeeklyGoal() {
  try {
    const res = await fetch("/api/goals", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    renderWeeklyGoal(data.weeklyGoal || 0);
  } catch (err) {
    console.error(err);
  }
}

function renderWeeklyGoal(goalKg) {
  let goalSection = document.getElementById("weeklyGoalSection");
  if (!goalSection) {
    goalSection = document.createElement("div");
    goalSection.id = "weeklyGoalSection";
    goalSection.className = "log-section";
    goalSection.innerHTML = `\n      <h3>Weekly Goal</h3>\n      <div id="goalValue">${goalKg} kg</div>\n      <div id="goalProgress"></div>\n      <input id="setWeeklyGoalInput" type="number" placeholder="Set weekly goal kg" style="margin-top:8px;" />\n      <button id="setWeeklyGoalBtn" class="btn btn-primary" style="margin-top:8px;">Set Goal</button>\n    `;
    const dashboard = document.getElementById("dashboard");
    if (dashboard)
      dashboard.querySelector(".main-content").appendChild(goalSection);
    document
      .getElementById("setWeeklyGoalBtn")
      .addEventListener("click", async () => {
        const val = parseFloat(
          document.getElementById("setWeeklyGoalInput").value,
        );
        if (isNaN(val)) return alert("Enter a numeric value");
        await fetch("/api/goals", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ weeklyGoal: val }),
        });
        renderWeeklyGoal(val);
      });
  } else {
    document.getElementById("goalValue").textContent = `${goalKg} kg`;
  }
}

async function loadCategorySummary() {
  try {
    const res = await fetch("/api/activities/category-summary", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const top = data.summary && data.summary[0];
    if (top) {
      showTip(
        `Top category this week: ${top._id} (${top.totalCO2.toFixed(1)} kg)`,
      );
    }
  } catch (err) {
    console.error(err);
  }
}

function renderCategoryFilters() {
  const container = document.getElementById('categoryFilters');
  if (!container) return;
  const categories = ['All','Transport','Food','Energy'];
  container.innerHTML = '';
  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.textContent = cat;
    btn.addEventListener('click', async () => {
      selectedCategory = cat === 'All' ? null : cat;
      document.querySelectorAll('#categoryFilters .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      await loadActivities();
    });
    container.appendChild(btn);
  });
  const first = container.querySelector('.filter-btn');
  if (first) first.classList.add('active');
  const rangeEl = document.getElementById('leaderboardRange');
  if (rangeEl) rangeEl.addEventListener('change', loadLeaderboard);
}
