// Инициализация интерфейса
document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    loadSettings();
    setupEventListeners();
});

// Управление вкладками
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');

            // Скрыть все вкладки
            tabContents.forEach(content => {
                content.classList.remove('active');
            });

            // Убрать активный класс со всех кнопок
            tabButtons.forEach(btn => {
                btn.classList.remove('active');
            });

            // Показать выбранную вкладку
            document.getElementById(tabName).classList.add('active');
            button.classList.add('active');
        });
    });
}

// Загрузка сохранённых настроек
function loadSettings() {
    chrome.storage.sync.get(null, (items) => {
        Object.keys(items).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = items[key];
                } else {
                    element.value = items[key];
                }
            }
        });
    });
}

// Сохранение настроек
function saveSettings() {
    const settings = {};
    const inputs = document.querySelectorAll('input, textarea, select');

    inputs.forEach(input => {
        if (input.id) {
            if (input.type === 'checkbox') {
                settings[input.id] = input.checked;
            } else {
                settings[input.id] = input.value;
            }
        }
    });

    chrome.storage.sync.set(settings, () => {
        showNotification('✅ Настройки сохранены');
    });
}

// Экспорт настроек
function exportSettings() {
    chrome.storage.sync.get(null, (items) => {
        const dataStr = JSON.stringify(items, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `google-ads-bot-settings-${Date.now()}.json`;
        link.click();
        showNotification('📥 Настройки экспортированы');
    });
}

// Импорт настроек
function importSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const settings = JSON.parse(event.target.result);
                chrome.storage.sync.set(settings, () => {
                    showNotification('📤 Настройки импортированы');
                    loadSettings();
                });
            } catch (err) {
                showNotification('❌ Ошибка при импорте файла');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// Сброс настроек
function resetSettings() {
    if (confirm('Вы уверены? Это действие удалит все настройки.')) {
        chrome.storage.sync.clear(() => {
            document.querySelectorAll('input, textarea, select').forEach(el => {
                if (el.type === 'checkbox') {
                    el.checked = false;
                } else {
                    el.value = '';
                }
            });
            showNotification('🔄 Настройки сброшены');
        });
    }
}

// Запуск полного цикла
function runFullPipeline() {
    saveSettings();
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
            action: 'START_FULL_PIPELINE'
        }, (response) => {
            if (response) {
                showNotification('▶️ Запуск полного цикла...');
            }
        });
    });
}

// Запуск только трекинг скрипта
function runTrackingOnly() {
    saveSettings();
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
            action: 'RUN_TRACKING_SCRIPT'
        }, (response) => {
            if (response) {
                showNotification('⚡ Запуск трекинг скрипта...');
            }
        });
    });
}

// Уведомления
function showNotification(message) {
    console.log(message);
    // Можно добавить визуальное уведомление
}

// Подключение обработчиков событий
function setupEventListeners() {
    document.getElementById('save-button').addEventListener('click', saveSettings);
    document.getElementById('export-button').addEventListener('click', exportSettings);
    document.getElementById('import-button').addEventListener('click', importSettings);
    document.getElementById('reset-button').addEventListener('click', resetSettings);
    document.getElementById('run-full-pipeline').addEventListener('click', runFullPipeline);
    document.getElementById('run-tracking-only').addEventListener('click', runTrackingOnly);
}
