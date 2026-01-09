// popup.js - Handle form submission and send config to content.js

class CampaignPopup {
    constructor() {
        this.form = document.getElementById('campaignForm');
        this.startBtn = document.getElementById('startBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.statusDiv = document.getElementById('status');

        this.initEventListeners();
        this.loadSavedConfig();
    }

    initEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.resetBtn.addEventListener('click', () => this.resetForm());
    }

    /**
     * Collect all form data including 6 dynamic parameters
     */
    collectFormData() {
        return {
            // Basic campaign info
            campaignName: document.getElementById('campaignName').value.trim(),
            budget: parseFloat(document.getElementById('budget').value),
            targetCPA: parseFloat(document.getElementById('targetCPA').value),
            location: document.getElementById('location').value.trim(),
            language: document.getElementById('language').value.trim(),

            // === 6 DYNAMIC PARAMETERS ===

            // 1️⃣ Schedule Times (DYNAMIC)
            schedule_start: document.getElementById('scheduleStart').value, // e.g., "09:00"
            schedule_end: document.getElementById('scheduleEnd').value,     // e.g., "18:00"
            schedule_days: 'Monday - Friday', // Fixed

            // 2️⃣ Channels (DYNAMIC)
            channels: document.getElementById('channels').value, // "all" or "discover"

            // 3️⃣ Gender (DYNAMIC)
            audience_gender: document.getElementById('audienceGender').value, // "all", "male", "female"

            // 4️⃣ Age Min (DYNAMIC)
            audience_age_min: document.getElementById('audienceAgeMin').value, // "18", "25", "35", etc.

            // 5️⃣ Age Max (DYNAMIC)
            audience_age_max: document.getElementById('audienceAgeMax').value, // "24", "34", "65+", etc.

            // Device type
            device_type: document.getElementById('deviceType').value, // "mobile" or "all"

            // 6️⃣ Ad Type (DYNAMIC)
            ad_type: document.getElementById('adType').value, // "single_image", "video", "carousel"

            // === CONSTANT ===
            // Optimize Targeting - ALWAYS FALSE (не добавляем в форму)
            use_optimized_targeting: false
        };
    }

    /**
     * Validate form data
     */
    validateFormData(config) {
        const errors = [];

        if (!config.campaignName) errors.push('Campaign name is required');
        if (!config.budget || config.budget <= 0) errors.push('Budget must be > 0');
        if (!config.targetCPA || config.targetCPA <= 0) errors.push('Target CPA must be > 0');
        if (!config.location) errors.push('Location is required');
        if (!config.language) errors.push('Language is required');
        if (!config.schedule_start) errors.push('Start time is required');
        if (!config.schedule_end) errors.push('End time is required');
        if (!config.channels) errors.push('Channels must be selected');
        if (!config.audience_gender) errors.push('Gender must be selected');
        if (!config.audience_age_min) errors.push('Age from must be selected');
        if (!config.audience_age_max) errors.push('Age to must be selected');
        if (!config.device_type) errors.push('Device type must be selected');
        if (!config.ad_type) errors.push('Ad type must be selected');

        return errors;
    }

    /**
     * Show status message
     */
    showStatus(message, type = 'info') {
        this.statusDiv.textContent = message;
        this.statusDiv.className = `status show ${type}`;
        
        if (type === 'success') {
            setTimeout(() => {
                this.statusDiv.classList.remove('show');
            }, 3000);
        }
    }

    /**
     * Handle form submission
     */
    async handleSubmit(e) {
        e.preventDefault();

        // Collect form data
        const config = this.collectFormData();

        // Validate
        const errors = this.validateFormData(config);
        if (errors.length > 0) {
            this.showStatus(`❌ ${errors.join(', ')}`, 'error');
            return;
        }

        // Save to storage
        try {
            await chrome.storage.local.set({ campaignConfig: config });
            this.showStatus('✅ Config saved! Opening Google Ads...', 'success');

            // Disable button while processing
            this.startBtn.disabled = true;
            this.startBtn.textContent = 'Processing...';

            // Open Google Ads in new tab
            setTimeout(() => {
                chrome.tabs.create({ 
                    url: 'https://ads.google.com/home/',
                    active: true 
                });
            }, 500);
        } catch (error) {
            console.error('Storage error:', error);
            this.showStatus(`❌ Error: ${error.message}`, 'error');
        }
    }

    /**
     * Reset form to defaults
     */
    resetForm() {
        this.form.reset();
        document.getElementById('scheduleStart').value = '09:00';
        document.getElementById('scheduleEnd').value = '18:00';
        document.getElementById('audienceAgeMin').value = '35';
        document.getElementById('audienceAgeMax').value = '65';
        document.getElementById('deviceType').value = 'mobile';
        document.getElementById('adType').value = 'single_image';
        this.statusDiv.classList.remove('show');
    }

    /**
     * Load previously saved config
     */
    loadSavedConfig() {
        chrome.storage.local.get(['campaignConfig'], (result) => {
            if (result.campaignConfig) {
                const config = result.campaignConfig;
                document.getElementById('campaignName').value = config.campaignName || '';
                document.getElementById('budget').value = config.budget || '';
                document.getElementById('targetCPA').value = config.targetCPA || '';
                document.getElementById('location').value = config.location || '';
                document.getElementById('language').value = config.language || '';
                document.getElementById('scheduleStart').value = config.schedule_start || '09:00';
                document.getElementById('scheduleEnd').value = config.schedule_end || '18:00';
                document.getElementById('channels').value = config.channels || '';
                document.getElementById('audienceGender').value = config.audience_gender || '';
                document.getElementById('audienceAgeMin').value = config.audience_age_min || '35';
                document.getElementById('audienceAgeMax').value = config.audience_age_max || '65';
                document.getElementById('deviceType').value = config.device_type || 'mobile';
                document.getElementById('adType').value = config.ad_type || 'single_image';
            }
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new CampaignPopup();
});
