// Google Ads Bot - Enhanced Core Automation Engine
// Handles all 6 steps of campaign creation with full dynamic parameters

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
        this.log('🤖 Инициализация Google Ads Bot с полной поддержкой динамических параметров...');
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sendResponse);
        });
        
        // Загрузить конфиг и автоматически запустить пайплайн
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
            // Загрузить конфиг из chrome.storage
            const stored = await this.loadConfig();
            this.config = { ...stored, ...request.config };

            switch (request.action) {
                case 'AUTO_LOGIN':
                    this.log('🔐 Получена команда AUTO_LOGIN - нажимаем кнопку Войти...');
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
            // Ищем кнопку "Войти" - она может быть на русском или английском
            let loginButton = null;
            
            // Попытка 1: Найти кнопку по тексту "Войти" (русский)
            let buttons = Array.from(document.querySelectorAll('button, a, [role="button"]'));
            loginButton = buttons.find(btn => 
                btn.innerText.includes('Войти') || 
                btn.textContent.includes('Войти')
            );

            // Попытка 2: Поиск по English text "Sign In"
            if (!loginButton) {
                loginButton = buttons.find(btn => 
                    btn.innerText.includes('Sign in') || 
                    btn.textContent.includes('Sign in')
                );
            }

            // Попытка 3: Поиск по aria-label
            if (!loginButton) {
                loginButton = document.querySelector('button[aria-label*="Войти"], button[aria-label*="Sign"], [role="button"][aria-label*="Sign"]');
            }

            // Попытка 4: Поиск по href/onclick
            if (!loginButton) {
                loginButton = document.querySelector('a[href*="accounts.google"], a[href*="signin"], button[onclick*="login"]');
            }

            if (loginButton) {
                this.log('✅ Кнопка Войти найдена! Нажимаем...');
                loginButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await this.delay(300);
                loginButton.click();
                this.log('✅ Кнопка Войти нажата');
                
                // Ждем перенаправления и загрузки новой страницы
                await this.delay(3000);
                
                // Проверяем, что мы попали на страницу Google Ads dashboard
                await this.waitForElement('nav a:has-text("Campaigns"), a[aria-label*="Campaigns"], [role="navigation"]', 15000);
                this.log('✅ Страница Google Ads загрузилась! Запускаем полный пайплайн...');
                
                // Запустить полный пайплайн
                await this.runFullPipeline();
            } else {
                this.log('⚠️ Кнопка Войти не найдена. Проверяем, может быть мы уже в аккаунте...');
                
                // Проверяем, есть ли уже доступ к основному интерфейсу
                const campaignNav = document.querySelector('nav a:has-text("Campaigns"), a[aria-label*="Campaigns"]');
                if (campaignNav) {
                    this.log('✅ Уже в аккаунте Google Ads! Запускаем полный пайплайн...');
                    await this.runFullPipeline();
                } else {
                    this.log('❌ Не удалось найти кнопку Войти и основной интерфейс Google Ads');
                    throw new Error('Login button not found');
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

    /**
     * Полный цикл: Конверсия → Кампания → Ad Group → Объявления → Публикация → Трекинг
     */
    async runFullPipeline() {
        try {
            this.log('▶️ СТАРТ ПОЛНОГО ЦИКЛА С ДИНАМИЧЕСКИМИ ПАРАМЕТРАМИ...');

            // Шаг 1: Создание конверсии
            this.currentStep = 1;
            await this.createConversion();
            this.log('✅ Конверсия создана');
            await this.delay(2000);

            // Шаг 2: Создание кампании
            this.currentStep = 2;
            await this.createCampaign();
            this.log('✅ Кампания создана с динамическими параметрами');
            await this.delay(2000);

            // Шаг 3: Создание Ad Group
            this.currentStep = 3;
            await this.createAdGroup();
            this.log('✅ Ad Group создан с таргетингом по демографии');
            await this.delay(2000);

            // Шаг 4: Создание объявлений
            this.currentStep = 4;
            await this.createAds();
            this.log('✅ Объявления созданы со всеми динамическими параметрами');
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
     * Только кампания и объявления
     */
    async runCampaignOnly() {
        try {
            this.log('▶️ Создание только кампании со всеми параметрами...');
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
            // Перейти на Goals → Conversions
            await this.clickElement('nav a:has-text("Goals"), a[aria-label*="Goals"]');
            await this.delay(1500);
            
            await this.closeGoogleGuidance();
            await this.delay(500);

            // Нажать на "New Conversion Action"
            await this.clickElement('button:has-text("New Conversion Action")');
            await this.delay(1000);
            await this.closeGoogleGuidance();

            // Выбрать тип конверсии: Offline
            await this.clickElement('div:has-text("Offline conversion"), [role="option"]:has-text("Offline")');
            await this.delay(1000);

            // Пропустить Data Source
            await this.clickElement('button:has-text("Skip")');
            await this.delay(500);

            // Отметить Custom data
            await this.clickElement('input[type="checkbox"][aria-label*="Custom"], input[type="checkbox"][aria-label*="customer"]');
            await this.delay(500);

            // Заполнить стоимость конверсии (динамический параметр)
            if (this.config.targetCPA) {
                await this.fillInput('input[type="number"][placeholder*="value"], input[aria-label*="conversion value"]', this.config.targetCPA);
            }

            // Нажать Done
            await this.clickElement('button:has-text("Done")');
            await this.delay(1000);
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
        this.log('📊 Шаг 2: Создание Demand Gen кампании с динамическими параметрами...');
        try {
            // Перейти на Campaigns
            await this.clickElement('nav a:has-text("Campaigns"), a[aria-label*="Campaigns"]');
            await this.delay(1500);

            // Нажать New Campaign
            await this.clickElement('button:has-text("New Campaign"), [role="button"]:has-text("+")');
            await this.delay(1000);
            await this.closeGoogleGuidance();

            // Выбрать тип: Demand Gen
            await this.clickElement('div:has-text("Demand Gen"), [role="option"]:has-text("Demand Gen")');
            await this.delay(1000);

            // Выбрать тип конверсии: Lead
            await this.clickElement('div:has-text("Lead"), [role="option"]:has-text("Lead")');
            await this.delay(1000);

            // Заполнить параметры кампании
            await this.fillCampaignDetails();
            await this.closeGoogleGuidance();

            this.log('✅ Кампания успешно создана с динамическими параметрами');
        } catch (error) {
            await this.handleRetry('createCampaign', error);
        }
    },

    async fillCampaignDetails() {
        try {
            // Дневной бюджет
            if (this.config.budget) {
                await this.fillInput('input[aria-label*="Daily budget"], input[placeholder*="budget"]', this.config.budget);
            }

            // Target CPA
            if (this.config.targetCPA) {
                await this.fillInput('input[aria-label*="Target CPA"], input[placeholder*="CPA"]', this.config.targetCPA);
            }

            // Локация
            if (this.config.location) {
                await this.fillInput('input[aria-label*="Location"], input[placeholder*="country"]', this.config.location);
                await this.delay(800);
                await this.clickElement('div[role="option"]:first-of-type');
                await this.delay(500);
            }

            // Язык
            if (this.config.language) {
                await this.fillInput('input[aria-label*="Language"], input[placeholder*="language"]', this.config.language);
                await this.delay(800);
                await this.clickElement('div[role="option"]:first-of-type');
                await this.delay(500);
            }

            // Расписание - время
            if (this.config.schedule_start) {
                await this.fillInput('input[aria-label*="Start time"], input[placeholder*="start"]', this.config.schedule_start);
            }

            if (this.config.schedule_end) {
                await this.fillInput('input[aria-label*="End time"], input[placeholder*="end"]', this.config.schedule_end);
            }

            // Каналы (динамический параметр)
            if (this.config.channels && this.config.channels === 'discover') {
                await this.clickElement('div:has-text("Discover"), [role="option"]:has-text("Discover")');
                await this.delay(500);
            }

            // Устройства: только мобильные
            await this.selectDevices('mobile');

        } catch (error) {
            this.log(`⚠️ Ошибка при заполнении параметров кампании: ${error.message}`);
        }
    },

    async selectDevices(type) {
        try {
            if (type === 'mobile') {
                // Оставить только мобильные телефоны
                const mobileCheckbox = await this.findElement('input[aria-label*="Mobile"], input[value*="mobile"]');
                if (!mobileCheckbox.checked) {
                    mobileCheckbox.click();
                }
            }
        } catch (error) {
            this.log(`⚠️ Ошибка при выборе устройств: ${error.message}`);
        }
    },

    // ========================
    // STEP 3: CREATE AD GROUP
    // ========================
    async createAdGroup() {
        this.log('👥 Шаг 3: Создание Ad Group с динамическими аудиториями...');
        try {
            // Заполнить параметры аудитории с динамической демографией
            await this.fillAudienceDetails();
            await this.closeGoogleGuidance();
            await this.delay(500);

            this.log('✅ Ad Group и аудитории готовы с демографическим таргетингом');
        } catch (error) {
            await this.handleRetry('createAdGroup', error);
        }
    },

    async fillAudienceDetails() {
        try {
            // Пол (динамический параметр)
            if (this.config.audience_gender && this.config.audience_gender !== 'all') {
                const genderText = this.config.audience_gender === 'male' ? 'Male' : 'Female';
                await this.clickElement(`input[aria-label*="${genderText}"], label:has-text("${genderText}")`);
                await this.delay(300);
            }

            // Возраст (динамические параметры)
            if (this.config.audience_age_min) {
                const minAge = this.config.audience_age_min;
                await this.clickElement(`input[aria-label*="${minAge}"], label:has-text("${minAge}")`);
                await this.delay(300);
            }

            if (this.config.audience_age_max) {
                const maxAge = this.config.audience_age_max;
                await this.clickElement(`input[aria-label*="${maxAge}"], label:has-text("${maxAge}")`);
                await this.delay(300);
            }

            // Отключить доп. оптимизацию
            await this.clickElement('input[aria-label*="optimization"], input[aria-label*="Optimize"]');
            await this.delay(300);
        } catch (error) {
            this.log(`⚠️ Ошибка при заполнении аудитории: ${error.message}`);
        }
    },

    // ========================
    // STEP 4: CREATE ADS
    // ========================
    async createAds() {
        this.log('📝 Шаг 4: Создание объявлений со всеми динамическими параметрами...');
        try {
            await this.closeGoogleGuidance();
            await this.delay(500);

            // Заполнить domain (динамический)
            if (this.config.domain) {
                await this.fillInput('input[aria-label*="domain"], input[placeholder*="domain"]', this.config.domain);
                await this.delay(300);
            }

            // Заголовки (динамические - до 5)
            await this.fillHeadlines();
            await this.delay(300);

            // Описания (динамические - до 5)
            await this.fillDescriptions();
            await this.delay(300);

            // Бизнес-имя (случайный выбор из пула)
            await this.fillBusinessName();
            await this.delay(300);

            // CTA (динамический параметр с учетом локации)
            if (this.config.cta_text) {
                await this.fillInput('input[aria-label*="Call to action"], select[aria-label*="CTA"]', this.config.cta_text);
                await this.delay(300);
            }

            // Final URL (динамический)
            if (this.config.final_url) {
                await this.fillInput('input[aria-label*="Final URL"], input[placeholder*="http"]', this.config.final_url);
                await this.delay(300);
            }

            // Отключить доп. галочки
            await this.disableOptionalCheckboxes();
            await this.delay(300);

            // Дублировать объявления (5 копий)
            await this.duplicateAds(5);

            this.log('✅ Объявления созданы со всеми динамическими параметрами');
        } catch (error) {
            await this.handleRetry('createAds', error);
        }
    },

    async fillHeadlines() {
        try {
            if (this.config.headlines) {
                const headlines = this.config.headlines.split('\n').filter(h => h.trim()).slice(0, 5);
                const inputs = document.querySelectorAll('input[aria-label*="Headline"], textarea[placeholder*="headline"]');
                
                for (let i = 0; i < headlines.length && i < inputs.length; i++) {
                    const input = inputs[i];
                    input.value = headlines[i].trim();
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    await this.delay(100);
                }
                this.log(`✅ Добавлено ${headlines.length} заголовков`);
            }
        } catch (error) {
            this.log(`⚠️ Ошибка при заполнении заголовков: ${error.message}`);
        }
    },

    async fillDescriptions() {
        try {
            if (this.config.descriptions) {
                const descriptions = this.config.descriptions.split('\n').filter(d => d.trim()).slice(0, 5);
                const inputs = document.querySelectorAll('textarea[aria-label*="Description"], input[placeholder*="description"]');
                
                for (let i = 0; i < descriptions.length && i < inputs.length; i++) {
                    const input = inputs[i];
                    input.value = descriptions[i].trim();
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    await this.delay(100);
                }
                this.log(`✅ Добавлено ${descriptions.length} описаний`);
            }
        } catch (error) {
            this.log(`⚠️ Ошибка при заполнении описаний: ${error.message}`);
        }
    },

    async fillBusinessName() {
        try {
            if (this.config.business_names) {
                const names = this.config.business_names.split('\n').filter(n => n.trim());
                // Случайный выбор из пула имен
                const randomName = names[Math.floor(Math.random() * names.length)];
                await this.fillInput('input[aria-label*="Business name"], input[placeholder*="business"]', randomName);
                this.log(`✅ Выбрано имя бизнеса: ${randomName}`);
            }
        } catch (error) {
            this.log(`⚠️ Ошибка при заполнении бизнес-имени: ${error.message}`);
        }
    },

    async disableOptionalCheckboxes() {
        try {
            const checkboxes = document.querySelectorAll('input[type="checkbox"][aria-label*="auto"], input[type="checkbox"][aria-label*="optimization"]');
            for (const checkbox of checkboxes) {
                if (checkbox.checked) {
                    checkbox.click();
                    await this.delay(50);
                }
            }
        } catch (error) {
            this.log(`⚠️ Ошибка при отключении галочек: ${error.message}`);
        }
    },

    async duplicateAds(count) {
        try {
            // Найти кнопку для дублирования
            for (let i = 0; i < count - 1; i++) {
                await this.clickElement('button:has-text("Duplicate"), button[aria-label*="duplicate"]');
                await this.delay(800);
                this.log(`✅ Дубликат ${i + 1}/${count - 1} создан`);
            }
        } catch (error) {
            this.log(`⚠️ Ошибка при дублировании объявлений: ${error.message}`);
        }
    },

    // ========================
    // STEP 5: PUBLISH CAMPAIGN
    // ========================
    async publishCampaign() {
        this.log('🚀 Шаг 5: Публикация кампании...');
        try {
            // Нажать Publish Campaign
            await this.clickElement('button:has-text("Publish Campaign")');
            await this.delay(2000);

            this.log('✅ Кампания опубликована и активирована');
        } catch (error) {
            await this.handleRetry('publishCampaign', error);
        }
    },

    // ========================
    // STEP 6: TRACKING SCRIPT
    // ========================
    async setupTrackingScript() {
        this.log('📊 Шаг 6: Настройка Tracking Script с динамическими параметрами...');
        try {
            // Перейти на Tools > Scripts
            await this.clickElement('nav a:has-text("Tools"), a[aria-label*="Tools"]');
            await this.delay(1500);

            await this.clickElement('a:has-text("Scripts"), [role="menuitem"]:has-text("Scripts")');
            await this.delay(1500);

            // Нажать New Script
            await this.clickElement('button:has-text("New Script")');
            await this.delay(1000);

            // Вставить tracking script код
            await this.insertTrackingScriptCode();
            await this.delay(300);

            // Нажать Save
            await this.clickElement('button:has-text("Save")');
            await this.delay(1500);

            // Нажать Run
            await this.clickElement('button:has-text("Run")');
            await this.delay(2000);

            // Обработать авторизацию в Google
            await this.handleGoogleAuthorization();

            // Установить периодичность: каждый час
            if (this.config.auto_run_tracking) {
                await this.setScriptFrequency('hourly');
            }

            this.log('✅ Tracking Script настроен с динамическими параметрами');
        } catch (error) {
            await this.handleRetry('setupTrackingScript', error);
        }
    },

    async insertTrackingScriptCode() {
        try {
            const scriptTemplate = `
// Tracking Script - ${this.config.account_name || 'Default Account'}
// Created: ${new Date().toLocaleString('ru-RU')}
var ACCOUNT_NAME = '${this.config.account_name || 'Account'}';
var CREATIVE_APPROACH = '${this.config.creative_approach || 'video'}';
var CAMPAIGN_LOCATION = '${this.config.location || 'Default'}';
var CAMPAIGN_BUDGET = ${this.config.budget || 0};
var TARGET_CPA = ${this.config.targetCPA || 0};

function trackConversions() {
  var stats = {};
  stats['account'] = ACCOUNT_NAME;
  stats['creative'] = CREATIVE_APPROACH;
  stats['location'] = CAMPAIGN_LOCATION;
  
  Logger.log('Tracking for: ' + ACCOUNT_NAME + ' | Creative: ' + CREATIVE_APPROACH);
  Logger.log('Campaign Budget: €' + CAMPAIGN_BUDGET + ' | Target CPA: €' + TARGET_CPA);
  
  return stats;
}

trackConversions();
            `.trim();

            // Найти textarea для кода
            const codeEditor = document.querySelector('textarea[role="textbox"], [role="textbox"] textarea, .code-editor, div[role="textbox"]');
            if (codeEditor) {
                codeEditor.value = scriptTemplate;
                codeEditor.textContent = scriptTemplate;
                codeEditor.dispatchEvent(new Event('input', { bubbles: true }));
                codeEditor.dispatchEvent(new Event('change', { bubbles: true }));
                this.log('✅ Tracking script код вставлен с динамическими параметрами');
            }
        } catch (error) {
            this.log(`⚠️ Ошибка при вставке скрипта: ${error.message}`);
        }
    },

    async handleGoogleAuthorization() {
        try {
            await this.waitForElement('[role="dialog"]:has-text("Google")', 5000);
            
            const checkboxes = document.querySelectorAll('[role="dialog"] input[type="checkbox"]');
            checkboxes.forEach(cb => cb.checked = true);
            
            await this.clickElement('[role="dialog"] button:has-text("Continue")');
            await this.delay(2000);
            this.log('✅ Google авторизация пройдена');
        } catch (error) {
            this.log(`⚠️ Авторизация Google (может потребоваться вручную): ${error.message}`);
        }
    },

    async setScriptFrequency(frequency) {
        try {
            await this.clickElement('[role="tab"]:has-text("Schedule"), a:has-text("Frequency")');
            await this.delay(800);

            if (frequency === 'hourly') {
                await this.clickElement('input[value="hourly"], [role="option"]:has-text("Every hour")');
                this.log('✅ Периодичность установлена на каждый час');
            }
        } catch (error) {
            this.log(`⚠️ Ошибка при установке периодичности: ${error.message}`);
        }
    },

    // ========================
    // HELPER FUNCTIONS
    // ========================

    async closeGoogleGuidance() {
        try {
            // Закрыть все всплывающие подсказки Google
            const closeButtons = document.querySelectorAll(
                'button[aria-label*="Close"], button[aria-label*="close"], ' +
                '[role="button"][aria-label*="dismiss"], ' +
                'button[aria-label*="Dismiss"], ' +
                '.guidance-close-button'
            );
            
            for (const btn of closeButtons) {
                try {
                    btn.click();
                    await this.delay(100);
                } catch (e) {
                    // Silently continue
                }
            }
        } catch (error) {
            // Silently fail
        }
    },

    async handleStepError(error) {
        this.log(`❌ ОШИБКА НА ШАГЕ ${this.currentStep}: ${error.message}`);
        this.log(`⏸️ БОТ ПРИОСТАНОВЛЕН - Требуется вмешательство человека`);
        
        // Проверить 2FA
        if (document.body.innerText.includes('verification') || document.body.innerText.includes('2-Step')) {
            this.log('🔐 ОБНАРУЖЕНА ДВУХФАКТОРНАЯ АУТЕНТИФИКАЦИЯ - Пожалуйста, введите код вручную');
        }
    },

    async handleRetry(functionName, error) {
        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            this.log(`🔄 Попытка повтора ${this.retryCount}/${this.maxRetries}...`);
            await this.delay(2000);
            
            // Перезагрузить страницу при ошибке соединения
            if (error.message.includes('network') || error.message.includes('connection')) {
                this.log('🔄 Обнаружена ошибка соединения - перезагружаем страницу...');
                location.reload();
                await this.delay(3000);
            }
            
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
    },

    async findElement(selector) {
        const element = document.querySelector(selector);
        if (!element) {
            throw new Error(`Элемент не найден: ${selector}`);
        }
        return element;
    },

    async waitForElement(selector, timeout = this.waitTimeout) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            const element = document.querySelector(selector);
            if (element) return element;
            await this.delay(100);
        }
        throw new Error(`Элемент не появился за ${timeout}ms: ${selector}`);
    },

    async clickElement(selector) {
        const element = await this.waitForElement(selector);
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await this.delay(100);
        element.click();
        await this.delay(300);
    },

    async fillInput(selector, value) {
        const element = await this.findElement(selector);
        element.value = value;
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        await this.delay(300);
    },

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    log(message) {
        const timestamp = new Date().toLocaleTimeString('ru-RU');
        console.log(`[GoogleAdsBot ${timestamp}] ${message}`);
    }
};

// Инициализировать бота при загрузке страницы
GoogleAdsBot.init();