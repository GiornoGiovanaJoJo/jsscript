// background.js - Message Router for Campaign Automation
// Service Worker для Manifest V3

console.log('[Background] Service Worker инициализирован для обработки динамических параметров');

// Слушаем установку расширения
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('[Background] Расширение установлено');
    } else if (details.reason === 'update') {
        console.log('[Background] Расширение обновлено');
    }
});

// Обработка сообщений от popup и content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    handleMessage(request, sender, sendResponse);
    return true; // Сохранить канал открытым для асинхронного ответа
});

async function handleMessage(request, sender, sendResponse) {
    try {
        console.log('[Background] Получено сообщение:', request.action);
        
        // Загрузить конфиг из хранилища
        const stored = await loadStorageConfig();
        const config = request.config || stored;
        console.log('[Background] Конфиг:', config);

        switch (request.action) {
            case 'START_FULL_PIPELINE':
                console.log('[Background] Запуск полного цикла с динамическими параметрами:', config);
                sendResponse({ status: 'pipeline_started', timestamp: Date.now() });
                
                // Отправить активной вкладке (страница Google Ads)
                const activeTab = await getActiveTab();
                if (activeTab) {
                    console.log('[Background] Отправка команды на вкладку:', activeTab.id);
                    chrome.tabs.sendMessage(activeTab.id, {
                        action: 'START_FULL_PIPELINE',
                        config: config
                    }).catch(err => console.error('[Background] Ошибка отправки на вкладку:', err));
                }
                break;

            case 'RUN_CAMPAIGN_ONLY':
                console.log('[Background] Запуск только кампании с конфигом:', config);
                sendResponse({ status: 'campaign_started', timestamp: Date.now() });
                
                const tabCampaign = await getActiveTab();
                if (tabCampaign) {
                    chrome.tabs.sendMessage(tabCampaign.id, {
                        action: 'RUN_CAMPAIGN_ONLY',
                        config: config
                    }).catch(err => console.error('[Background] Ошибка отправки:', err));
                }
                break;

            case 'RUN_TRACKING_SCRIPT':
                console.log('[Background] Запуск tracking script для аккаунта:', config.account_name);
                sendResponse({ status: 'tracking_started', timestamp: Date.now() });
                
                const tabTracking = await getActiveTab();
                if (tabTracking) {
                    chrome.tabs.sendMessage(tabTracking.id, {
                        action: 'RUN_TRACKING_SCRIPT',
                        config: config
                    }).catch(err => console.error('[Background] Ошибка отправки:', err));
                }
                break;

            case 'SAVE_CONFIG':
                await saveStorageConfig(config);
                console.log('[Background] Конфиг сохранен:', config);
                sendResponse({ status: 'config_saved' });
                break;

            case 'LOAD_CONFIG':
                const loadedConfig = await loadStorageConfig();
                console.log('[Background] Конфиг загружен:', loadedConfig);
                sendResponse({ status: 'config_loaded', config: loadedConfig });
                break;

            case 'CLEAR_CONFIG':
                await chrome.storage.local.remove(['campaignConfig']);
                console.log('[Background] Конфиг очищен');
                sendResponse({ status: 'config_cleared' });
                break;

            case 'LOG':
                console.log('[Content]', request.message);
                sendResponse({ status: 'logged' });
                break;

            default:
                console.warn('[Background] Неизвестное действие:', request.action);
                sendResponse({ status: 'unknown_action' });
        }
    } catch (error) {
        console.error('[Background] Ошибка:', error);
        sendResponse({ status: 'error', message: error.message });
    }
}

async function getActiveTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs.length > 0 ? tabs[0] : null;
}

async function loadStorageConfig() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['campaignConfig'], (result) => {
            resolve(result.campaignConfig || {});
        });
    });
}

async function saveStorageConfig(config) {
    return new Promise((resolve) => {
        chrome.storage.local.set({ campaignConfig: config }, resolve);
    });
}

// Создать алерм для периодического выполнения задач
try {
    chrome.alarms.create('trackingScriptUpdate', { periodInMinutes: 60 });
    console.log('[Background] Алерм trackingScriptUpdate создан для периодических обновлений');
} catch (error) {
    console.log('[Background] Ошибка при создании алерма:', error.message);
}

// Обработчик срабатывания алерма
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'trackingScriptUpdate') {
        console.log('[Background] Запуск периодической задачи трекинга по расписанию...');
        // Логика периодического обновления tracking script
        loadStorageConfig().then(config => {
            if (config.auto_run_tracking) {
                console.log('[Background] Периодический трекинг включен для аккаунта:', config.account_name);
                // Можно отправить команду на активную вкладку для обновления
            }
        });
    }
});

console.log('[Background] Расширение готово обрабатывать автоматизацию кампаний со всеми динамическими параметрами');
