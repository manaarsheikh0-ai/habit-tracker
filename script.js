let data = JSON.parse(localStorage.getItem("habitData")) || {
  habits: [],
  history: {}
};

let selectedDate = new Date();

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

  data.habits.push({
    id: Date.now(),
    name,
    type,
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
      data.history[date][h.id] = h.type === "daily" ? false : 0;
    });
  }
  return data.history[date];
}

function toggleHabit(id) {
  const d = formatDate(selectedDate);
  const day = getDay(d);
  day[id] = !day[id];
  save();
  render();
}

function incHabit(id) {
  const d = formatDate(selectedDate);
  const day = getDay(d);
  day[id]++;
  save();
  render();
}

function renderCalendar() {
  const cal = document.getElementById("calendar");
  cal.innerHTML = "";

  const now = new Date(selectedDate);
  now.setDate(1);

  const month = now.getMonth();
  const year = now.getFullYear();
  const firstDay = new Date(year, month, 1).getDay(); // Sunday=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const title = document.createElement("h2");
  title.innerText = now.toLocaleString("default", { month: "long", year: "numeric" });
  cal.appendChild(title);

  const grid = document.createElement("div");
  grid.style.display = "grid";
  grid.style.gridTemplateColumns = "repeat(7, 1fr)";
  grid.style.gap = "5px";

  for (let i = 0; i < firstDay; i++) {
    grid.appendChild(document.createElement("div"));
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const key = formatDate(date);
    const btn = document.createElement("button");
    btn.innerText = d;

    if (formatDate(date) === formatDate(new Date())) {
      btn.style.border = "2px solid yellow";
    }

    if (data.history[key]) {
      btn.style.background = "#4caf50";
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

    if (h.type === "daily") {
      li.innerHTML = `
        ${h.name}
        <button onclick="toggleHabit(${h.id})">${day[h.id] ? "✔" : "❌"}</button>
      `;
    } else {
      li.innerHTML = `
        ${h.name}
        <button onclick="incHabit(${h.id})">+ (${day[h.id]})</button>
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
