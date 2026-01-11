let data = JSON.parse(localStorage.getItem("habitData")) || {
  habits: [],
  history: {}
};

let selectedDate = new Date();

const STATES = ["missed", "partial", "skip", "done"]; // 🔴 🟡 🔵 🟢
const EMOJI = {
  missed: "🔴",
  partial: "🟡",
  skip: "🔵",
  done: "🟢"
};

function save() {
  localStorage.setItem("habitData", JSON.stringify(data));
}

function formatDate(d) {
  return d.toISOString().slice(0,10);
}

function addHabit() {
  const name = document.getElementById("habitName").value;
  const type = document.getElementById("habitType").value;
  if (!name) return;

  let goal = 1;
  if (type === "count") {
    goal = parseInt(prompt("Enter daily goal (e.g. 8 glasses)")) || 1;
  }

  data.habits.push({
    id: Date.now(),
    name,
    type,
    goal,
    created: formatDate(new Date())
  });

  document.getElementById("habitName").value = "";
  save();
  render();
}

function getDay(date) {
  if (!data.history[date]) {
    data.history[date] = {};
    data.habits.forEach(h => {
      data.history[date][h.id] = h.type === "daily" ? "missed" : 0;
    });
  }
  return data.history[date];
}

function cycleState(id) {
  const d = formatDate(selectedDate);
  const day = getDay(d);
  let current = day[id] || "missed";
  let idx = STATES.indexOf(current);
  idx = (idx + 1) % STATES.length;
  day[id] = STATES[idx];
  save();
  render();
}

function incHabit(id) {
  const d = formatDate(selectedDate);
  const day = getDay(d);
  day[id] = (day[id] || 0) + 1;
  save();
  render();
}

function getState(habit, date) {
  const day = getDay(date);
  if (habit.type === "daily") {
    return day[habit.id];
  } else {
    if (day[habit.id] >= habit.goal) return "done";
    if (day[habit.id] > 0) return "partial";
    return "missed";
  }
}

function calcStreak(habit) {
  let streak = 0;
  let d = new Date();
  while (true) {
    const date = formatDate(d);
    const state = getState(habit, date);
    if (state === "done") {
      streak++;
    } else if (state === "partial" || state === "skip") {
      break;
    } else {
      break;
    }
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function renderCalendar() {
  const cal = document.getElementById("calendar");
  cal.innerHTML = "";

  const now = new Date(selectedDate);
  now.setDate(1);
  const month = now.getMonth();
  const year = now.getFullYear();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const title = document.createElement("h2");
  title.innerText = now.toLocaleString("default", { month: "long", year: "numeric" });
  cal.appendChild(title);

  const grid = document.createElement("div");
  grid.style.display = "grid";
  grid.style.gridTemplateColumns = "repeat(7, 1fr)";

  for (let i = 0; i < firstDay; i++) grid.appendChild(document.createElement("div"));

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const key = formatDate(date);
    const btn = document.createElement("button");
    btn.innerText = d;

    let score = 0;
    if (data.history[key]) {
      data.habits.forEach(h => {
        const s = getState(h, key);
        if (s === "done") score++;
      });
    }

    if (score > 0) btn.style.background = "#4caf50";

    if (formatDate(date) === formatDate(new Date())) {
      btn.style.border = "2px solid yellow";
    }

    btn.onclick = () => {
      selectedDate = date;
      render();
    };

    grid.appendChild(btn);
  }

  cal.appendChild(grid);
}

function renderHabits() {
  const list = document.getElementById("habitList");
  list.innerHTML = "";

  const dateStr = formatDate(selectedDate);
  document.getElementById("dateTitle").innerText = dateStr;

  const day = getDay(dateStr);

  data.habits.forEach(h => {
    const li = document.createElement("li");
    const streak = calcStreak(h);

    if (h.type === "daily") {
      const state = day[h.id];
      li.innerHTML = `
        ${h.name} ${EMOJI[state]} 🔥${streak}
        <button onclick="cycleState(${h.id})">Change</button>
      `;
    } else {
      const count = day[h.id] || 0;
      const state = getState(h, dateStr);
      li.innerHTML = `
        ${h.name} (${count}/${h.goal}) ${EMOJI[state]} 🔥${streak}
        <button onclick="incHabit(${h.id})">+</button>
      `;
    }

    list.appendChild(li);
  });
}

function render() {
  renderCalendar();
  renderHabits();
}

render();
