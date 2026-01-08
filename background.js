// Фоновый скрипт (Service Worker для MV3)

console.log('[Background] Service Worker инициализирован');

// Слушаем установку расширения
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('[Background] Расширение установлено');
        // Открыть страницу с инструкциями
        chrome.tabs.create({
            url: 'popup.html'
        });
    } else if (details.reason === 'update') {
        console.log('[Background] Расширение обновлено');
    }
});

// Обработка сообщений от content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[Background] Получено сообщение:', request);
    sendResponse({ received: true });
});

// Периодическое выполнение задач
chrome.alarms.create('trackingScriptUpdate', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'trackingScriptUpdate') {
        console.log('[Background] Запуск периодической задачи трекинга...');
        // Логика периодического обновления
    }
});
