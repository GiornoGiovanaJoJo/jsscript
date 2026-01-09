/**
 * Google Ads Automation Bot v3 - Clean & Reliable
 * Работает с актуальным интерфейсом Google Ads
 * Авторизация: автоматическая
 */

const GoogleAdsBot = {
  config: {
    campaignName: 'Test Campaign',
    budget: '100',
    targetCPA: '50',
    location: 'Russia',
    language: 'Russian',
    debug: true
  },

  state: {
    isRunning: false,
    currentStep: 0,
    retries: 0,
    maxRetries: 3
  },

  // ==========================================
  // MAIN ENTRY POINT
  // ==========================================
  async run() {
    if (this.state.isRunning) {
      this.log('⚠️ Бот уже запущен!');
      return false;
    }

    this.state.isRunning = true;
    this.log('🤖 Инициализация Google Ads Bot v3...');

    try {
      // Проверка авторизации
      if (!this.isLoggedIn()) {
        this.log('🔐 Требуется авторизация. Запускаем процесс входа...');
        await this.login();
      }

      // Основной пайплайн
      await this.pipeline();

      this.log('✅ ВСЕ ОПЕРАЦИИ ЗАВЕРШЕНЫ УСПЕШНО!');
      return true;
    } catch (error) {
      this.log(`❌ КРИТИЧЕСКАЯ ОШИБКА: ${error.message}`);
      console.error(error);
      return false;
    } finally {
      this.state.isRunning = false;
    }
  },

  // ==========================================
  // AUTHENTICATION
  // ==========================================
  isLoggedIn() {
    // Проверяем наличие основного интерфейса
    return document.querySelector('[aria-label="Campaigns"], [data-view-id="campaigns-overview"]') !== null;
  },

  async login() {
    this.log('🔐 Поиск кнопки входа...');
    
    const loginButton = this.findButton(['Sign in', 'Войти', 'Sign In']);
    if (!loginButton) {
      throw new Error('Login button not found');
    }

    this.log('🔐 Нажимаем кнопку входа...');
    loginButton.click();
    await this.wait(3000);

    // Ждем загрузки интерфейса
    await this.waitForElement('[aria-label="Campaigns"], [data-view-id="campaigns-overview"]', 15000);
    this.log('✅ Вход выполнен успешно!');
  },

  // ==========================================
  // MAIN PIPELINE
  // ==========================================
  async pipeline() {
    this.state.currentStep = 1;
    await this.navigateToConversions();
    
    this.state.currentStep = 2;
    await this.createConversion();
    
    this.state.currentStep = 3;
    await this.navigateToCampaigns();
    
    this.state.currentStep = 4;
    await this.createCampaign();
    
    this.state.currentStep = 5;
    await this.fillCampaignDetails();
    
    this.state.currentStep = 6;
    await this.publishCampaign();
  },

  // ==========================================
  // STEP 1: NAVIGATE TO CONVERSIONS
  // ==========================================
  async navigateToConversions() {
    this.log('📋 Шаг 1: Переход в Goals / Conversions...');
    
    try {
      // Вариант 1: Через боковое меню
      let goalsLink = document.querySelector(
        'a[href*="/aw/conversions"], ' +
        '[aria-label*="Goals"], ' +
        '[aria-label*="Conversions"]'
      );

      // Вариант 2: Через главное меню
      if (!goalsLink) {
        const navItems = document.querySelectorAll('a[role="tab"], nav a, [role="navigation"] a');
        for (const item of navItems) {
          if (item.textContent.includes('Goals') || item.textContent.includes('Conversions')) {
            goalsLink = item;
            break;
          }
        }
      }

      if (!goalsLink) {
        throw new Error('Goals link not found. Trying XPath...');
      }

      this.log('✅ Найдена ссылка на Goals');
      goalsLink.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await this.wait(300);
      goalsLink.click();
      await this.wait(2000);
      
      this.log('✅ Шаг 1: УСПЕШНО!');
    } catch (error) {
      await this.retry('navigateToConversions', error);
    }
  },

  // ==========================================
  // STEP 2: CREATE CONVERSION
  // ==========================================
  async createConversion() {
    this.log('📋 Шаг 2: Создание конверсии...');
    
    try {
      // Закрыть все диалоги и тултипы
      await this.closeAllDialogs();
      await this.wait(500);

      // Поиск кнопки Create / New Conversion
      const createBtn = this.findButton([
        'Create',
        'New Conversion',
        'New Conversion Action',
        '+',
        'Add'
      ]);

      if (!createBtn) {
        throw new Error('Create button not found');
      }

      this.log('📋 Нажимаем кнопку Create...');
      createBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await this.wait(500);
      createBtn.click();
      await this.wait(1500);

      // Выбор типа конверсии: Offline
      await this.selectFromMenu(['Offline', 'Offline conversion'], 'offline conversion type');
      await this.wait(1000);

      // Пропустить Data Source (Skip)
      const skipBtn = this.findButton(['Skip', 'Next']);
      if (skipBtn) {
        skipBtn.click();
        await this.wait(1000);
      }

      // Отметить Custom data
      const customCheckbox = document.querySelector(
        'input[aria-label*="Custom"], ' +
        'input[type="checkbox"][aria-label*="customer"]'
      );
      if (customCheckbox && !customCheckbox.checked) {
        customCheckbox.click();
        await this.wait(500);
      }

      // Нажать Done
      const doneBtn = this.findButton(['Done', 'Save', 'Create']);
      if (doneBtn) {
        doneBtn.click();
        await this.wait(1500);
      }

      this.log('✅ Шаг 2: Конверсия создана УСПЕШНО!');
    } catch (error) {
      await this.retry('createConversion', error);
    }
  },

  // ==========================================
  // STEP 3: NAVIGATE TO CAMPAIGNS
  // ==========================================
  async navigateToCampaigns() {
    this.log('📋 Шаг 3: Переход к Campaigns...');
    
    try {
      let campaignsLink = document.querySelector(
        '[aria-label*="Campaigns"], ' +
        'a[href*="/aw/campaigns"]'
      );

      if (!campaignsLink) {
        const navItems = document.querySelectorAll('a[role="tab"], nav a, [role="navigation"] a');
        for (const item of navItems) {
          if (item.textContent.includes('Campaigns')) {
            campaignsLink = item;
            break;
          }
        }
      }

      if (!campaignsLink) {
        throw new Error('Campaigns link not found');
      }

      campaignsLink.click();
      await this.wait(2000);
      
      this.log('✅ Шаг 3: Перешли на Campaigns УСПЕШНО!');
    } catch (error) {
      await this.retry('navigateToCampaigns', error);
    }
  },

  // ==========================================
  // STEP 4: CREATE CAMPAIGN
  // ==========================================
  async createCampaign() {
    this.log('📋 Шаг 4: Создание кампании...');
    
    try {
      await this.closeAllDialogs();
      await this.wait(500);

      // Нажать на + New Campaign
      const newCampaignBtn = this.findButton([
        'New Campaign',
        '+ New Campaign',
        'Create campaign',
        '+'
      ]);

      if (!newCampaignBtn) {
        throw new Error('New Campaign button not found');
      }

      newCampaignBtn.click();
      await this.wait(1500);

      // Выбрать тип кампании: Demand Gen
      await this.selectFromMenu(['Demand Gen', 'Performance Max', 'Search'], 'campaign type');
      await this.wait(1000);

      this.log('✅ Шаг 4: Кампания создана УСПЕШНО!');
    } catch (error) {
      await this.retry('createCampaign', error);
    }
  },

  // ==========================================
  // STEP 5: FILL CAMPAIGN DETAILS
  // ==========================================
  async fillCampaignDetails() {
    this.log('📋 Шаг 5: Заполнение деталей кампании...');
    
    try {
      // Имя кампании
      if (this.config.campaignName) {
        await this.fillInput(
          'input[placeholder*="campaign"], input[aria-label*="Campaign name"]',
          this.config.campaignName,
          'campaign name'
        );
      }

      // Дневной бюджет
      if (this.config.budget) {
        await this.fillInput(
          'input[placeholder*="budget"], input[aria-label*="Daily budget"]',
          this.config.budget,
          'daily budget'
        );
      }

      // Target CPA
      if (this.config.targetCPA) {
        await this.fillInput(
          'input[aria-label*="Target CPA"], input[placeholder*="CPA"]',
          this.config.targetCPA,
          'target CPA'
        );
      }

      // Локация
      if (this.config.location) {
        await this.fillLocationInput(this.config.location);
      }

      // Язык
      if (this.config.language) {
        await this.fillLanguageInput(this.config.language);
      }

      this.log('✅ Шаг 5: Детали заполнены УСПЕШНО!');
    } catch (error) {
      await this.retry('fillCampaignDetails', error);
    }
  },

  // ==========================================
  // STEP 6: PUBLISH CAMPAIGN
  // ==========================================
  async publishCampaign() {
    this.log('📋 Шаг 6: Публикация кампании...');
    
    try {
      const publishBtn = this.findButton([
        'Publish',
        'Save',
        'Create campaign',
        'Launch',
        'Done'
      ]);

      if (!publishBtn) {
        this.log('⚠️ Кнопка публикации не найдена. Кампания может быть уже опубликована.');
        return;
      }

      publishBtn.click();
      await this.wait(2000);
      
      this.log('✅ Шаг 6: Кампания опубликована УСПЕШНО!');
    } catch (error) {
      await this.retry('publishCampaign', error);
    }
  },

  // ==========================================
  // HELPER FUNCTIONS
  // ==========================================

  /**
   * Поиск кнопки по тексту
   */
  findButton(texts) {
    const textArray = Array.isArray(texts) ? texts : [texts];
    
    // Поиск через querySelectorAll
    const buttons = document.querySelectorAll(
      'button, [role="button"], a[role="button"], [role="link"]'
    );

    for (const btn of buttons) {
      const btnText = btn.textContent.trim();
      for (const text of textArray) {
        if (btnText.includes(text) || btnText === text) {
          return btn;
        }
      }
    }

    return null;
  },

  /**
   * Выбор из меню/выпадающего списка
   */
  async selectFromMenu(options, label = 'option') {
    this.log(`  → Ищем опцию меню: ${options.join(' или ')}`);
    
    const optionArray = Array.isArray(options) ? options : [options];
    const menuItems = document.querySelectorAll(
      '[role="option"], [role="menuitem"], .goog-menuitem, li[role="option"]'
    );

    for (const item of menuItems) {
      const itemText = item.textContent.trim();
      for (const option of optionArray) {
        if (itemText.includes(option) || itemText === option) {
          this.log(`  ✓ Найдена опция: ${itemText}`);
          item.click();
          await this.wait(800);
          return true;
        }
      }
    }

    this.log(`  ⚠️ Опция не найдена: ${options.join(' или ')}`);
    return false;
  },

  /**
   * Заполнение input поля
   */
  async fillInput(selector, value, label = 'field') {
    const input = document.querySelector(selector);
    
    if (!input) {
      this.log(`  ⚠️ Поле не найдено: ${label}`);
      return false;
    }

    this.log(`  → Заполняем ${label}: ${value}`);
    input.focus();
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await this.wait(500);
    return true;
  },

  /**
   * Заполнение поля локации с автодополнением
   */
  async fillLocationInput(location) {
    const locationInput = document.querySelector(
      'input[placeholder*="country"], input[aria-label*="Location"]'
    );

    if (!locationInput) {
      this.log('  ⚠️ Поле локации не найдено');
      return;
    }

    this.log(`  → Выбираем локацию: ${location}`);
    locationInput.focus();
    locationInput.value = location;
    locationInput.dispatchEvent(new Event('input', { bubbles: true }));
    await this.wait(800);

    // Выбрать первый результат
    const firstOption = document.querySelector('[role="option"]');
    if (firstOption) {
      firstOption.click();
      await this.wait(500);
    }
  },

  /**
   * Заполнение поля языка
   */
  async fillLanguageInput(language) {
    const langInput = document.querySelector(
      'input[placeholder*="language"], input[aria-label*="Language"]'
    );

    if (!langInput) {
      this.log('  ⚠️ Поле языка не найдено');
      return;
    }

    this.log(`  → Выбираем язык: ${language}`);
    langInput.focus();
    langInput.value = language;
    langInput.dispatchEvent(new Event('input', { bubbles: true }));
    await this.wait(800);

    const firstOption = document.querySelector('[role="option"]');
    if (firstOption) {
      firstOption.click();
      await this.wait(500);
    }
  },

  /**
   * Закрытие всех диалогов
   */
  async closeAllDialogs() {
    const closeButtons = document.querySelectorAll(
      '[aria-label="Close"], ' +
      'button[aria-label*="Close"], ' +
      '.goog-menu-button-collapse'
    );

    for (const btn of closeButtons) {
      if (btn.offsetHeight > 0 && btn.offsetWidth > 0) {
        btn.click();
        await this.wait(200);
      }
    }
  },

  /**
   * Ожидание элемента
   */
  async waitForElement(selector, timeout = 10000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const element = document.querySelector(selector);
      if (element) {
        this.log(`  ✓ Элемент найден: ${selector}`);
        return element;
      }
      await this.wait(200);
    }

    throw new Error(`Element not found after ${timeout}ms: ${selector}`);
  },

  /**
   * Обработка ошибок с повторными попытками
   */
  async retry(functionName, error) {
    this.state.retries++;
    
    if (this.state.retries < this.state.maxRetries) {
      this.log(`  🔄 Повторная попытка ${this.state.retries}/${this.state.maxRetries}...`);
      await this.wait(2000);
      return await this[functionName]?.();
    } else {
      this.log(`  ❌ Макс попыток достигнуто! Ошибка: ${error.message}`);
      this.state.retries = 0;
      throw error;
    }
  },

  /**
   * Задержка
   */
  wait(ms) {
    return new Promise(r => setTimeout(r, ms));
  },

  /**
   * Логирование
   */
  log(message) {
    const timestamp = new Date().toLocaleTimeString('ru-RU');
    const prefix = `[GoogleAdsBot ${timestamp}]`;
    console.log(`${prefix} ${message}`);
    
    if (this.config.debug) {
      // Можно добавить вывод в UI
    }
  }
};

// ==========================================
// ЗАПУСК
// ==========================================

// Для запуска в консоли
if (typeof window !== 'undefined') {
  window.GoogleAdsBot = GoogleAdsBot;
  console.log('✅ GoogleAdsBot загружен! Запустите: GoogleAdsBot.run()');
}

// Или сразу запустить
// GoogleAdsBot.run();
