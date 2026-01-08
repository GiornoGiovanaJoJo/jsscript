/**
 * Основные CSS селекторы для Google Ads автоматизации
 * 
 * НОВО! Если селектор не работает, НОВО:
 * 1. Откройте DevTools (F12)
 * 2. В Console введите: document.querySelector('ВАШ_СЕЛЕКТОР')
 * 3. Когда вернёт HTMLElement - селектор работает!
 * 4. Наоборот - селектор не подошёл
 */

const SELECTORS = {
  // ========================================
  // STEP 1: CONVERSION CREATION
  // ========================================
  conversion: {
    // Навигация к вкладке Goals
    goalsTab: 'a[href*="goals"], [role="tab"][aria-label*="Goals"], nav a:has-text("Goals")',
    
    // Кнопка Нев Conversion Action
    newConversionBtn: 'button:has-text("New Conversion"), [role="button"]:has-text("Conversion"), button[aria-label*="conversion"]',
    
    // Опция Offline conversion
    offlineOption: 'div:has-text("Offline"), [role="option"]:has-text("Offline"), label:has-text("Offline")',
    
    // Кнопка Skip (data source)
    skipBtn: 'button:has-text("Skip"), [role="button"]:has-text("Skip")',
    
    // Checkbox кастом данных
    customDataCheckbox: 'input[type="checkbox"][aria-label*="Custom"], input[type="checkbox"][aria-label*="custom"]',
    
    // Input для стоимости конверсии
    conversionValue: 'input[type="number"][aria-label*="value"], input[type="number"][placeholder*="value"], input[aria-label*="Value"]',
    
    // Кнопка Done/Save
    doneBtn: 'button:has-text("Done"), button:has-text("Save"), [role="button"]:has-text("Done")'
  },

  // ========================================
  // STEP 2: CAMPAIGN CREATION
  // ========================================
  campaign: {
    // Навигация к Кампаниям
    campaignsTab: 'a[href*="campaigns"], [role="tab"][aria-label*="Campaigns"], nav a:has-text("Campaigns")',
    
    // Кнопка New Campaign
    newCampaignBtn: 'button:has-text("New Campaign"), [role="button"]:has-text("+ Campaign"), button:has-text("Create campaign")',
    
    // Опция Demand Gen
    demandGenOption: 'div:has-text("Demand Gen"), [role="option"]:has-text("Demand Gen"), label:has-text("Demand Gen")',
    
    // Опция Lead
    leadOption: 'div:has-text("Lead"), [role="option"]:has-text("Lead"), label:has-text("Lead conversion")',
    
    // Input дневного бюджета
    dailyBudget: 'input[type="number"][aria-label*="budget"], input[type="number"][placeholder*="budget"], input[aria-label*="Daily budget"]',
    
    // Input Target CPA
    targetCPA: 'input[type="number"][aria-label*="CPA"], input[type="number"][aria-label*="cost"], input[placeholder*="CPA"]',
    
    // Input география/страна
    location: 'input[aria-label*="Location"], input[aria-label*="Country"], input[placeholder*="country"], input[placeholder*="location"]',
    
    // Input язык
    language: 'input[aria-label*="Language"], input[aria-label*="language"], input[placeholder*="language"]',
    
    // Dropdown/Option для дней недели
    daysDropdown: 'select[aria-label*="days"], [role="combobox"][aria-label*="day"], div[aria-label*="Days"]',
    
    // Input времени начала
    startTime: 'input[aria-label*="start"], input[aria-label*="Start"], input[placeholder*="start"], input[type="time"]',
    
    // Input времени конца
    endTime: 'input[aria-label*="end"], input[aria-label*="End"], input[placeholder*="end"]',
    
    // Checkbox мобильных телефонов
    mobileCheckbox: 'input[type="checkbox"][aria-label*="Mobile"], input[type="checkbox"][aria-label*="phones"]'
  },

  // ========================================
  // STEP 3: AD GROUP & AUDIENCE
  // ========================================
  adGroup: {
    // Input имени аудитории
    audienceName: 'input[aria-label*="Audience"], input[placeholder*="audience"], input[aria-label*="name"]',
    
    // Опция Discover (тип таргетинга)
    discoverOption: 'div:has-text("Discover"), [role="option"]:has-text("Discover"), label:has-text("Discover")',
    
    // Checkbox демографии
    demographicsCheckbox: 'input[type="checkbox"][aria-label*="demographics"], input[type="checkbox"][aria-label*="Demographics"]',
    
    // Checkbox оптимизации
    optimizationCheckbox: 'input[type="checkbox"][aria-label*="optimization"], input[type="checkbox"][aria-label*="Optimization"]'
  },

  // ========================================
  // STEP 4: CREATE ADS
  // ========================================
  ads: {
    // Input домена
    domain: 'input[aria-label*="domain"], input[placeholder*="domain"], input[aria-label*="Display URL"]',
    
    // Кнопка Upload (для видео/изображений)
    uploadBtn: 'button:has-text("Upload"), [role="button"]:has-text("Upload"), button[aria-label*="upload"]',
    
    // Input для логотипа
    logo: 'input[aria-label*="Logo"], input[type="file"][aria-label*="logo"]',
    
    // Input для заголовков (множество)
    headlines: 'input[aria-label*="Headline"], textarea[placeholder*="headline"], input[placeholder*="headline"]',
    
    // Input для описаний (множество)
    descriptions: 'textarea[aria-label*="Description"], input[placeholder*="description"], textarea[placeholder*="description"]',
    
    // Input бизнес-имени
    businessName: 'input[aria-label*="Business"], input[placeholder*="business"], input[aria-label*="name"]',
    
    // Dropdown Call to Action
    cta: 'select[aria-label*="action"], [role="combobox"][aria-label*="CTA"], input[aria-label*="Call to action"]',
    
    // Input Final URL
    finalUrl: 'input[aria-label*="Final"], input[placeholder*="http"], input[aria-label*="URL"], input[type="url"]',
    
    // Кнопка Duplicate
    duplicateBtn: 'button:has-text("Duplicate"), [role="button"]:has-text("Duplicate")',
    
    // Поп-ап для закрытия гугловских подсказок
    closeGuidanceBtn: 'button[aria-label*="Close"], [role="button"][aria-label*="close"], button[aria-label*="Dismiss"]'
  },

  // ========================================
  // STEP 5: PUBLISH CAMPAIGN
  // ========================================
  publish: {
    // Кнопка Publish Campaign
    publishBtn: 'button:has-text("Publish"), button:has-text("Launch"), [role="button"]:has-text("Publish")'
  },

  // ========================================
  // STEP 6: TRACKING SCRIPT
  // ========================================
  tracking: {
    // Навигация к Tools
    toolsBtn: 'a[href*="tools"], [role="tab"][aria-label*="Tools"], nav a:has-text("Tools")',
    
    // Меню Scripts
    scriptsOption: 'a:has-text("Scripts"), [role="menuitem"]:has-text("Scripts"), div:has-text("Scripts")',
    
    // Кнопка New Script
    newScriptBtn: 'button:has-text("New Script"), [role="button"]:has-text("New"), button[aria-label*="script"]',
    
    // Textarea для кода
    codeEditor: 'textarea[role="textbox"], [role="textbox"] textarea, .code-editor, pre[contenteditable]',
    
    // Кнопка Save
    saveBtn: 'button:has-text("Save"), [role="button"]:has-text("Save")',
    
    // Кнопка Run
    runBtn: 'button:has-text("Run"), [role="button"]:has-text("Run"), button:has-text("Execute")',
    
    // Google authorization dialog
    authDialog: '[role="dialog"]:has-text("Google"), .authorization-dialog, [role="dialog"] h1',
    
    // Checkboxes в dialog для разрешений
    authCheckboxes: '[role="dialog"] input[type="checkbox"]',
    
    // Кнопка Continue в dialog
    continueBtn: '[role="dialog"] button:has-text("Continue"), [role="dialog"] [role="button"]:has-text("Continue")',
    
    // Вкладка Schedule
    scheduleTab: '[role="tab"]:has-text("Schedule"), a:has-text("Schedule"), a:has-text("Frequency")',
    
    // Опция каждый час
    hourlyOption: 'input[value="hourly"], [role="option"]:has-text("Every hour"), label:has-text("Every hour")'
  }
};

/**
 * Пример проверки селектора в console:
 * 
 * // Проверить кнопку New Campaign
 * document.querySelector(SELECTORS.campaign.newCampaignBtn)
 * // Если вернёт HTMLElement - селектор работает!
 * // Если null - при рефреше или редактируйте селектор
 */
