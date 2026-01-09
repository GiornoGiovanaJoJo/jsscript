// popup.js - Handle comprehensive form submission with all dynamic parameters

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
     * Collect all form data including all dynamic parameters
     */
    collectFormData() {
        return {
            // ===== CAMPAIGN DETAILS (BASIC) =====
            campaignName: document.getElementById('campaignName').value.trim(),
            budget: parseFloat(document.getElementById('budget').value),
            targetCPA: parseFloat(document.getElementById('targetCPA').value),
            location: document.getElementById('location').value.trim(),
            language: document.getElementById('language').value.trim(),

            // ===== SCHEDULE (DYNAMIC) =====
            schedule_start: document.getElementById('scheduleStart').value,
            schedule_end: document.getElementById('scheduleEnd').value,
            schedule_days: 'Monday - Friday', // Fixed

            // ===== CHANNELS (DYNAMIC) =====
            channels: document.getElementById('channels').value,

            // ===== AUDIENCE (DYNAMIC) =====
            audience_gender: document.getElementById('audienceGender').value,
            audience_age_min: document.getElementById('audienceAgeMin').value,
            audience_age_max: document.getElementById('audienceAgeMax').value,
            device_type: document.getElementById('deviceType').value,

            // ===== AD SETTINGS (DYNAMIC) =====
            ad_type: document.getElementById('adType').value,

            // ===== AD CONTENT (DYNAMIC) =====
            domain: document.getElementById('domain').value.trim(),
            headlines: document.getElementById('headlines').value.trim(),
            descriptions: document.getElementById('descriptions').value.trim(),
            business_names: document.getElementById('businessNames').value.trim(),
            cta_text: document.getElementById('ctaText').value.trim(),
            final_url: document.getElementById('finalUrl').value.trim(),

            // ===== TRACKING SCRIPT (DYNAMIC) =====
            account_name: document.getElementById('accountName').value.trim(),
            creative_approach: document.getElementById('creativeApproach').value,
            auto_run_tracking: document.getElementById('autoRunTracking').checked,

            // ===== CONSTANT =====
            use_optimized_targeting: false
        };
    }

    /**
     * Validate all form data
     */
    validateFormData(config) {
        const errors = [];

        // Basic campaign info
        if (!config.campaignName) errors.push('Campaign name required');
        if (!config.budget || config.budget <= 0) errors.push('Budget must be > 0');
        if (!config.targetCPA || config.targetCPA <= 0) errors.push('Target CPA must be > 0');
        if (!config.location) errors.push('Location required');
        if (!config.language) errors.push('Language required');

        // Schedule
        if (!config.schedule_start) errors.push('Start time required');
        if (!config.schedule_end) errors.push('End time required');
        if (config.schedule_start >= config.schedule_end) errors.push('End time must be after start time');

        // Channels and audience
        if (!config.channels) errors.push('Channels must be selected');
        if (!config.audience_gender) errors.push('Gender must be selected');
        if (!config.audience_age_min) errors.push('Age from must be selected');
        if (!config.audience_age_max) errors.push('Age to must be selected');
        if (!config.device_type) errors.push('Device type must be selected');

        // Ad settings
        if (!config.ad_type) errors.push('Ad type must be selected');

        // Ad content (all required)
        if (!config.domain) errors.push('Domain URL required');
        if (!config.headlines) errors.push('Headlines required');
        if (!config.descriptions) errors.push('Descriptions required');
        if (!config.business_names) errors.push('Business names required');
        if (!config.cta_text) errors.push('CTA text required');
        if (!config.final_url) errors.push('Final URL required');

        // Tracking script
        if (!config.account_name) errors.push('Account name required');
        if (!config.creative_approach) errors.push('Creative approach must be selected');

        // Validate content arrays
        const headlines = config.headlines.split('\n').filter(h => h.trim());
        if (headlines.length === 0) errors.push('At least 1 headline required');
        if (headlines.length > 5) errors.push('Maximum 5 headlines allowed');

        const descriptions = config.descriptions.split('\n').filter(d => d.trim());
        if (descriptions.length === 0) errors.push('At least 1 description required');
        if (descriptions.length > 5) errors.push('Maximum 5 descriptions allowed');

        const businessNames = config.business_names.split('\n').filter(n => n.trim());
        if (businessNames.length === 0) errors.push('At least 1 business name required');

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
            this.showStatus(`❌ ${errors.join('; ')}`, 'error');
            return;
        }

        // Save to storage
        try {
            await chrome.storage.local.set({ campaignConfig: config });
            this.showStatus('✅ Config saved! Opening Google Ads...', 'success');

            // Disable button while processing
            this.startBtn.disabled = true;
            this.startBtn.textContent = '⏳ Processing...';

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
        // Set default values
        document.getElementById('scheduleStart').value = '09:00';
        document.getElementById('scheduleEnd').value = '18:00';
        document.getElementById('channels').value = 'discover';
        document.getElementById('audienceAgeMin').value = '35';
        document.getElementById('audienceAgeMax').value = '65';
        document.getElementById('deviceType').value = 'mobile';
        document.getElementById('adType').value = 'single_image';
        document.getElementById('creativeApproach').value = 'video';
        document.getElementById('autoRunTracking').checked = true;
        this.statusDiv.classList.remove('show');
        this.startBtn.disabled = false;
        this.startBtn.textContent = '▶️ Start Campaign';
    }

    /**
     * Load previously saved config
     */
    loadSavedConfig() {
        chrome.storage.local.get(['campaignConfig'], (result) => {
            if (result.campaignConfig) {
                const config = result.campaignConfig;
                
                // Fill basic campaign info
                document.getElementById('campaignName').value = config.campaignName || '';
                document.getElementById('budget').value = config.budget || '';
                document.getElementById('targetCPA').value = config.targetCPA || '';
                document.getElementById('location').value = config.location || '';
                document.getElementById('language').value = config.language || '';

                // Fill schedule
                document.getElementById('scheduleStart').value = config.schedule_start || '09:00';
                document.getElementById('scheduleEnd').value = config.schedule_end || '18:00';

                // Fill channels and audience
                document.getElementById('channels').value = config.channels || 'discover';
                document.getElementById('audienceGender').value = config.audience_gender || '';
                document.getElementById('audienceAgeMin').value = config.audience_age_min || '35';
                document.getElementById('audienceAgeMax').value = config.audience_age_max || '65';
                document.getElementById('deviceType').value = config.device_type || 'mobile';

                // Fill ad settings
                document.getElementById('adType').value = config.ad_type || 'single_image';

                // Fill ad content
                document.getElementById('domain').value = config.domain || '';
                document.getElementById('headlines').value = config.headlines || '';
                document.getElementById('descriptions').value = config.descriptions || '';
                document.getElementById('businessNames').value = config.business_names || '';
                document.getElementById('ctaText').value = config.cta_text || '';
                document.getElementById('finalUrl').value = config.final_url || '';

                // Fill tracking script settings
                document.getElementById('accountName').value = config.account_name || '';
                document.getElementById('creativeApproach').value = config.creative_approach || 'video';
                document.getElementById('autoRunTracking').checked = config.auto_run_tracking !== false;
            }
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new CampaignPopup();
});