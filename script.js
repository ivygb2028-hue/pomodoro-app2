class Timer {
    constructor() {
        this.timeDisplay = document.getElementById('time-display');
        this.startPauseBtn = document.getElementById('start-pause-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.workModeBtn = document.getElementById('work-mode');
        this.breakModeBtn = document.getElementById('break-mode');

        // Settings inputs
        this.workDurationInput = document.getElementById('work-duration');
        this.breakDurationInput = document.getElementById('break-duration');

        this.timeLeft = 25 * 60;
        this.timerId = null;
        this.isRunning = false;
        this.mode = 'work'; // 'work' or 'break'

        this.durations = {
            work: 25 * 60,
            break: 5 * 60
        };

        this.init();
    }

    init() {
        this.updateDisplay();

        this.startPauseBtn.addEventListener('click', () => this.toggleTimer());
        this.resetBtn.addEventListener('click', () => this.resetTimer());

        this.workModeBtn.addEventListener('click', () => this.switchMode('work'));
        this.breakModeBtn.addEventListener('click', () => this.switchMode('break'));

        // Settings Listeners
        this.workDurationInput.addEventListener('change', (e) => this.updateDuration('work', e.target.value));
        this.breakDurationInput.addEventListener('change', (e) => this.updateDuration('break', e.target.value));
    }

    updateDuration(mode, minutes) {
        this.durations[mode] = minutes * 60;
        if (!this.isRunning && this.mode === mode) {
            this.timeLeft = this.durations[mode];
            this.updateDisplay();
        }
    }

    switchMode(mode) {
        this.mode = mode;
        this.timeLeft = this.durations[mode];
        this.updateDisplay();
        this.stopTimer(); // Always stop when switching manually
        this.updateModeUI();
    }

    updateModeUI() {
        if (this.mode === 'work') {
            this.workModeBtn.classList.add('active');
            this.breakModeBtn.classList.remove('active');
            document.body.style.setProperty('--primary-color', '#9f7aea'); // Medium Purple
        } else {
            this.breakModeBtn.classList.add('active');
            this.workModeBtn.classList.remove('active');
            document.body.style.setProperty('--primary-color', '#d6bcfa'); // Soft Purple
        }
    }

    toggleTimer() {
        if (this.isRunning) {
            this.stopTimer();
        } else {
            this.startTimer();
        }
    }

    startTimer() {
        this.isRunning = true;
        this.startPauseBtn.textContent = 'Pause';
        this.startPauseBtn.classList.add('active');

        this.timerId = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();

            if (this.timeLeft <= 0) {
                this.timerComplete();
            }
        }, 1000);
    }

    stopTimer() {
        this.isRunning = false;
        this.startPauseBtn.textContent = 'Start';
        this.startPauseBtn.classList.remove('active');
        clearInterval(this.timerId);
    }

    resetTimer() {
        this.stopTimer();
        this.timeLeft = this.durations[this.mode];
        this.updateDisplay();
    }

    timerComplete() {
        this.stopTimer();
        this.playChime();
        this.startPauseBtn.textContent = 'Start';
        this.isRunning = false;

        // Visual feedback
        document.title = 'Done! - Focus';
        this.timeDisplay.style.color = 'var(--primary-color)';
        setTimeout(() => {
            this.timeDisplay.style.color = 'var(--text-color)';
        }, 3000);
    }

    playChime() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
            osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.1); // C6

            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);

            osc.start();
            osc.stop(ctx.currentTime + 2);
        } catch (e) {
            console.error('Audio playback failed', e);
        }
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.title = `${this.timeDisplay.textContent} - Focus`;
    }
}

class TaskManager {
    constructor() {
        this.input = document.getElementById('new-task-input');
        this.addBtn = document.getElementById('add-task-btn');
        this.list = document.getElementById('task-list');

        this.tasks = JSON.parse(localStorage.getItem('pomodoro-tasks')) || [];

        this.init();
    }

    init() {
        this.renderTasks();
        this.addBtn.addEventListener('click', () => this.addTask());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
    }

    addTask() {
        const text = this.input.value.trim();
        if (!text) return;

        const task = {
            id: Date.now(),
            text,
            completed: false
        };

        this.tasks.push(task);
        this.saveTasks();
        this.renderTasks();
        this.input.value = '';
    }

    toggleTask(id) {
        this.tasks = this.tasks.map(task =>
            task.id === id ? { ...task, completed: !task.completed } : task
        );
        this.saveTasks();
        this.renderTasks();
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveTasks();
        this.renderTasks();
    }

    saveTasks() {
        localStorage.setItem('pomodoro-tasks', JSON.stringify(this.tasks));
    }

    renderTasks() {
        this.list.innerHTML = '';
        this.tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;

            li.innerHTML = `
                <div class="task-checkbox">
                    ${task.completed ? '✓' : ''}
                </div>
                <span class="task-text">${task.text}</span>
                <button class="delete-task-btn" aria-label="Delete">
                    &times;
                </button>
            `;

            // Event Listeners
            const checkbox = li.querySelector('.task-checkbox');
            checkbox.addEventListener('click', () => this.toggleTask(task.id));

            const deleteBtn = li.querySelector('.delete-task-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // prevent triggering toggle
                this.deleteTask(task.id);
            });

            this.list.appendChild(li);
        });
    }
}

class SettingsManager {
    constructor() {
        this.modal = document.getElementById('settings-modal');
        this.openBtn = document.getElementById('settings-btn');
        this.closeBtn = document.getElementById('close-settings-btn');

        this.openBtn.addEventListener('click', () => this.open());
        this.closeBtn.addEventListener('click', () => this.close());

        // Close on outside click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });
    }

    open() {
        this.modal.classList.remove('hidden');
    }

    close() {
        this.modal.classList.add('hidden');
    }
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    const timer = new Timer();
    const tasks = new TaskManager();
    const settings = new SettingsManager();
});
