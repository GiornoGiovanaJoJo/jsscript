// Google Ads Bot - Core Automation Engine
// Handles all 6 steps of campaign creation pipeline

const GoogleAdsBot = {
    config: {},
    currentStep: 0,
    maxRetries: 2,
    retryCount: 0,
    isPaused: false,
    waitTimeout: 10000, // 10 seconds

    // ========================
    // INITIALIZATION
    // ========================
    async init() {
        this.log('🤖 Инициализация Google Ads Bot...');
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sendResponse);
        });
        this.log('✅ Bot готов к командам');
    },

    // ========================
    // MESSAGE HANDLING
    // ========================
    async handleMessage(request, sendResponse) {
        try {
            // Загрузить конфиг из chrome.storage
            const stored = await this.loadConfig();
            this.config = { ...stored, ...request.config };

            switch (request.action) {
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
    // CONFIG MANAGEMENT
    // ========================
    async loadConfig() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(null, (items) => {
                resolve(items || {});
            });
        });
    },

    // ========================
    // MAIN PIPELINES
    // ========================

    /**
     * Полный цикл: Конверсия → Кампания → Ad Group → Объявления → Публикация → Трекинг
     */
    async runFullPipeline() {
        try {
            this.log('▶️ СТАРТ ПОЛНОГО ЦИКЛА...');

            // Шаг 1: Создание конверсии
            this.currentStep = 1;
            await this.createConversion();
            this.log('✅ Конверсия создана');
            await this.delay(2000);

            // Шаг 2: Создание кампании
            this.currentStep = 2;
            await this.createCampaign();
            this.log('✅ Кампания создана');
            await this.delay(2000);

            // Шаг 3: Создание Ad Group
            this.currentStep = 3;
            await this.createAdGroup();
            this.log('✅ Ad Group создан');
            await this.delay(2000);

            // Шаг 4: Создание объявлений
            this.currentStep = 4;
            await this.createAds();
            this.log('✅ Объявления созданы');
            await this.delay(2000);

            // Шаг 5: Публикация кампании
            this.currentStep = 5;
            await this.publishCampaign();
            this.log('✅ Кампания опубликована');
            await this.delay(2000);

            // Шаг 6: Настройка трекинга
            this.currentStep = 6;
            await this.setupTrackingScript();
            this.log('✅ Трекинг скрипт настроен');

            this.log('🎉 ПОЛНЫЙ ЦИКЛ ЗАВЕРШЕН УСПЕШНО!');
        } catch (error) {
            this.handleStepError(error);
        }
    },

    /**
     * Только кампания и объявления (для уже созданного аккаунта)
     */
    async runCampaignOnly() {
        try {
            this.log('▶️ Создание только кампании...');
            this.currentStep = 2;
            await this.createCampaign();
            this.log('✅ Кампания и объявления готовы');
        } catch (error) {
            this.handleStepError(error);
        }
    },

    /**
     * Только трекинг скрипт
     */
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
            // Перейти на вкладку Goals
            await this.clickElement('a[aria-label*="Goals"], button:has-text("Goals")');
            await this.waitForElement('button:has-text("New Conversion Action"), [role="button"]:has-text("New Conversion")');

            // Нажать на "New Conversion Action"
            await this.clickElement('button:has-text("New Conversion Action")');
            await this.delay(1000);

            // Выбрать тип конверсии: Offline
            await this.clickElement('div:has-text("Offline conversion"), [role="option"]:has-text("Offline")');
            await this.delay(1000);

            // Выбрать Data Source и пропустить
            await this.clickElement('button:has-text("Skip")');
            await this.delay(500);

            // Отметить Custom data
            await this.clickElement('input[type="checkbox"][aria-label*="Custom"]');
            await this.delay(500);

            // Заполнить стоимость конверсии
            if (this.config.conversion_value) {
                await this.fillInput('input[type="number"][placeholder*="value"]', this.config.conversion_value);
            }

            // Нажать Done
            await this.clickElement('button:has-text("Done")');
            await this.delay(1000);

            // Закрыть направляющие/подсказки Google (если они есть)
            await this.closeGoogleGuidance();

            this.log('✅ Конверсия успешно создана');
        } catch (error) {
            await this.handleRetry('createConversion', error);
        }
    },

    // ========================
    // STEP 2: CREATE CAMPAIGN
    // ========================
    async createCampaign() {
        this.log('📊 Шаг 2: Создание Demand Gen кампании...');
        try {
            // Перейти на Campaigns
            await this.clickElement('a[aria-label*="Campaigns"], nav a:has-text("Campaigns")');
            await this.delay(1000);

            // Нажать New Campaign
            await this.clickElement('button:has-text("New Campaign"), [role="button"]:has-text("+ Campaign")');
            await this.delay(1000);

            // Закрыть гугловские подсказки
            await this.closeGoogleGuidance();

            // Выбрать тип: Demand Gen
            await this.clickElement('div:has-text("Demand Gen"), [role="option"]:has-text("Demand Gen")');
            await this.delay(1000);

            // Выбрать тип конверсии: Lead
            await this.clickElement('div:has-text("Lead"), [role="option"]:has-text("Lead")');
            await this.delay(1000);

            // Заполнить параметры кампании
            await this.fillCampaignDetails();

            this.log('✅ Кампания успешно создана');
        } catch (error) {
            await this.handleRetry('createCampaign', error);
        }
    },

    async fillCampaignDetails() {
        try {
            // Дневной бюджет
            if (this.config.daily_budget) {
                await this.fillInput('input[aria-label*="Daily budget"], input[placeholder*="budget"]', this.config.daily_budget);
            }

            // Target CPA
            if (this.config.target_cpa) {
                await this.fillInput('input[aria-label*="Target CPA"], input[placeholder*="CPA"]', this.config.target_cpa);
            }

            // Страна/Геолокация
            if (this.config.geo_country) {
                await this.fillInput('input[aria-label*="Location"], input[placeholder*="country"]', this.config.geo_country);
                await this.delay(500);
                await this.clickElement('div[role="option"]:first-child');
            }

            // Язык
            if (this.config.language) {
                await this.fillInput('input[aria-label*="Language"], input[placeholder*="language"]', this.config.language);
                await this.delay(500);
                await this.clickElement('div[role="option"]:first-child');
            }

            // Расписание - дни
            if (this.config.schedule_days) {
                await this.selectScheduleDays(this.config.schedule_days);
            }

            // Расписание - время начала
            if (this.config.schedule_start) {
                await this.fillInput('input[aria-label*="Start time"], input[placeholder*="start"]', this.config.schedule_start);
            }

            // Расписание - время конца
            if (this.config.schedule_end) {
                await this.fillInput('input[aria-label*="End time"], input[placeholder*="end"]', this.config.schedule_end);
            }

            // Устройства: только мобильные (по умолчанию)
            await this.selectDevices('mobile');

        } catch (error) {
            this.log(`⚠️ Ошибка при заполнении параметров кампании: ${error.message}`);
        }
    },

    async selectScheduleDays(preset) {
        const dayMapping = {
            'mon-fri': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            'all-days': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            'weekend': ['Saturday', 'Sunday']
        };
        const days = dayMapping[preset] || [];
        // TODO: Реализовать клики по дням недели
    }

    async selectDevices(type) {
        if (type === 'mobile') {
            // Оставить только мобильные телефоны
            await this.clickElement('input[aria-label*="Mobile phones"]');
        }
    }

    // ========================
    // STEP 3: CREATE AD GROUP
    // ========================
    async createAdGroup() {
        this.log('👥 Шаг 3: Создание Ad Group и аудиторий...');
        try {
            // Заполнить параметры аудитории
            await this.fillAudienceDetails();

            // Закрыть направляющие
            await this.closeGoogleGuidance();

            this.log('✅ Ad Group и аудиторий готовы');
        } catch (error) {
            await this.handleRetry('createAdGroup', error);
        }
    }

    async fillAudienceDetails() {
        try {
            // Демография: возраст, пол, родительский статус - оставить как в скрипте
            // Таргет: Discover (по умолчанию)

            // Имя аудитории
            if (this.config.audience_name) {
                await this.fillInput('input[aria-label*="Audience name"]', this.config.audience_name);
            }

            // Отключить доп. оптимизацию если нужно
            await this.clickElement('input[aria-label*="optimization"]');
        } catch (error) {
            this.log(`⚠️ Ошибка при заполнении аудитории: ${error.message}`);
        }
    }

    // ========================
    // STEP 4: CREATE ADS
    // ========================
    async createAds() {
        this.log('📝 Шаг 4: Создание объявлений с креативами...');
        try {
            // Заполнить домен
            if (this.config.domain) {
                await this.fillInput('input[aria-label*="domain"], input[placeholder*="domain"]', this.config.domain);
            }

            // Загрузить видео/изображения
            await this.uploadCreatives();

            // Заполнить логотип
            if (this.config.logo_url) {
                // TODO: Реализовать загрузку логотипа
            }

            // Отключить доп. чекбоксы
            await this.disableOptionalCheckboxes();

            // Заполнить заголовки
            await this.fillHeadlines();

            // Заполнить описания
            await this.fillDescriptions();

            // Заполнить бизнес-имя
            await this.fillBusinessName();

            // Выбрать CTA
            if (this.config.cta_text) {
                await this.fillInput('input[aria-label*="Call to action"]', this.config.cta_text);
            }

            // Заполнить Final URL
            if (this.config.final_url) {
                await this.fillInput('input[aria-label*="Final URL"], input[placeholder*="http"]', this.config.final_url);
            }

            // Дублировать объявления (5 копий)
            await this.duplicateAds(5);

            this.log('✅ Объявления готовы');
        } catch (error) {
            await this.handleRetry('createAds', error);
        }
    }

    async uploadCreatives() {
        try {
            // Найти кнопку Upload
            const uploadButton = await this.findElement('button:has-text("Upload")');
            uploadButton.click();
            await this.delay(1000);
            // TODO: Реализовать загрузку файлов из папки
        } catch (error) {
            this.log(`⚠️ Ошибка при загрузке креативов: ${error.message}`);
        }
    }

    async fillHeadlines() {
        try {
            if (this.config.headlines) {
                const headlines = this.config.headlines.split('\n').filter(h => h.trim()).slice(0, 5);
                const inputs = document.querySelectorAll('input[aria-label*="Headline"], textarea[placeholder*="headline"]');
                for (let i = 0; i < headlines.length && i < inputs.length; i++) {
                    inputs[i].value = headlines[i].trim();
                    inputs[i].dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
        } catch (error) {
            this.log(`⚠️ Ошибка при заполнении заголовков: ${error.message}`);
        }
    }

    async fillDescriptions() {
        try {
            if (this.config.descriptions) {
                const descriptions = this.config.descriptions.split('\n').filter(d => d.trim()).slice(0, 5);
                const inputs = document.querySelectorAll('textarea[aria-label*="Description"], input[placeholder*="description"]');
                for (let i = 0; i < descriptions.length && i < inputs.length; i++) {
                    inputs[i].value = descriptions[i].trim();
                    inputs[i].dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
        } catch (error) {
            this.log(`⚠️ Ошибка при заполнении описаний: ${error.message}`);
        }
    }

    async fillBusinessName() {
        try {
            if (this.config.business_name) {
                const names = this.config.business_name.split('\n').filter(n => n.trim());
                const randomName = names[Math.floor(Math.random() * names.length)];
                await this.fillInput('input[aria-label*="Business name"]', randomName);
            }
        } catch (error) {
            this.log(`⚠️ Ошибка при заполнении бизнес-имени: ${error.message}`);
        }
    }

    async disableOptionalCheckboxes() {
        try {
            // Отключить определённые галочки
            const checkboxes = document.querySelectorAll('input[type="checkbox"]');
            // TODO: Определить какие именно галочки отключать
        } catch (error) {
            this.log(`⚠️ Ошибка при отключении галочек: ${error.message}`);
        }
    }

    async duplicateAds(count) {
        try {
            // Найти и нажать кнопку для дублирования
            for (let i = 0; i < count - 1; i++) {
                await this.clickElement('button:has-text("Duplicate")');
                await this.delay(500);
            }
        } catch (error) {
            this.log(`⚠️ Ошибка при дублировании объявлений: ${error.message}`);
        }
    }

    // ========================
    // STEP 5: PUBLISH CAMPAIGN
    // ========================
    async publishCampaign() {
        this.log('🚀 Шаг 5: Публикация кампании...');
        try {
            // Нажать Publish Campaign
            await this.clickElement('button:has-text("Publish Campaign")');
            await this.delay(2000);

            this.log('✅ Кампания опубликована');
        } catch (error) {
            await this.handleRetry('publishCampaign', error);
        }
    }

    // ========================
    // STEP 6: TRACKING SCRIPT
    // ========================
    async setupTrackingScript() {
        this.log('📊 Шаг 6: Настройка Tracking Script...');
        try {
            // Перейти на Tools > Scripts
            await this.clickElement('a[aria-label*="Tools"], nav a:has-text("Tools")');
            await this.delay(1000);

            await this.clickElement('a:has-text("Scripts"), [role="menuitem"]:has-text("Scripts")');
            await this.delay(1000);

            // Нажать New Script
            await this.clickElement('button:has-text("New Script")');
            await this.delay(1000);

            // Вставить tracking script код
            await this.insertTrackingScriptCode();

            // Нажать Save
            await this.clickElement('button:has-text("Save")');
            await this.delay(1000);

            // Нажать Run
            await this.clickElement('button:has-text("Run")');
            await this.delay(2000);

            // Обработать авторизацию в Google
            await this.handleGoogleAuthorization();

            // Установить периодичность: каждый час
            if (this.config.auto_run_tracking) {
                await this.setScriptFrequency('hourly');
            }

            this.log('✅ Tracking Script настроен');
        } catch (error) {
            await this.handleRetry('setupTrackingScript', error);
        }
    }

    async insertTrackingScriptCode() {
        try {
            const scriptTemplate = `
// Tracking Script для ${this.config.account_name || 'Default Account'}
var ACCOUNT_NAME = '${this.config.account_name || 'Account'}';
var CREATIVE_APPROACH = '${this.config.creative_approach || 'Default'}';

function trackConversions() {
  // Логика трекинга конверсий
  Logger.log('Tracking for: ' + ACCOUNT_NAME);
}

trackConversions();
            `.trim();

            // Найти textarea для кода
            const codeEditor = document.querySelector('textarea[role="textbox"], [role="textbox"] textarea, .code-editor');
            if (codeEditor) {
                codeEditor.value = scriptTemplate;
                codeEditor.dispatchEvent(new Event('input', { bubbles: true }));
            }
        } catch (error) {
            this.log(`⚠️ Ошибка при вставке скрипта: ${error.message}`);
        }
    }

    async handleGoogleAuthorization() {
        try {
            // Проверить появление окна авторизации
            await this.waitForElement('[role="dialog"]:has-text("Google")', 5000);
            
            // Отметить галочки разрешений
            const checkboxes = document.querySelectorAll('[role="dialog"] input[type="checkbox"]');
            checkboxes.forEach(cb => cb.checked = true);
            
            // Нажать Continue
            await this.clickElement('[role="dialog"] button:has-text("Continue")');
            await this.delay(1000);
        } catch (error) {
            this.log(`⚠️ Авторизация Google (может потребоваться вручную): ${error.message}`);
        }
    }

    async setScriptFrequency(frequency) {
        try {
            // Переключить на вкладку расписания
            await this.clickElement('[role="tab"]:has-text("Schedule"), a:has-text("Frequency")');
            await this.delay(500);

            // Выбрать периодичность
            if (frequency === 'hourly') {
                await this.clickElement('input[value="hourly"], [role="option"]:has-text("Every hour")');
            }
        } catch (error) {
            this.log(`⚠️ Ошибка при установке периодичности: ${error.message}`);
        }
    }

    // ========================
    // HELPER FUNCTIONS
    // ========================

    async closeGoogleGuidance() {
        try {
            // Закрыть всплывающие подсказки Google
            const closeButtons = document.querySelectorAll('button[aria-label*="Close"], [role="button"][aria-label*="dismiss"]');
            closeButtons.forEach(btn => btn.click());
            await this.delay(300);
        } catch (error) {
            // Silently fail
        }
    }

    async handleStepError(error) {
        this.log(`❌ ОШИБКА НА ШАГЕ ${this.currentStep}: ${error.message}`);
        this.log(`⚠️ Требуется вмешательство человека`);
    }

    async handleRetry(functionName, error) {
        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            this.log(`🔄 Попытка повтора ${this.retryCount}/${this.maxRetries}...`);
            await this.delay(2000);
            try {
                await this[functionName]();
                this.retryCount = 0;
            } catch (retryError) {
                await this.handleRetry(functionName, retryError);
            }
        } else {
            this.retryCount = 0;
            await this.handleStepError(error);
        }
    }

    async findElement(selector) {
        const element = document.querySelector(selector);
        if (!element) {
            throw new Error(`Элемент не найден: ${selector}`);
        }
        return element;
    }

    async waitForElement(selector, timeout = this.waitTimeout) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            const element = document.querySelector(selector);
            if (element) return element;
            await this.delay(100);
        }
        throw new Error(`Элемент не появился за ${timeout}ms: ${selector}`);
    }

    async clickElement(selector) {
        const element = await this.waitForElement(selector);
        element.click();
        await this.delay(300);
    }

    async fillInput(selector, value) {
        const element = await this.findElement(selector);
        element.value = value;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        await this.delay(300);
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    log(message) {
        const timestamp = new Date().toLocaleTimeString('ru-RU');
        console.log(`[${timestamp}] ${message}`);
    }
};

// Инициализировать бота при загрузке страницы
GoogleAdsBot.init();
