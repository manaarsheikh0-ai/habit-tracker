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
const EMOJI = { missed:"🔴", partial:"🟡", skip:"🔵", done:"🟢" };

function save() {
  localStorage.setItem("habitData", JSON.stringify(data));
}

function formatDate(d) {
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
}

/* THEME */
const themeBtn = document.getElementById("themeBtn");
document.body.className = localStorage.getItem("theme") || "";
themeBtn.onclick = () => {
  document.body.classList.toggle("light");
  localStorage.setItem("theme", document.body.className);
};

/* HABITS */
function addHabit() {
  const name = habitName.value;
  const type = habitType.value;
  const goal = parseInt(habitGoal.value) || 30;
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
    goalTotal: goal,
    goalStreak: 7,
    countGoal,
    reminder
  });

  if (reminder) scheduleReminder(name, reminder);

  habitName.value = "";
  habitGoal.value = "";
  reminderTime.value = "";
  save();
  render();
}

function getDay(date) {
  if (!data.history[date]) {
    data.history[date] = {};
    data.habits.forEach(h => {
      data.history[date][h.id] = h.type==="daily" ? "missed" : 0;
    });
  }
  return data.history[date];
}

function cycleState(id) {
  const d = formatDate(selectedDate);
  const day = getDay(d);
  const cur = day[id] || "missed";
  const idx = STATES.indexOf(cur);
  day[id] = STATES[(idx+1)%STATES.length];
  save(); render();
}

function incHabit(id) {
  const d = formatDate(selectedDate);
  const day = getDay(d);
  day[id] = (day[id]||0)+1;
  save(); render();
}

function getState(h, date) {
  const day = getDay(date);
  if (h.type==="daily") return day[h.id] || "missed";
  const c = day[h.id]||0;
  if (c>=h.countGoal) return "done";
  if (c>0) return "partial";
  return "missed";
}

function calcStreak(h) {
  let s=0;
  let d=new Date();
  while(true){
    const st=getState(h,formatDate(d));
    if(st==="done") s++;
    else break;
    d.setDate(d.getDate()-1);
  }
  return s;
}

function calcTotal(h){
  let c=0;
  for(const d in data.history){
    if(getState(h,d)==="done") c++;
  }
  return c;
}

/* CALENDAR */
function renderCalendar(){
  const cal=calendar;
  cal.innerHTML="";
  const now=new Date(selectedDate); now.setDate(1);
  const m=now.getMonth(), y=now.getFullYear();
  const first=new Date(y,m,1).getDay();
  const days=new Date(y,m+1,0).getDate();

  const grid=document.createElement("div");
  grid.className="calendar-grid";

  for(let i=0;i<first;i++) grid.appendChild(document.createElement("div"));

  for(let d=1;d<=days;d++){
    const date=new Date(y,m,d);
    const key=formatDate(date);
    const btn=document.createElement("div");
    btn.className="day";
    btn.innerText=d;

    if(data.history[key]){
      let state="missed";
      data.habits.forEach(h=>{
        const s=getState(h,key);
        if(s==="done") state="done";
        else if(s==="partial"||s==="skip") state="partial";
      });
      btn.classList.add(state==="done"?"green":state==="partial"?"yellow":"red");
    }

    btn.onclick=()=>{selectedDate=date;render();}
    grid.appendChild(btn);
  }
  cal.appendChild(grid);
}

/* HABITS */
function renderHabits(){
  habitList.innerHTML="";
  const date=formatDate(selectedDate);
  dateTitle.innerText=date;

  data.habits.forEach(h=>{
    const st=getState(h,date);
    const streak=calcStreak(h);
    const total=calcTotal(h);

    const div=document.createElement("div");
    div.className="habit";
    div.innerHTML=`
      <b>${h.name}</b> ${EMOJI[st]}
      <div>🔥 ${streak}/7 | ✔ ${total}/${h.goalTotal}</div>
      <div class="progress"><div class="progress-inner" style="width:${Math.min(100,(total/h.goalTotal)*100)}%"></div></div>
      ${h.type==="daily"?`<button onclick="cycleState(${h.id})">Change</button>`:`<button onclick="incHabit(${h.id})">+</button>`}
    `;
    habitList.appendChild(div);
  });
}

/* DIARY */
function saveDiary(){
  data.diary[formatDate(selectedDate)] = diaryText.value;
  save();
}

function loadDiary(){
  diaryText.value = data.diary[formatDate(selectedDate)] || "";
}

/* NOTIFICATIONS */
function scheduleReminder(title, timeStr){
  const [h,m] = timeStr.split(":");
  const now = new Date();
  const remind = new Date();
  remind.setHours(h,m,0,0);
  if(remind < now) remind.setDate(remind.getDate()+1);

  if("serviceWorker" in navigator){
    navigator.serviceWorker.ready.then(reg=>{
      reg.active.postMessage({
        type:"schedule",
        title:"⏰ "+title,
        body:"Time to do your habit!",
        time:remind.getTime()
      });
    });
  }
}

function render(){
  renderCalendar();
  renderHabits();
  loadDiary();
}

render();
