// ==== State ====
let draggedEl = null;
let currentColumn = 'pending';
let editingEl = null;

// ==== Sample Data (for demo) ====
const sampleTasks = [
    { id: 1, title: 'Review project proposal', description: 'Check the latest version and provide feedback', due: '2024-07-05', collab: 'John D.', column: 'pending' },
    { id: 2, title: 'Fix critical bug', description: 'DB connection timeout issue', due: '2024-07-02', collab: 'Sarah M.', column: 'urgent' },
    { id: 3, title: 'Update documentation', description: 'Add new API endpoints to docs', due: '2024-07-10', collab: 'Alex K.', column: 'ongoing' },
    { id: 4, title: 'Deploy to staging', description: 'Test new features before production', due: '2024-07-03', collab: '', column: 'nearfinish' }
];

// ==== Helpers ====
function createTaskElement(task) {
    const el = document.createElement('div');
    el.className = 'task';
    el.draggable = true;
    el.dataset.id = task.id;
    el.dataset.due = task.due && task.due !== 'No due date' ? task.due : '';

    el.innerHTML = `
        <div class="card-actions">
            <button class="action-btn edit-btn" title="Edit">✏️</button>
            <button class="action-btn delete-btn" title="Delete">🗑️</button>
        </div>
        <div class="task-title">${task.title}</div>
        <div class="task-description">${task.description}</div>
        <div class="task-due">Due: ${task.due}</div>
        ${task.collab ? `<div class="task-collab">With: ${task.collab}</div>` : ''}
    `;

    // drag events
    el.addEventListener('dragstart', () => { draggedEl = el; el.classList.add('dragging'); });
    el.addEventListener('dragend', () => { draggedEl = null; el.classList.remove('dragging'); clearDropIndicators(); });

    // action buttons
    el.querySelector('.delete-btn').addEventListener('click', () => el.remove());
    el.querySelector('.edit-btn').addEventListener('click', () => startEdit(el));
    return el;
}

function clearDropIndicators() {
    document.querySelectorAll('.task-list, .column').forEach(z => z.classList.remove('drop-zone'));
}

// ==== Drag & Drop ====
function enableDropZones() {
    document.querySelectorAll('.task-list').forEach(zone => {
        zone.addEventListener('dragover', e => { e.preventDefault(); });
        zone.addEventListener('dragenter', function () { this.classList.add('drop-zone'); });
        zone.addEventListener('dragleave', function (e) { if (!this.contains(e.relatedTarget)) this.classList.remove('drop-zone'); });
        zone.addEventListener('drop', function (e) {
            e.preventDefault();
            if (draggedEl) this.appendChild(draggedEl);
            clearDropIndicators();
        });
    });
}

// ==== Modal helpers ====
function openModal(column = 'pending') {
    currentColumn = column;
    document.getElementById('taskModal').style.display = 'block';
    document.getElementById('taskTitle').focus();
}

function closeModal() {
    document.getElementById('taskModal').style.display = 'none';
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDescription').value = '';
    document.getElementById('taskDue').value = '';
    document.getElementById('taskCollab').value = '';
    editingEl = null;
}

// ==== CRUD ====
function addOrUpdateTask() {
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim() || 'No description';
    const due = document.getElementById('taskDue').value || 'No due date';
    const collab = document.getElementById('taskCollab').value.trim();
    if (!title) { alert('Title required'); return; }

    if (editingEl) {
        // Update
        editingEl.querySelector('.task-title').textContent = title;
        editingEl.querySelector('.task-description').textContent = description;
        editingEl.querySelector('.task-due').textContent = 'Due: ' + due;
        editingEl.dataset.due = due !== 'No due date' ? due : '';
        const collabEl = editingEl.querySelector('.task-collab');
        if (collab) {
            if (collabEl) collabEl.textContent = 'With: ' + collab;
            else {
                const c = document.createElement('div'); c.className='task-collab'; c.textContent='With: '+collab; editingEl.appendChild(c);
            }
        } else if (collabEl) collabEl.remove();
    } else {
        // Create new
        const obj = { id: Date.now(), title, description, due, collab, column: currentColumn };
        const el = createTaskElement(obj);
        document.querySelector(`[data-column="${currentColumn}"]`).appendChild(el);
    }
    closeModal();
    sortTasks();
}

function startEdit(el) {
    editingEl = el;
    currentColumn = el.parentElement.dataset.column;
    document.getElementById('taskTitle').value = el.querySelector('.task-title').textContent;
    document.getElementById('taskDescription').value = el.querySelector('.task-description').textContent;
    const dueTxt = el.querySelector('.task-due').textContent.replace('Due: ','');
    document.getElementById('taskDue').value = (dueTxt !== 'No due date') ? dueTxt : '';
    const collabEl = el.querySelector('.task-collab');
    document.getElementById('taskCollab').value = collabEl ? collabEl.textContent.replace('With: ','') : '';
    openModal(currentColumn);
}

// ==== Search & Sort ====
function handleSearch(e) {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('.task').forEach(t => {
        t.style.display = t.innerText.toLowerCase().includes(q) ? '' : 'none';
    });
}

function sortTasks() {
    document.querySelectorAll('.task-list').forEach(list => {
        const tasks = Array.from(list.querySelectorAll('.task'));
        tasks.sort((a,b)=>{
            const ad=a.dataset.due, bd=b.dataset.due;
            if(!ad) return 1; if(!bd) return -1;
            return new Date(ad)-new Date(bd);
        });
        tasks.forEach(t=>list.appendChild(t));
    });
}

// ==== Event Handlers ====
// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('taskModal');
    if (event.target === modal) {
        closeModal();
    }
};

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal();
    }
});

// ==== Init ====
function init() {
    // sample tasks
    sampleTasks.forEach(t => {
        const el = createTaskElement(t);
        document.querySelector(`[data-column="${t.column}"]`).appendChild(el);
    });
    enableDropZones();
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    document.getElementById('sortBtn').addEventListener('click', sortTasks);
    document.querySelector('.add-task') && document.querySelectorAll('.add-task').forEach(btn => btn.addEventListener('click', e => openModal(e.target.closest('.column').querySelector('.task-list').dataset.column)));
    document.getElementById('taskModal').addEventListener('click', e => { if(e.target.id==='taskModal') closeModal(); });
    document.getElementById('saveTaskBtn').addEventListener('click', addOrUpdateTask);
}

document.addEventListener('DOMContentLoaded', init);
