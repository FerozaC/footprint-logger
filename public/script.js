let token = null;
let username = null;

const today = new Date();
const tomorrow = new Date();
tomorrow.setDate(today.getDate() + 1);
document.getElementById("activityDate").setAttribute("max", tomorrow.toISOString().split("T")[0]);

document.getElementById("registerBtn").addEventListener("click", async () => {
  const usernameInput = document.getElementById("regUsername").value;
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPassword").value;
  if (!usernameInput || !email || !password) return alert("All fields are required");

  try {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: usernameInput, email, password })
    });
    const data = await res.json();
    alert(data.message);
  } catch (err) {
    console.error(err);
    alert("Server error. Please try again.");
  }
});

document.getElementById("loginBtn").addEventListener("click", async () => {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  if (!email || !password) return alert("All fields are required");

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
      token = data.token;
      username = data.username;
      localStorage.setItem("token", token);
      localStorage.setItem("username", username);
      document.getElementById("usernameDisplay").textContent = username;
      document.getElementById("auth-section").classList.add("hidden");
      document.getElementById("dashboard").classList.remove("hidden");
      await loadActivities();
      await loadWeeklySummary();
      await loadLeaderboard();
      await loadCommunityAverage();
    } else {
      alert(data.message);
    }
  } catch (err) {
    console.error(err);
    alert("Server error. Please try again.");
  }
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  token = null;
  username = null;
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  document.getElementById("dashboard").classList.add("hidden");
  document.getElementById("auth-section").classList.remove("hidden");
});

document.getElementById("logActivity").addEventListener("click", async () => {
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
  if (!name || !co2 || !category || !date) return alert("Please fill all fields");

  try {
    await fetch("/api/activities", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ name, co2, category, date })
    });
    await loadActivities();
    await loadWeeklySummary();
    await loadLeaderboard();
    await loadCommunityAverage();
  } catch (err) {
    console.error(err);
    alert("Failed to log activity. Try again.");
  }
});

async function loadActivities() {
  if (!token) return;
  try {
    const res = await fetch("/api/activities", { headers: { "Authorization": `Bearer ${token}` } });
    const activities = await res.json();

    const logDiv = document.getElementById("activityLog");
    logDiv.innerHTML = "";
    const initial = 10;

  
    activities.forEach((a, i) => {
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
        document.querySelectorAll(".hidden-activity").forEach(el => el.classList.remove("hidden-activity"));
        moreBtn.remove();
      });
      
      logDiv.parentNode.insertBefore(moreBtn, logDiv.nextSibling);
    }

    const total = activities.reduce((sum, a) => sum + a.co2, 0);
    document.getElementById("dailyTotal").textContent = total.toFixed(1) + " kg";

  } catch (err) {
    console.error(err);
    alert("Failed to load activities.");
  }
}


async function loadWeeklySummary() {
  if (!token) return;
  try {
    const res = await fetch("/api/activities/weekly", {
      headers: { "Authorization": `Bearer ${token}` }
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
      
     
      const entry = data.find(e => e._id === dateStr);
      
      weekDays.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
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
    const res = await fetch("/api/leaderboard");
    const data = await res.json();
    const div = document.getElementById("leaderboard");
    div.innerHTML = data.map(u => `<div>${u.username}: ${u.totalCO2.toFixed(1)} kg</div>`).join("");
  } catch (err) {
    console.error(err);
    alert("Failed to load leaderboard.");
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
      document.getElementById("dashboard").insertBefore(avgDiv, document.getElementById("logoutBtn"));
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
  document.getElementById("usernameDisplay").textContent = username;
  document.getElementById("auth-section").classList.add("hidden");
  document.getElementById("dashboard").classList.remove("hidden");
  loadActivities();
  loadWeeklySummary();
  loadLeaderboard();
  loadCommunityAverage();
}
