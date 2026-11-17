const STORAGE_KEY = "taskflow_tasks_v1";
let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
let editingId = null;
let currentView = "all";

const $ = (id) => document.getElementById(id);
const form = $("taskForm");
const backdrop = $("modalBackdrop");

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  render();
}
function openModal(task = null) {
  editingId = task ? task.id : null;
  $("modalTitle").textContent = task ? "Edit task" : "Create a task";
  $("taskName").value = task?.name || "";
  $("taskDescription").value = task?.description || "";
  $("taskPriority").value = task?.priority || "Medium";
  $("taskStatus").value = task?.status || "To do";
  $("taskDue").value = task?.due || "";
  backdrop.classList.add("open");
  backdrop.setAttribute("aria-hidden", "false");
  $("taskName").focus();
}
function closeModal() {
  backdrop.classList.remove("open");
  backdrop.setAttribute("aria-hidden", "true");
  form.reset();
  editingId = null;
}
$("openModal").addEventListener("click", () => openModal());
$("closeModal").addEventListener("click", closeModal);
$("cancelModal").addEventListener("click", closeModal);
backdrop.addEventListener("click", e => { if (e.target === backdrop) closeModal(); });

form.addEventListener("submit", e => {
  e.preventDefault();
  const data = {
    name: $("taskName").value.trim(),
    description: $("taskDescription").value.trim(),
    priority: $("taskPriority").value,
    status: $("taskStatus").value,
    due: $("taskDue").value
  };
  if (!data.name) return;
  if (editingId) {
    tasks = tasks.map(t => t.id === editingId ? {...t, ...data} : t);
  } else {
    tasks.unshift({id: crypto.randomUUID(), ...data, createdAt: new Date().toISOString()});
  }
  closeModal();
  save();
});

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function visibleTasks() {
  const q = $("searchInput").value.toLowerCase().trim();
  const priority = $("priorityFilter").value;
  return tasks.filter(t => {
    const viewMatch = currentView === "all" || (currentView === "today" && t.status !== "Completed") || (currentView === "completed" && t.status === "Completed");
    const queryMatch = (t.name + " " + t.description).toLowerCase().includes(q);
    return viewMatch && queryMatch && (priority === "all" || t.priority === priority);
  });
}
function render() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === "Completed").length;
  const inProgress = tasks.filter(t => t.status === "In progress").length;
  const rate = total ? Math.round(completed / total * 100) : 0;
  $("totalCount").textContent = total;
  $("progressCount").textContent = inProgress;
  $("completedCount").textContent = completed;
  $("completionRate").textContent = rate + "%";
  $("ringPercent").textContent = rate + "%";
  $("progressRing").style.background = `conic-gradient(var(--primary) ${rate}%, var(--line) ${rate}%)`;
  const titles = {all:"Your tasks",today:"My tasks",completed:"Completed tasks"};
  $("listTitle").textContent = titles[currentView];
  const list = visibleTasks();
  $("taskList").innerHTML = list.map(t => `
    <article class="task-item">
      <input class="task-check" type="checkbox" aria-label="Mark ${escapeHTML(t.name)} complete" data-complete="${t.id}" ${t.status === "Completed" ? "checked" : ""}>
      <div class="task-info"><strong class="${t.status === "Completed" ? "is-done" : ""}">${escapeHTML(t.name)}</strong><p>${escapeHTML(t.description || (t.due ? "Due " + t.due : "No additional details"))}</p></div>
      <div class="task-meta"><span class="priority ${t.priority}">${t.priority}</span><span class="status-pill">${t.status}</span></div>
      <div class="task-actions"><button class="icon-btn" title="Edit task" data-edit="${t.id}">✎</button><button class="icon-btn" title="Delete task" data-delete="${t.id}">×</button></div>
    </article>`).join("");
  $("emptyState").classList.toggle("show", list.length === 0);
}
$("taskList").addEventListener("click", e => {
  const editId = e.target.dataset.edit;
  const deleteId = e.target.dataset.delete;
  if (editId) openModal(tasks.find(t => t.id === editId));
  if (deleteId && confirm("Delete this task?")) {
    tasks = tasks.filter(t => t.id !== deleteId);
    save();
  }
});
$("taskList").addEventListener("change", e => {
  const id = e.target.dataset.complete;
  if (!id) return;
  tasks = tasks.map(t => t.id === id ? {...t, status: e.target.checked ? "Completed" : "To do"} : t);
  save();
});
$("searchInput").addEventListener("input", render);
$("priorityFilter").addEventListener("change", render);
document.querySelectorAll(".nav-item").forEach(btn => btn.addEventListener("click", () => {
  document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  currentView = btn.dataset.view;
  $("pageTitle").innerHTML = currentView === "completed" ? "Well done, Atheefa <span>✦</span>" : "Good day, Atheefa <span>✦</span>";
  render();
}));
$("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("taskflow_dark", document.body.classList.contains("dark") ? "1" : "0");
});
if (localStorage.getItem("taskflow_dark") === "1") document.body.classList.add("dark");
$("todayLabel").textContent = new Intl.DateTimeFormat("en", {weekday:"long", month:"long", day:"numeric"}).format(new Date()).toUpperCase();
render();
