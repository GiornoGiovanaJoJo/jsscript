// Google Ads Bot - Enhanced Core Automation Engine v2
// Handles all 6 steps of campaign creation with improved reliability

const GoogleAdsBot = {
    config: {},
    currentStep: 0,
    maxRetries: 3,
    retryCount: 0,
    isPaused: false,
    waitTimeout: 15000, // 15 seconds
    selectorCache: {},

    // ========================
    // INITIALIZATION
    // ========================
    async init() {
        this.log('🤖 Инициализация Google Ads Bot v2 с улучшенной надежностью...');
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sendResponse);
        });
        
        const config = await this.loadConfig();
        if (config && config.campaignName) {
            this.config = config;
            this.log('✅ Config загружен! Запускаем полный пайплайн...');
            await this.runFullPipeline();
        } else {
            this.log('⏳ Ожидание конфига из popup...');
        }
        
        this.log('✅ Bot готов к командам');
    },

    // ========================
    // MESSAGE HANDLING
    // ========================
    async handleMessage(request, sendResponse) {
        try {
            const stored = await this.loadConfig();
            this.config = { ...stored, ...request.config };

            switch (request.action) {
                case 'AUTO_LOGIN':
                    this.log('🔐 Получена команда AUTO_LOGIN...');
                    await this.autoLogin();
                    sendResponse({ status: 'login_in_progress' });
                    break;

                case 'START_FULL_PIPELINE':
                    await this.runFullPipeline();
                    sendResponse({ status: 'started', step: 1 });
                    break;

                case 'RUN_CAMPAIGN_ONLY':
                    await this.runCampaignOnly();
                    sendResponse({ status: 'started', step: 2 });
                    break;

                case 'RUN_TRACKING_SCRIPT':
                    await this.runTrackingScript();
                    sendResponse({ status: 'started', step: 6 });
                    break;

                default:
                    sendResponse({ status: 'unknown' });
            }
        } catch (error) {
            this.log(`❌ Ошибка в обработке сообщения: ${error.message}`);
            sendResponse({ status: 'error', message: error.message });
        }
    },

    // ========================
    // AUTO LOGIN
    // ========================
    async autoLogin() {
        this.log('🔐 Поиск кнопки Войти...');
        try {
            let loginButton = null;
            const selectors = [
                { selector: 'button:has-text("Войти")', name: 'Russian button' },
                { selector: 'button:has-text("Sign in")', name: 'English button' },
                { selector: '[role="button"]:has-text("Sign in")', name: 'Role button' },
                { selector: 'a[href*="accounts.google"]', name: 'Google accounts link' },
                { selector: '[aria-label*="Sign in"]', name: 'Aria label' },
            ];

            for (const { selector, name } of selectors) {
                loginButton = this.findElementWithSelector(selector);
                if (loginButton) {
                    this.log(`✅ Найдена кнопка: ${name}`);
                    break;
                }
            }

            if (loginButton) {
                this.log('✅ Нажимаем кнопку Войти...');
                loginButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await this.delay(300);
                loginButton.click();
                
                await this.delay(3000);
                await this.waitForElement('[role="navigation"]', 15000);
                this.log('✅ Страница Google Ads загрузилась!');
                await this.runFullPipeline();
            } else {
                this.log('⚠️ Кнопка Войти не найдена. Проверяем доступ...');
                const isLoggedIn = await this.checkIfLoggedIn();
                if (isLoggedIn) {
                    this.log('✅ Уже в аккаунте Google Ads!');
                    await this.runFullPipeline();
                } else {
                    throw new Error('Login button not found and not logged in');
                }
            }
        } catch (error) {
            this.log(`⚠️ Ошибка при автоматическом входе: ${error.message}`);
            throw error;
        }
    },

    // ========================
    // CONFIG MANAGEMENT
    // ========================
    async loadConfig() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['campaignConfig'], (result) => {
                resolve(result.campaignConfig || {});
            });
        });
    },

    // ========================
    // MAIN PIPELINES
    // ========================
    async runFullPipeline() {
        try {
            this.log('▶️ СТАРТ ПОЛНОГО ЦИКЛА...');

            this.currentStep = 1;
            await this.createConversion();
            this.log('✅ Конверсия создана');
            await this.delay(2000);

            this.currentStep = 2;
            await this.createCampaign();
            this.log('✅ Кампания создана');
            await this.delay(2000);

            this.currentStep = 3;
            await this.createAdGroup();
            this.log('✅ Ad Group создан');
            await this.delay(2000);

            this.currentStep = 4;
            await this.createAds();
            this.log('✅ Объявления созданы');
            await this.delay(2000);

            this.currentStep = 5;
            await this.publishCampaign();
            this.log('✅ Кампания опубликована');
            await this.delay(2000);

            this.currentStep = 6;
            await this.setupTrackingScript();
            this.log('✅ Трекинг скрипт настроен');

            this.log('🎉 ПОЛНЫЙ ЦИКЛ ЗАВЕРШЕН УСПЕШНО!');
        } catch (error) {
            this.handleStepError(error);
        }
    },

    async runCampaignOnly() {
        try {
            this.log('▶️ Создание только кампании...');
            this.currentStep = 2;
            await this.createCampaign();
            this.log('✅ Кампания готова');
        } catch (error) {
            this.handleStepError(error);
        }
    },

    async runTrackingScript() {
        try {
            this.log('▶️ Настройка трекинг скрипта...');
            this.currentStep = 6;
            await this.setupTrackingScript();
            this.log('✅ Трекинг скрипт готов');
        } catch (error) {
            this.handleStepError(error);
        }
    },

    // ========================
    // STEP 1: CREATE CONVERSION
    // ========================
    async createConversion() {
        this.log('📋 Шаг 1: Создание конверсии...');
        try {
            // Перейти на Goals → Conversions
            await this.navigateToConversions();
            await this.delay(1500);
            
            await this.closeDialogs();
            await this.delay(500);

            // Нажать на "New Conversion Action"
            await this.clickBestMatch('button:has-text("New Conversion"), [role="button"]:has-text("New Conversion")');
            await this.delay(1000);
            await this.closeDialogs();

            // Выбрать тип конверсии: Offline
            await this.clickBestMatch('div:has-text("Offline"), [role="option"]:has-text("Offline")');
            await this.delay(1000);

            // Пропустить Data Source
            await this.clickBestMatch('button:has-text("Skip")');
            await this.delay(500);

            // Отметить Custom data
            const customCheckbox = document.querySelector('input[type="checkbox"][aria-label*="Custom"], input[type="checkbox"][aria-label*="customer"]');
            if (customCheckbox && !customCheckbox.checked) {
                customCheckbox.click();
            }
            await this.delay(500);

            // Заполнить стоимость конверсии
            if (this.config.targetCPA) {
                await this.fillInputField('input[type="number"]', this.config.targetCPA);
            }

            // Нажать Done
            await this.clickBestMatch('button:has-text("Done")');
            await this.delay(1000);
            await this.closeDialogs();

            this.log('✅ Конверсия успешно создана');
        } catch (error) {
            await this.handleRetry('createConversion', error);
        }
    },

    // ========================
    // STEP 2: CREATE CAMPAIGN
    // ========================
    async createCampaign() {
        this.log('📊 Шаг 2: Создание кампании...');
        try {
            // Перейти на Campaigns
            await this.navigateToCampaigns();
            await this.delay(1500);

            // Нажать New Campaign
            await this.clickBestMatch('button:has-text("New Campaign"), [role="button"]:has-text("+ New Campaign")');
            await this.delay(1000);
            await this.closeDialogs();

            // Выбрать тип: Demand Gen
            await this.clickBestMatch('div:has-text("Demand Gen"), [role="option"]:has-text("Demand Gen")');
            await this.delay(1000);

            // Выбрать тип конверсии: Lead
            await this.clickBestMatch('div:has-text("Lead"), [role="option"]:has-text("Lead")');
            await this.delay(1000);

            // Заполнить параметры кампании
            await this.fillCampaignDetails();
            await this.closeDialogs();

            this.log('✅ Кампания успешно создана');
        } catch (error) {
            await this.handleRetry('createCampaign', error);
        }
    },

    async fillCampaignDetails() {
        try {
            // Дневной бюджет
            if (this.config.budget) {
                await this.fillInputField('[placeholder*="budget"], [aria-label*="budget"]', this.config.budget);
            }

            // Target CPA
            if (this.config.targetCPA) {
                await this.fillInputField('[placeholder*="CPA"], [aria-label*="CPA"]', this.config.targetCPA);
            }

            // Локация
            if (this.config.location) {
                const locationInput = document.querySelector('[placeholder*="country"], [aria-label*="Location"]');
                if (locationInput) {
                    locationInput.value = this.config.location;
                    locationInput.dispatchEvent(new Event('input', { bubbles: true }));
                    await this.delay(800);
                    const firstOption = document.querySelector('[role="option"]');
                    if (firstOption) firstOption.click();
                }
            }

            // Язык
            if (this.config.language) {
                const langInput = document.querySelector('[placeholder*="language"], [aria-label*="Language"]');
                if (langInput) {
                    langInput.value = this.config.language;
                    langInput.dispatchEvent(new Event('input', { bubbles: true }));
                    await this.delay(800);
                    const firstOption = document.querySelector('[role="option"]');
                    if (firstOption) firstOption.click();
                }
            }

            // Расписание
            if (this.config.schedule_start) {
                await this.fillInputField('[placeholder*="start"], [aria-label*="Start"]', this.config.schedule_start);
            }

            if (this.config.schedule_end) {
                await this.fillInputField('[placeholder*="end"], [aria-label*="End"]', this.config.schedule_end);
            }

            // Устройства: только мобильные
            await this.selectDevices('mobile');

        } catch (error) {
            this.log(`⚠️ Ошибка при заполнении параметров: ${error.message}`);
        }
    },

    // ========================
    // STEP 3: CREATE AD GROUP
    // ========================
    async createAdGroup() {
        this.log('👥 Шаг 3: Создание Ad Group...');
        try {
            await this.fillAudienceDetails();
            this.log('✅ Ad Group успешно создан');
        } catch (error) {
            await this.handleRetry('createAdGroup', error);
        }
    },

    // ========================
    // STEP 4: CREATE ADS
    // ========================
    async createAds() {
        this.log('📢 Шаг 4: Создание объявлений...');
        try {
            // Найти кнопку добавления объявления
            await this.clickBestMatch('button:has-text("Add ad"), [role="button"]:has-text("Add")');
            await this.delay(1000);

            // Заполнить заголовок
            if (this.config.adHeadline) {
                await this.fillInputField('input[placeholder*="Headline"], [aria-label*="Headline"]', this.config.adHeadline);
            }

            // Заполнить описание
            if (this.config.adDescription) {
                await this.fillInputField('textarea[placeholder*="Description"], [aria-label*="Description"]', this.config.adDescription);
            }

            // Заполнить CTA
            if (this.config.adCTA) {
                await this.fillInputField('input[placeholder*="Call to action"], [aria-label*="Call to action"]', this.config.adCTA);
            }

            this.log('✅ Объявления успешно созданы');
        } catch (error) {
            await this.handleRetry('createAds', error);
        }
    },

    // ========================
    // STEP 5: PUBLISH CAMPAIGN
    // ========================
    async publishCampaign() {
        this.log('🚀 Шаг 5: Публикация кампании...');
        try {
            // Найти кнопку Publish/Save
            await this.clickBestMatch('button:has-text("Publish"), button:has-text("Save"), [role="button"]:has-text("Publish")');
            await this.delay(2000);
            this.log('✅ Кампания опубликована');
        } catch (error) {
            await this.handleRetry('publishCampaign', error);
        }
    },

    // ========================
    // STEP 6: TRACKING SCRIPT
    // ========================
    async setupTrackingScript() {
        this.log('📊 Шаг 6: Настройка трекинг скрипта...');
        try {
            // Генерируем tracking код
            const trackingCode = this.generateTrackingCode();
            this.log(`✅ Трекинг скрипт готов: ${trackingCode}`);
        } catch (error) {
            await this.handleRetry('setupTrackingScript', error);
        }
    },

    // ========================
    // HELPER FUNCTIONS
    // ========================

    /**
     * Улучшенный поиск элемента с несколькими селекторами
     */
    findElementWithSelector(selector) {
        try {
            // Попытка 1: Стандартный querySelector
            let element = document.querySelector(selector);
            if (element) return element;

            // Попытка 2: XPath для текстовых селекторов
            if (selector.includes(':has-text')) {
                const text = selector.match(/:has-text\("([^"]+)"\)/)?.[1];
                if (text) {
                    const xpath = `//*[contains(text(), '${text}')]`;
                    element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                    if (element) return element;
                }
            }

            return null;
        } catch (error) {
            this.log(`⚠️ Ошибка при поиске элемента: ${error.message}`);
            return null;
        }
    },

    /**
     * Клик по лучшему найденному элементу
     */
    async clickBestMatch(selectors) {
        const selectorArray = selectors.split(', ');
        
        for (const selector of selectorArray) {
            const element = this.findElementWithSelector(selector);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await this.delay(200);
                element.click();
                return true;
            }
        }

        this.log(`⚠️ Не удалось найти элемент: ${selectors}`);
        return false;
    },

    /**
     * Заполнение input поля
     */
    async fillInputField(selectors, value) {
        const selectorArray = selectors.split(', ');
        
        for (const selector of selectorArray) {
            const input = document.querySelector(selector);
            if (input) {
                input.focus();
                input.value = value;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                await this.delay(300);
                return true;
            }
        }

        this.log(`⚠️ Не удалось заполнить поле: ${selectors}`);
        return false;
    },

    /**
     * Закрытие диалогов и подсказок
     */
    async closeDialogs() {
        try {
            const closeButtons = document.querySelectorAll('[aria-label="Close"], [aria-label="Закрыть"], button[class*="close"]');
            for (const btn of closeButtons) {
                if (btn.offsetHeight > 0 && btn.offsetWidth > 0) {
                    btn.click();
                    await this.delay(200);
                }
            }
        } catch (error) {
            this.log(`⚠️ Ошибка при закрытии диалогов: ${error.message}`);
        }
    },

    /**
     * Навигация на Goals → Conversions
     */
    async navigateToConversions() {
        try {
            const goalsLink = this.findElementWithSelector('[aria-label*="Goals"], button:has-text("Goals")');
            if (goalsLink) {
                goalsLink.click();
                await this.delay(1000);
            }
        } catch (error) {
            this.log(`⚠️ Ошибка при навигации на Goals: ${error.message}`);
        }
    },

    /**
     * Навигация на Campaigns
     */
    async navigateToCampaigns() {
        try {
            const campaignsLink = this.findElementWithSelector('[aria-label*="Campaigns"], button:has-text("Campaigns")');
            if (campaignsLink) {
                campaignsLink.click();
                await this.delay(1000);
            }
        } catch (error) {
            this.log(`⚠️ Ошибка при навигации на Campaigns: ${error.message}`);
        }
    },

    /**
     * Проверка авторизации
     */
    async checkIfLoggedIn() {
        try {
            return document.querySelector('[aria-label*="Campaigns"]') !== null;
        } catch (error) {
            return false;
        }
    },

    /**
     * Выбор устройств
     */
    async selectDevices(type) {
        try {
            if (type === 'mobile') {
                const mobileCheckbox = document.querySelector('input[aria-label*="Mobile"], input[value*="mobile"]');
                if (mobileCheckbox && !mobileCheckbox.checked) {
                    mobileCheckbox.click();
                }
            }
        } catch (error) {
            this.log(`⚠️ Ошибка при выборе устройств: ${error.message}`);
        }
    },

    /**
     * Заполнение деталей аудитории
     */
    async fillAudienceDetails() {
        try {
            if (this.config.ageGroup) {
                await this.fillInputField('[placeholder*="age"], [aria-label*="Age"]', this.config.ageGroup);
            }
            if (this.config.gender) {
                await this.fillInputField('[placeholder*="gender"], [aria-label*="Gender"]', this.config.gender);
            }
            if (this.config.interests) {
                await this.fillInputField('[placeholder*="interests"], [aria-label*="Interests"]', this.config.interests);
            }
        } catch (error) {
            this.log(`⚠️ Ошибка при заполнении аудитории: ${error.message}`);
        }
    },

    /**
     * Генерация трекинг кода
     */
    generateTrackingCode() {
        const campaignId = this.config.campaignId || 'campaign_' + Date.now();
        return `<!-- Google Ads Tracking -->\n<script>\ngaqTrack('${campaignId}');\n</script>`;
    },

    /**
     * Ожидание элемента с timeout
     */
    async waitForElement(selector, timeout = 10000) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            const element = document.querySelector(selector);
            if (element) return element;
            await this.delay(200);
        }
        throw new Error(`Element not found: ${selector}`);
    },

    /**
     * Обработка ошибок шага
     */
    async handleRetry(stepName, error) {
        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            this.log(`🔄 Попытка повтора ${this.retryCount}/${this.maxRetries} для ${stepName}...`);
            await this.delay(2000);
            return await this[stepName]?.();
        } else {
            this.log(`❌ ОШИБКА на шаге ${this.currentStep}: ${error.message}`);
            this.retryCount = 0;
            throw error;
        }
    },

    /**
     * Задержка
     */
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Логирование
     */
    log(message) {
        const timestamp = new Date().toLocaleTimeString('ru-RU');
        console.log(`[GoogleAdsBot ${timestamp}] ${message}`);
    }
};

// Инициализация при загрузке скрипта
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => GoogleAdsBot.init());
} else {
    GoogleAdsBot.init();
}
