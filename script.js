let data = JSON.parse(localStorage.getItem("habitData")) || {
  habits: [],
  history: {}
};

let selectedDate = new Date().toISOString().slice(0,10);

function save() {
  localStorage.setItem("habitData", JSON.stringify(data));
}

function addHabit() {
  const name = document.getElementById("habitName").value;
  const type = document.getElementById("habitType").value;
  if (!name) return;

  data.habits.push({
    id: Date.now(),
    name,
    type,
    created: new Date().toISOString().slice(0,10)
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
  const day = getDay(selectedDate);
  day[id] = !day[id];
  save();
  render();
}

function incHabit(id) {
  const day = getDay(selectedDate);
  day[id]++;
  save();
  render();
}

function render() {
  renderCalendar();
  renderHabits();
}

function renderHabits() {
  const list = document.getElementById("habitList");
  list.innerHTML = "";
  document.getElementById("dateTitle").innerText = selectedDate;

  const day = getDay(selectedDate);

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

function renderCalendar() {
  const cal = document.getElementById("calendar");
  cal.innerHTML = "";

  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0,10);

    const btn = document.createElement("button");
    btn.innerText = date;
    btn.onclick = () => {
      selectedDate = date;
      render();
    };

    cal.appendChild(btn);
  }
}

render();
