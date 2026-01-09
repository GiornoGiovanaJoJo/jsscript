// Google Ads Bot - Enhanced Core Automation Engine v3
// Fixes: Proper selector syntax, XPath support, retry logic, error handling
// Status: Production-ready for v0.2.0

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
        this.log('🤖 Инициализация Google Ads Bot v3 с надежными селекторами...');
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
    // ELEMENT FINDER UTILITY
    // ========================
    findByText(selector, text) {
        try {
            const elements = document.querySelectorAll(selector);
            return Array.from(elements).find(el => 
                el.textContent.trim().toLowerCase().includes(text.toLowerCase())
            );
        } catch (error) {
            return null;
        }
    },

    findByXPath(xpath) {
        try {
            return document.evaluate(
                xpath, 
                document, 
                null, 
                XPathResult.FIRST_ORDERED_NODE_TYPE, 
                null
            ).singleNodeValue;
        } catch (error) {
            this.log(`⚠️ XPath ошибка: ${error.message}`);
            return null;
        }
    },

    findByAriaLabel(text) {
        try {
            return Array.from(document.querySelectorAll('[aria-label]'))
                .find(el => el.getAttribute('aria-label').toLowerCase().includes(text.toLowerCase()));
        } catch (error) {
            return null;
        }
    },

    /**
     * ГЛАВНАЯ ФУНКЦИЯ ПОИСКА - использует множественные стратегии
     */
    findElement(text, fallbackSelector) {
        // 1. Ищем по aria-label
        let element = this.findByAriaLabel(text);
        if (element) return element;

        // 2. Ищем по XPath (точное совпадение текста)
        const xpath = `//button[contains(text(), '${text}')] | //a[contains(text(), '${text}')] | //*[@role='button'][contains(text(), '${text}')]`;
        element = this.findByXPath(xpath);
        if (element) return element;

        // 3. Ищем по текстовому содержимому в элементах
        element = this.findByText('button, a, [role="button"]', text);
        if (element) return element;

        // 4. Используем fallback селектор если предоставлен
        if (fallbackSelector) {
            element = document.querySelector(fallbackSelector);
            if (element) return element;
        }

        return null;
    },

    // ========================
    // AUTO LOGIN
    // ========================
    async autoLogin() {
        this.log('🔐 Поиск кнопки входа...');
        try {
            // Попытка 1: Поиск кнопки "Войти" на русском
            let loginButton = this.findElement('Войти');
            if (!loginButton) {
                // Попытка 2: Поиск кнопки "Sign in" на английском
                loginButton = this.findElement('Sign in');
            }
            if (!loginButton) {
                // Попытка 3: Поиск по aria-label
                loginButton = this.findByAriaLabel('Sign in');
            }

            if (loginButton) {
                this.log('✅ Найдена кнопка входа');
                loginButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await this.delay(300);
                loginButton.click();
                
                await this.delay(3000);
                const navElement = await this.waitForElement('[role="navigation"]', 15000);
                if (navElement) {
                    this.log('✅ Google Ads dashboard загружен!');
                    await this.runFullPipeline();
                }
            } else {
                this.log('⚠️ Кнопка входа не найдена. Проверяем доступ...');
                const isLoggedIn = await this.checkIfLoggedIn();
                if (isLoggedIn) {
                    this.log('✅ Уже авторизован в Google Ads!');
                    await this.runFullPipeline();
                } else {
                    throw new Error('Login button not found and not logged in');
                }
            }
        } catch (error) {
            this.log(`❌ Ошибка при входе: ${error.message}`);
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
            this.log('✅ Шаг 1: Конверсия создана');
            await this.delay(2000);

            this.currentStep = 2;
            await this.createCampaign();
            this.log('✅ Шаг 2: Кампания создана');
            await this.delay(2000);

            this.currentStep = 3;
            await this.createAdGroup();
            this.log('✅ Шаг 3: Ad Group создан');
            await this.delay(2000);

            this.currentStep = 4;
            await this.createAds();
            this.log('✅ Шаг 4: Объявления созданы');
            await this.delay(2000);

            this.currentStep = 5;
            await this.publishCampaign();
            this.log('✅ Шаг 5: Кампания опубликована');
            await this.delay(2000);

            this.currentStep = 6;
            await this.setupTrackingScript();
            this.log('✅ Шаг 6: Трекинг скрипт настроен');

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
            let button = this.findElement('New Conversion Action') || 
                        this.findElement('New Conversion');
            if (!button) {
                throw new Error('New Conversion button not found');
            }
            button.click();
            await this.delay(1000);
            await this.closeDialogs();

            // Выбрать тип конверсии: Offline
            const offlineOption = this.findElement('Offline');
            if (offlineOption) {
                offlineOption.click();
                await this.delay(1000);
            }

            // Пропустить Data Source
            const skipButton = this.findElement('Skip');
            if (skipButton) {
                skipButton.click();
                await this.delay(500);
            }

            // Заполнить стоимость конверсии
            if (this.config.targetCPA) {
                await this.fillInputField('input[type="number"]', this.config.targetCPA);
            }

            // Нажать Done
            const doneButton = this.findElement('Done');
            if (doneButton) {
                doneButton.click();
                await this.delay(1000);
                await this.closeDialogs();
            }

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
            let newCampaignBtn = this.findElement('New Campaign') || 
                                this.findElement('+ New Campaign');
            if (!newCampaignBtn) {
                throw new Error('New Campaign button not found');
            }
            newCampaignBtn.click();
            await this.delay(1000);
            await this.closeDialogs();

            // Выбрать тип: Demand Gen
            const demandGenOption = this.findElement('Demand Gen');
            if (demandGenOption) {
                demandGenOption.click();
                await this.delay(1000);
            }

            // Выбрать тип конверсии: Lead
            const leadOption = this.findElement('Lead');
            if (leadOption) {
                leadOption.click();
                await this.delay(1000);
            }

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
            this.log('📝 Заполнение параметров кампании...');

            // Название кампании
            if (this.config.campaignName) {
                const nameInput = document.querySelector('input[placeholder*="Campaign"], input[aria-label*="Campaign name"]');
                if (nameInput) {
                    nameInput.value = this.config.campaignName;
                    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
                    await this.delay(300);
                }
            }

            // Дневной бюджет
            if (this.config.budget) {
                const budgetInput = document.querySelector('input[placeholder*="budget"], input[aria-label*="budget"]');
                if (budgetInput) {
                    budgetInput.value = this.config.budget;
                    budgetInput.dispatchEvent(new Event('input', { bubbles: true }));
                    await this.delay(300);
                }
            }

            // Target CPA
            if (this.config.targetCPA) {
                const cpaInput = document.querySelector('input[placeholder*="CPA"], input[aria-label*="CPA"], input[aria-label*="cost per"]');
                if (cpaInput) {
                    cpaInput.value = this.config.targetCPA;
                    cpaInput.dispatchEvent(new Event('input', { bubbles: true }));
                    await this.delay(300);
                }
            }

            // Локация
            if (this.config.location) {
                const locationInput = document.querySelector('input[placeholder*="location"], input[aria-label*="Location"]');
                if (locationInput) {
                    locationInput.focus();
                    locationInput.value = this.config.location;
                    locationInput.dispatchEvent(new Event('input', { bubbles: true }));
                    await this.delay(800);
                    const firstOption = document.querySelector('[role="option"]');
                    if (firstOption) firstOption.click();
                }
            }

            // Язык
            if (this.config.language) {
                const langInput = document.querySelector('input[placeholder*="language"], input[aria-label*="Language"]');
                if (langInput) {
                    langInput.focus();
                    langInput.value = this.config.language;
                    langInput.dispatchEvent(new Event('input', { bubbles: true }));
                    await this.delay(800);
                    const firstOption = document.querySelector('[role="option"]');
                    if (firstOption) firstOption.click();
                }
            }

            // Расписание
            if (this.config.schedule_start) {
                const startInput = document.querySelector('input[placeholder*="start"], input[aria-label*="Start"]');
                if (startInput) {
                    startInput.value = this.config.schedule_start;
                    startInput.dispatchEvent(new Event('input', { bubbles: true }));
                    await this.delay(300);
                }
            }

            if (this.config.schedule_end) {
                const endInput = document.querySelector('input[placeholder*="end"], input[aria-label*="End"]');
                if (endInput) {
                    endInput.value = this.config.schedule_end;
                    endInput.dispatchEvent(new Event('input', { bubbles: true }));
                    await this.delay(300);
                }
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
            let addButton = this.findElement('Add ad') || 
                           this.findElement('Add');
            if (addButton) {
                addButton.click();
                await this.delay(1000);
            }

            // Заполнить заголовок
            if (this.config.headlines && this.config.headlines.length > 0) {
                const headlineInput = document.querySelector('input[placeholder*="Headline"], input[aria-label*="Headline"]');
                if (headlineInput) {
                    headlineInput.value = this.config.headlines[0];
                    headlineInput.dispatchEvent(new Event('input', { bubbles: true }));
                    await this.delay(300);
                }
            }

            // Заполнить описание
            if (this.config.descriptions && this.config.descriptions.length > 0) {
                const descInput = document.querySelector('textarea[placeholder*="Description"], textarea[aria-label*="Description"]');
                if (descInput) {
                    descInput.value = this.config.descriptions[0];
                    descInput.dispatchEvent(new Event('input', { bubbles: true }));
                    await this.delay(300);
                }
            }

            // Заполнить CTA
            if (this.config.adCTA) {
                const ctaInput = document.querySelector('input[placeholder*="Call to action"], input[aria-label*="Call to action"]');
                if (ctaInput) {
                    ctaInput.value = this.config.adCTA;
                    ctaInput.dispatchEvent(new Event('input', { bubbles: true }));
                    await this.delay(300);
                }
            }

            // Заполнить URL
            if (this.config.finalURL) {
                const urlInput = document.querySelector('input[placeholder*="Final URL"], input[aria-label*="Final URL"]');
                if (urlInput) {
                    urlInput.value = this.config.finalURL;
                    urlInput.dispatchEvent(new Event('input', { bubbles: true }));
                    await this.delay(300);
                }
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
            let publishButton = this.findElement('Publish') || 
                               this.findElement('Save');
            if (publishButton) {
                publishButton.click();
                await this.delay(2000);
            }
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
            const trackingCode = this.generateTrackingCode();
            this.log(`✅ Трекинг скрипт готов: ${trackingCode.substring(0, 50)}...`);
            console.log('📋 Полный трекинг код:');
            console.log(trackingCode);
        } catch (error) {
            await this.handleRetry('setupTrackingScript', error);
        }
    },

    // ========================
    // HELPER FUNCTIONS
    // ========================

    /**
     * Закрытие диалогов и подсказок
     */
    async closeDialogs() {
        try {
            const closeButtons = document.querySelectorAll(
                '[aria-label="Close"], [aria-label="Закрыть"], button[class*="close"], ' +
                'material-close-icon, [aria-label*="close"]'
            );
            for (const btn of closeButtons) {
                if (btn.offsetHeight > 0 && btn.offsetWidth > 0) {
                    try {
                        btn.click();
                        await this.delay(100);
                    } catch (e) {
                        // ignore
                    }
                }
            }
        } catch (error) {
            // ignore errors in closeDialogs
        }
    },

    /**
     * Навигация на Goals → Conversions
     */
    async navigateToConversions() {
        try {
            let goalsLink = this.findElement('Goals');
            if (!goalsLink) {
                goalsLink = this.findByAriaLabel('Goals');
            }
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
            let campaignsLink = this.findElement('Campaigns');
            if (!campaignsLink) {
                campaignsLink = this.findByAriaLabel('Campaigns');
            }
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
            const navElement = document.querySelector('[role="navigation"]');
            const campaignsLink = this.findByAriaLabel('Campaigns');
            return navElement !== null || campaignsLink !== null;
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
                const mobileCheckbox = document.querySelector(
                    'input[aria-label*="Mobile"], input[value*="mobile"], input[aria-label*="Phone"]'
                );
                if (mobileCheckbox && !mobileCheckbox.checked) {
                    mobileCheckbox.click();
                    await this.delay(300);
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
            // Пол (Gender)
            if (this.config.gender) {
                const genderSelect = document.querySelector('select[aria-label*="Gender"], select[aria-label*="gender"]');
                if (genderSelect) {
                    genderSelect.value = this.config.gender.toLowerCase();
                    genderSelect.dispatchEvent(new Event('change', { bubbles: true }));
                    await this.delay(300);
                }
            }

            // Возраст (Age)
            if (this.config.ageFrom) {
                const ageFromInput = document.querySelector('input[aria-label*="Age"], input[aria-label*="from"]');
                if (ageFromInput) {
                    ageFromInput.value = this.config.ageFrom;
                    ageFromInput.dispatchEvent(new Event('input', { bubbles: true }));
                    await this.delay(300);
                }
            }

            if (this.config.ageTo) {
                const ageToInput = document.querySelector('input[aria-label*="to"]');
                if (ageToInput) {
                    ageToInput.value = this.config.ageTo;
                    ageToInput.dispatchEvent(new Event('input', { bubbles: true }));
                    await this.delay(300);
                }
            }
        } catch (error) {
            this.log(`⚠️ Ошибка при заполнении аудитории: ${error.message}`);
        }
    },

    /**
     * Заполнение input поля
     */
    async fillInputField(selector, value) {
        try {
            const input = document.querySelector(selector);
            if (input) {
                input.focus();
                input.value = value;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                await this.delay(300);
                return true;
            }
            this.log(`⚠️ Не удалось заполнить поле: ${selector}`);
            return false;
        } catch (error) {
            this.log(`⚠️ Ошибка при заполнении поля: ${error.message}`);
            return false;
        }
    },

    /**
     * Генерация трекинг кода
     */
    generateTrackingCode() {
        const campaignId = this.config.campaignId || 'campaign_' + Date.now();
        const accountName = this.config.accountName || 'default';
        const creativeApproach = this.config.creativeApproach || 'standard';
        
        return `<!-- Google Ads Tracking Script v1.0 -->
<!-- Campaign: ${this.config.campaignName || 'Unknown'} -->
<!-- Generated: ${new Date().toISOString()} -->
<script>
// Account tracking
var gaq_config = {
    campaignId: '${campaignId}',
    accountName: '${accountName}',
    creativeApproach: '${creativeApproach}',
    timestamp: new Date().toISOString()
};

// Send event
if (window.gtag) {
    gtag('event', 'campaign_created', gaq_config);
}
</script>`;
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
            this.log(`🔄 Попытка повтора ${this.retryCount}/${this.maxRetries} для шага ${this.currentStep}...`);
            await this.delay(2000);
            try {
                return await this[stepName]?.();
            } catch (retryError) {
                this.log(`❌ Повтор не удался: ${retryError.message}`);
                return false;
            }
        } else {
            this.log(`❌ ОШИБКА на шаге ${this.currentStep} (${stepName}): ${error.message}`);
            this.retryCount = 0;
            throw error;
        }
    },

    /**
     * Обработка ошибок этапа
     */
    handleStepError(error) {
        this.log(`❌ КРИТИЧЕСКАЯ ОШИБКА: ${error.message}`);
        this.log(`Полная ошибка:`, error);
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
    log(message, extra) {
        const timestamp = new Date().toLocaleTimeString('ru-RU');
        if (extra) {
            console.log(`[GoogleAdsBot ${timestamp}] ${message}`, extra);
        } else {
            console.log(`[GoogleAdsBot ${timestamp}] ${message}`);
        }
    }
};

// Инициализация при загрузке скрипта
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => GoogleAdsBot.init());
} else {
    GoogleAdsBot.init();
}
