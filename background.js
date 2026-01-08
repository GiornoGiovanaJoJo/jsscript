// Фоновый скрипт (Service Worker для MV3)

console.log('[Background] Service Worker инициализирован');

// Слушаем установку расширения
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('[Background] Расширение установлено');
        // Открыть страницу настроек (опционально)
        // chrome.tabs.create({ url: 'popup.html' });
    } else if (details.reason === 'update') {
        console.log('[Background] Расширение обновлено');
    }
});

// Обработка сообщений от content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[Background] Получено сообщение:', request);
    sendResponse({ received: true });
    return true; // Сохранить канал открытым для асинхронного ответа
});

// Создать алерм для периодического выполнения задач
try {
    chrome.alarms.create('trackingScriptUpdate', { periodInMinutes: 60 });
    console.log('[Background] Алерм trackingScriptUpdate создан');
} catch (error) {
    console.log('[Background] Ошибка при создании алерма:', error.message);
}

// Обработчик срабатывания алерма
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'trackingScriptUpdate') {
        console.log('[Background] Запуск периодической задачи трекинга...');
        // Здесь можно добавить логику периодического обновления
    }
});
