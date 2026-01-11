let habits = JSON.parse(localStorage.getItem("habits")) || [];

function save() {
  localStorage.setItem("habits", JSON.stringify(habits));
}

function addHabit() {
  const name = document.getElementById("newHabit").value;
  if (!name) return;

  habits.push({ name, streak: 0, lastDone: null });
  document.getElementById("newHabit").value = "";
  save();
  render();
}

function toggleHabit(index) {
  const today = new Date().toDateString();
  const habit = habits[index];

  if (habit.lastDone !== today) {
    habit.streak++;
    habit.lastDone = today;
  }

  save();
  render();
}

function render() {
  const list = document.getElementById("habitList");
  list.innerHTML = "";

  habits.forEach((h, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${h.name} (🔥 ${h.streak})</span>
      <button onclick="toggleHabit(${i})">Done</button>
    `;
    list.appendChild(li);
  });

  drawChart();
}

function drawChart() {
  const ctx = document.getElementById("chart").getContext("2d");

  const data = {
    labels: habits.map(h => h.name),
    datasets: [{
      label: "Streaks",
      data: habits.map(h => h.streak)
    }]
  };

  if (window.chart) window.chart.destroy();

  window.chart = new Chart(ctx, {
    type: "bar",
    data
  });
}

render();
