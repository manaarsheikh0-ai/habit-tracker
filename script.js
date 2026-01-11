if ("Notification" in window) {
  Notification.requestPermission();
}

let data = JSON.parse(localStorage.getItem("habitData")) || {
  habits: [],
  history: {},
  diary: {}
};

let selectedDate = new Date();

const STATES = ["missed", "partial", "skip", "done"];
const EMOJI = { missed: "🔴", partial: "🟡", skip: "🔵", done: "🟢" };

function save() {
  localStorage.setItem("habitData", JSON.stringify(data));
}

function formatDate(d) {
  return (
    d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

/* THEME */
const themeBtn = document.getElementById("themeBtn");
document.body.className = localStorage.getItem("theme") || "";
themeBtn.onclick = () => {
  document.body.classList.toggle("light");
  localStorage.setItem("theme", document.body.className);
};

/* ===========================
   HABIT CREATION
=========================== */
function addHabit() {
  const name = habitName.value.trim();
  const type = habitType.value;
  const goalTotal = parseInt(habitGoal.value) || 30;
  const reminder = reminderTime.value;

  if (!name) return;

  let countGoal = null;
  if (type === "count") {
    countGoal = parseInt(prompt("Daily target (e.g. 8)")) || 1;
  }

  data.habits.push({
    id: Date.now(),
    name,
    type,
    goalTotal,
    goalStreak: 7,
    countGoal,
    reminder
  });

  habitName.value = "";
  habitGoal.value = "";
  reminderTime.value = "";

  if (reminder) scheduleReminder(name, reminder);

  save();
  render();
}

/* ===========================
   DAY STORAGE
=========================== */
function getDay(date) {
  if (!data.history[date]) data.history[date] = {};
  return data.history[date];
}

/* ===========================
   DAILY STATE CYCLE
=========================== */
function cycleState(id) {
  const d = formatDate(selectedDate);
  const day = getDay(d);
  const cur = day[id] || "missed";
  const idx = STATES.indexOf(cur);
  day[id] = STATES[(idx + 1) % STATES.length];
  save();
  render();
}

/* ===========================
   COUNT HABITS
=========================== */
function incHabit(id) {
  const d = formatDate(selectedDate);
  const day = getDay(d);
  day[id] = (day[id] || 0) + 1;
  save();
  render();
}

/* ===========================
   STATE ENGINE (CRITICAL)
=========================== */
function getState(habit, date) {
  const day = getDay(date);
  const val = day[habit.id];

  if (habit.type === "daily") {
    return val || "missed";
  }

  // count habits
  if (!habit.countGoal) return "missed";
  if ((val || 0) >= habit.countGoal) return "done";
  if ((val || 0) > 0) return "partial";
  return "missed";
}

/* ===========================
   STREAK ENGINE
=========================== */
function calcStreak(habit) {
  let s = 0;
  let d = new Date();

  while (true) {
    const key = formatDate(d);
    if (getState(habit, key) === "done") s++;
    else break;
    d.setDate(d.getDate() - 1);
  }
  return s;
}

/* ===========================
   TOTAL DONE
=========================== */
function calcTotal(habit) {
  let c = 0;
  for (const d in data.history) {
    if (getState(habit, d) === "done") c++;
  }
  return c;
}

/* ===========================
   CALENDAR (FIXED COLORS)
=========================== */
function renderCalendar() {
  calendar.innerHTML = "";
  const now = new Date(selectedDate);
  now.setDate(1);

  const m = now.getMonth();
  const y = now.getFullYear();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();

  const grid = document.createElement("div");
  grid.className = "calendar-grid";

  for (let i = 0; i < first; i++) grid.appendChild(document.createElement("div"));

  for (let d = 1; d <= days; d++) {
    const date = new Date(y, m, d);
    const key = formatDate(date);
    const btn = document.createElement("div");
    btn.className = "day";
    btn.innerText = d;

    if (data.history[key]) {
      let worst = "done";
      data.habits.forEach(h => {
        const s = getState(h, key);
        if (s === "missed") worst = "missed";
        else if (s === "partial" && worst === "done") worst = "partial";
      });
      btn.classList.add(
        worst === "done" ? "green" :
        worst === "partial" ? "yellow" : "red"
      );
    }

    btn.onclick = () => {
      selectedDate = date;
      render();
    };

    grid.appendChild(btn);
  }

  calendar.appendChild(grid);
}

/* ===========================
   HABIT LIST (FIXED UI)
=========================== */
function renderHabits() {
  habitList.innerHTML = "";
  const date = formatDate(selectedDate);
  dateTitle.innerText = date;

  data.habits.forEach(h => {
    const st = getState(h, date);
    const streak = calcStreak(h);
    const total = calcTotal(h);

    let statLine = "";
    let actionBtn = "";

    if (h.type === "daily") {
      statLine = `🔥 ${streak}/7 | ✔ ${total}/${h.goalTotal}`;
      actionBtn = `<button onclick="cycleState(${h.id})">Change</button>`;
    } else {
      const val = getDay(date)[h.id] || 0;
      statLine = `${val} / ${h.countGoal}`;
      actionBtn = `<button onclick="incHabit(${h.id})">+</button>`;
    }

    const div = document.createElement("div");
    div.className = "habit";
    div.innerHTML = `
      <b>${h.name}</b> ${EMOJI[st]}
      <div>${statLine}</div>
      <div class="progress">
        <div class="progress-inner" style="width:${h.type==="daily"
          ? Math.min(100, (total/h.goalTotal)*100)
          : Math.min(100, ((getDay(date)[h.id]||0)/h.countGoal)*100)
        }%"></div>
      </div>
      ${actionBtn}
    `;
    habitList.appendChild(div);
  });
}

/* ===========================
   DIARY
=========================== */
function saveDiary() {
  data.diary[formatDate(selectedDate)] = diaryText.value;
  save();
}

function loadDiary() {
  diaryText.value = data.diary[formatDate(selectedDate)] || "";
}

/* ===========================
   NOTIFICATIONS
=========================== */
function scheduleReminder(title, timeStr) {
  const [h, m] = timeStr.split(":");
  const now = new Date();
  const remind = new Date();
  remind.setHours(h, m, 0, 0);
  if (remind < now) remind.setDate(remind.getDate() + 1);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready.then(reg => {
      reg.active.postMessage({
        type: "schedule",
        title: "⏰ " + title,
        body: "Time to do your habit!",
        time: remind.getTime()
      });
    });
  }
}

/* ===========================
   MAIN
=========================== */
function render() {
  renderCalendar();
  renderHabits();
  loadDiary();
}

render();
