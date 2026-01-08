# Гайд по поиску CSS селекторов Google Ads

Основная идея: content.js требует **точные** CSS селекторы для всех элементов, которые бот будет использовать.

## Как найти селектор

### Метод 1: Правые клик - Inspect Element

1. Перейдите на https://ads.google.com
2. Держите Ctrl+Shift+C (или правый клик → Inspect)
3. Поэкспериментируйте с ножницами (выделение элементов)

### Метод 2: Console - Проверка селектора

Откройте DevTools (F12) и в консоли введите:

```javascript
// Проверить, найдось ли элемент
 document.querySelector('button:has-text("New Campaign")')
 // Если null - селектор не подошёл
 // Если HTMLElement - селектор работает!

// Найти все атрибуты элемента
 document.querySelector('button').attributes

// Проверить текст
 document.querySelector('button').textContent
```

## Основные CSS паттерны

### Находжение элементов по тексту:

```css
/* Кросс-браузерные решения (XPath используют text()) */
//button[contains(text(), 'New Campaign')]

/* CSS (Google Chrome и новые браузеры) */
button:has-text('New Campaign')

/* Альтернатив - комбинированные селекторы */
button[aria-label*='New Campaign']
button[role='button'][aria-label*='Campaign']
```

### Поиск по атрибутам:

```css
/* По class */
input.budget-input

/* По id */
#campaign-name-input

/* По placeholder */
input[placeholder='Enter budget']

/* По aria-label */
input[aria-label='Daily budget']

/* По type */
input[type='number']

/* Комбинированные */
input[type='text'][aria-label*='budget']
```

### По иерархии:

```css
/* Пымывое стрелка */
.parent > .child

/* Правнук стрелка */
.parent .descendant

/* Правом сосед */
.element + .next-element

/* Любые соседы */
.element ~ .any-next-element
```

## Как использовать в content.js

### Пример 1: Найти и кликнуть

Найдите точный селектор кнопки:

```javascript
// В content.js, замените:
await this.clickElement('button:has-text("New Campaign")');

// На строку с вашим селектором:
await this.clickElement('button[aria-label="New Campaign"], .create-campaign-btn, [data-id="new-campaign"]');
```

### Пример 2: Найти и заполнить Input

```javascript
// Найти поле даже если это уникальные атрибуты:
await this.fillInput(
  'input[placeholder*="daily"], input[aria-label*="budget"], .budget-field',
  '100'
);
```

### Пример 3: По ариа-лебелям

```javascript
// Кнопка с aria-label
await this.clickElement('[role="button"][aria-label="New Campaign"]');

// Input с aria-label
await this.fillInput('input[aria-label="Daily budget"]', '100');
```

## Найти селекторы для каждого шага

### Шаг 1: Конверсия

Наидите селекторы для:
- [ ] Кнопка Goals
- [ ] кнопка Нев Conversion Action
- [ ] Таб Оффлайн
- [ ] Кнопка Skip
- [ ] Checkbox Кастом дата
- [ ] Input для value
- [ ] Кнопка Done

### Шаг 2: Кампания

Наидите селекторы для:
- [ ] Кнопка New Campaign
- [ ] Таб Demand Gen
- [ ] Опция Лид
- [ ] Input Daily Budget
- [ ] Input Target CPA
- [ ] Input Location/Country
- [ ] Input Language
- [ ] Dropdown/Select дней недели
- [ ] Input Start Time
- [ ] Input End Time
- [ ] Checkbox Mobile phones

### Шаг 3: Ad Group

Наидите селекторы для:
- [ ] Input Audience Name
- [ ] Checkbox демографических параметров
- [ ] Опция Discover
- [ ] Checkbox Optimization

### Шаг 4: Объявления

Наидите селекторы для:
- [ ] Input Domain
- [ ] Upload Video/Images кнопка
- [ ] Input Headline (5 фиелдов)
- [ ] Input Description (5 фиелдов)
- [ ] Input Business Name
- [ ] CTA dropdown
- [ ] Input Final URL
- [ ] Duplicate button

### Шаг 5: Публикация

Наидите селекторы для:
- [ ] Publish Campaign кнопка

### Шаг 6: Tracking Script

Наидите селекторы для:
- [ ] Tools меню
- [ ] Scripts опция
- [ ] New Script кнопка
- [ ] Code editor textarea
- [ ] Save кнопка
- [ ] Run кнопка
- [ ] Google authorization dialog
- [ ] Continue кнопка в dialog
- [ ] Schedule/Frequency tab
- [ ] Hourly опция

## Отладка

### Проверь селектора в console:

```javascript
// Проверить значение
document.querySelector('button:has-text("New Campaign")')
// если null - селектор не работает

// Найти альтернативные селекторы
Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('New Campaign'))

// Проверить все атрибуты
const btn = document.querySelector('button');
for (let attr of btn.attributes) {
  console.log(attr.name + ': ' + attr.value);
}
```

## Оставленные от TODO

В content.js есть комментарии `TODO:`, которые требуют ваших селекторов.

Найдите и ответите в pull request.

## Пример: Полный вклад селекторов

Когда вы понимаете все селекторы, создайте файл:

`selectors.js`

```javascript
// Все найденные селекторы
const SELECTORS = {
  // Конверсия
  goalsButton: 'a[aria-label*="Goals"]',
  newConversionButton: 'button:has-text("New Conversion Action")',
  offlineOption: 'div:has-text("Offline")',
  // ... и т.d.
};
```

Потом автоматически загружайте используя SELECTORS.goalsButton вместо хардкодинга.
