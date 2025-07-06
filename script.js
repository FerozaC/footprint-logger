function FootprintLogger() {
    this.activities = [];
    this.customActivities = [];
    this.currentFilter = "all";
  
    this.tips = [
      "Walk or cycle for short trips!",
      "Eat less meat (beef is the big one).",
      "Use public transport when you can.",
      "Switch off lights and unplug devices.",
      "Take shorter showers – saves energy.",
      "Buy local, seasonal produce.",
      "Work from home sometimes.",
      "Try a programmable thermostat."
    ];
  
    var self = this;
    document.addEventListener("DOMContentLoaded", function () {
      self.loadData();
      self.bindEvents();
      self.updateDisplay();
      self.showDailyTip();
      self.drawChart();
    });
  }
  
  FootprintLogger.prototype.bindEvents = function () {
    var self = this;
  
    document.getElementById("activitySelect").addEventListener("change", function (e) {
      var customForm = document.getElementById("customActivityForm");
      if (e.target.value === "custom") {
        customForm.classList.remove("hidden");
      } else {
        customForm.classList.add("hidden");
      }
    });
  
    document.getElementById("logActivity").addEventListener("click", function () {
      self.logActivity();
    });
  
    var buttons = document.getElementsByClassName("filter-btn");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener("click", function (e) {
        self.currentFilter = e.target.getAttribute("data-category");
        self.updateDisplay();
        self.drawChart();
        for (var j = 0; j < buttons.length; j++) {
          buttons[j].classList.remove("active");
        }
        e.target.classList.add("active");
      });
    }
  
    document.getElementById("clearLog").addEventListener("click", function () {
      if (confirm("Clear today's activities?")) {
        self.clearLog();
      }
    });
  };
  
  FootprintLogger.prototype.logActivity = function () {
    var select = document.getElementById("activitySelect");
    var val = select.value;
    var activity = {};
  
    if (val === "custom") {
      var name = document.getElementById("customName").value.trim();
      var co2 = parseFloat(document.getElementById("customCO2").value);
      var cat = document.getElementById("customCategory").value;
      if (!name || isNaN(co2)) {
        alert("Enter a valid custom activity.");
        return;
      }
      activity.name = name;
      activity.co2 = co2;
      activity.category = cat;
      this.customActivities.push(activity);
    } else if (val) {
      var opt = select.options[select.selectedIndex];
      activity.name = opt.textContent;
      activity.co2 = parseFloat(opt.getAttribute("data-co2"));
      activity.category = opt.getAttribute("data-category");
    } else {
      alert("Select an activity first.");
      return;
    }
  
    activity.id = Date.now();
    activity.timestamp = new Date();
    activity.date = new Date().toDateString();
  
    this.activities.push(activity);
    this.saveData();
    this.updateDisplay();
    this.drawChart();
    this.resetForm();
  };
  
  FootprintLogger.prototype.updateDisplay = function () {
    var today = new Date().toDateString();
    var total = 0;
    for (var i = 0; i < this.activities.length; i++) {
      if (this.activities[i].date === today &&
          (this.currentFilter === "all" || this.activities[i].category === this.currentFilter)) {
        total += this.activities[i].co2;
      }
    }
    document.getElementById("dailyTotal").textContent = total.toFixed(1) + " kg";
    this.renderLog();
  };
  
  FootprintLogger.prototype.renderLog = function () {
    var logDiv = document.getElementById("activityLog");
    var today = new Date().toDateString();
    var html = "";
    for (var i = this.activities.length - 1; i >= 0; i--) {
      var a = this.activities[i];
      if (a.date !== today) continue;
      if (this.currentFilter !== "all" && a.category !== this.currentFilter) continue;
  
      html += '<div class="activity-item">' +
                '<strong>' + a.name + '</strong> (' + a.category + ') – ' +
                a.co2.toFixed(1) + ' kg ' +
                '<button onclick="footprintLogger.deleteActivity(' + a.id + ')">x</button>' +
              '</div>';
    }
    if (html === "") html = "<p>No activities yet.</p>";
    logDiv.innerHTML = html;
  };
  
  FootprintLogger.prototype.deleteActivity = function (id) {
    var out = [];
    for (var i = 0; i < this.activities.length; i++) {
      if (this.activities[i].id !== id) out.push(this.activities[i]);
    }
    this.activities = out;
    this.saveData();
    this.updateDisplay();
    this.drawChart();
  };
  
  FootprintLogger.prototype.clearLog = function () {
    var today = new Date().toDateString();
    var rest = [];
    for (var i = 0; i < this.activities.length; i++) {
      if (this.activities[i].date !== today) rest.push(this.activities[i]);
    }
    this.activities = rest;
    this.saveData();
    this.updateDisplay();
    this.drawChart();
  };
  
  FootprintLogger.prototype.drawChart = function () {
    var canvas = document.getElementById("emissionsChart");
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  
    var sums = { Transport: 0, Food: 0, Energy: 0 };
    var today = new Date().toDateString();
    for (var i = 0; i < this.activities.length; i++) {
      var a = this.activities[i];
      if (a.date !== today) continue;
      if (this.currentFilter !== "all" && a.category !== this.currentFilter) continue;
      sums[a.category] += a.co2;
    }
  
    var cats = ["Transport", "Food", "Energy"];
    var colors = ["#0F52BA", "#9F0100", "#4caf50"];
    var barW = 60;
    var gap = 30;
    var max = Math.max(sums.Transport, sums.Food, sums.Energy, 1);
    for (var c = 0; c < cats.length; c++) {
      var v = sums[cats[c]];
      if (v === 0) continue;
      var h = (v / max) * (canvas.height - 60);
      var x = 40 + c * (barW + gap);
      var y = canvas.height - h - 30;
  
      ctx.fillStyle = colors[c];
      ctx.fillRect(x, y, barW, h);
      ctx.fillStyle = "#000";
      ctx.fillText(v.toFixed(1) + "kg", x, y - 5);
      ctx.fillText(cats[c], x, canvas.height - 10);
    }
  };
  
  FootprintLogger.prototype.showDailyTip = function () {
    var tip = this.tips[Math.floor(Math.random() * this.tips.length)];
    document.getElementById("dailyTip").textContent = tip;
  };
  
  FootprintLogger.prototype.resetForm = function () {
    document.getElementById("activitySelect").value = "";
    document.getElementById("customActivityForm").classList.add("hidden");
    document.getElementById("customName").value = "";
    document.getElementById("customCO2").value = "";
    document.getElementById("customCategory").value = "Transport";
  };
  
  FootprintLogger.prototype.saveData = function () {
    localStorage.setItem("footprintActivities", JSON.stringify(this.activities));
    localStorage.setItem("footprintCustomActivities", JSON.stringify(this.customActivities));
  };
  
  FootprintLogger.prototype.loadData = function () {
    var a = localStorage.getItem("footprintActivities");
    var c = localStorage.getItem("footprintCustomActivities");
    if (a) this.activities = JSON.parse(a);
    if (c) this.customActivities = JSON.parse(c);
  };
  
  var footprintLogger = new FootprintLogger();
  