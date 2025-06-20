class TranslationEngine {
    constructor() {
        this.translations = new Map();
        this.currentLanguage = 'en';
        this.supportedLanguages = ['en', 'es', 'fr', 'de', 'ja'];
        this.translationTypes = {
            STRING: 'strings',
            VARIABLE: 'variables',
            FUNCTION: 'functions',
            COMMENT: 'comments',
            CLASS: 'classes'
        };
        
        this.init();
    }

    init() {
        // Initialize with some sample translations
        this.addTranslation('hello', 'STRING', {
            en: 'hello',
            es: 'hola',
            fr: 'bonjour',
            de: 'hallo',
            ja: 'こんにちは'
        });

        this.addTranslation('userName', 'VARIABLE', {
            en: 'userName',
            es: 'nombreUsuario',
            fr: 'nomUtilisateur',
            de: 'benutzername',
            ja: 'ユーザー名'
        });

        this.addTranslation('calculateTotal', 'FUNCTION', {
            en: 'calculateTotal',
            es: 'calcularTotal',
            fr: 'calculerTotal',
            de: 'berechneGesamt',
            ja: '合計を計算'
        });
    }

    addTranslation(originalText, type, translations) {
        const key = this.generateKey(originalText, type);
        this.translations.set(key, {
            original: originalText,
            type: type,
            translations: translations
        });
    }

    generateKey(text, type) {
        return `${type}:${text}`;
    }

    getTranslation(originalText, type, language = this.currentLanguage) {
        const key = this.generateKey(originalText, type);
        const translation = this.translations.get(key);
        
        if (!translation) {
            return originalText; // Return original if no translation found
        }

        return translation.translations[language] || originalText;
    }

    setCurrentLanguage(language) {
        if (this.supportedLanguages.includes(language)) {
            this.currentLanguage = language;
            this.notifyLanguageChanged();
        }
    }

    notifyLanguageChanged() {
        // Dispatch custom event for language change
        window.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: this.currentLanguage }
        }));
    }

    getAllTranslations() {
        return Array.from(this.translations.entries()).map(([key, value]) => ({
            key,
            ...value
        }));
    }

    updateTranslation(originalText, type, language, translation) {
        const key = this.generateKey(originalText, type);
        const existing = this.translations.get(key);
        
        if (existing) {
            existing.translations[language] = translation;
        } else {
            const newTranslations = {};
            this.supportedLanguages.forEach(lang => {
                newTranslations[lang] = lang === language ? translation : originalText;
            });
            this.addTranslation(originalText, type, newTranslations);
        }
    }

    exportTranslations() {
        const exportData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            languages: this.supportedLanguages,
            translations: Object.fromEntries(this.translations)
        };
        
        return JSON.stringify(exportData, null, 2);
    }

    importTranslations(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (data.translations) {
                this.translations = new Map(Object.entries(data.translations));
                return true;
            }
        } catch (error) {
            console.error('Failed to import translations:', error);
        }
        
        return false;
    }

    searchTranslations(query, type = 'all') {
        const results = [];
        
        for (const [key, translation] of this.translations) {
            if (type !== 'all' && translation.type !== type) {
                continue;
            }
            
            const searchText = translation.original.toLowerCase();
            const translatedText = Object.values(translation.translations)
                .join(' ').toLowerCase();
            
            if (searchText.includes(query.toLowerCase()) || 
                translatedText.includes(query.toLowerCase())) {
                results.push({ key, ...translation });
            }
        }
        
        return results;
    }

    generateTranslationFile(language) {
        const translations = {};
        
        for (const [key, translation] of this.translations) {
            translations[key] = translation.translations[language] || translation.original;
        }
        
        return {
            language,
            timestamp: new Date().toISOString(),
            translations
        };
    }

    getTranslationStats() {
        const stats = {
            total: this.translations.size,
            byType: {},
            byLanguage: {}
        };

        // Count by type
        Object.values(this.translationTypes).forEach(type => {
            stats.byType[type] = 0;
        });

        // Count by language completeness
        this.supportedLanguages.forEach(lang => {
            stats.byLanguage[lang] = 0;
        });

        for (const translation of this.translations.values()) {
            stats.byType[translation.type]++;
            
            this.supportedLanguages.forEach(lang => {
                if (translation.translations[lang] && 
                    translation.translations[lang] !== translation.original) {
                    stats.byLanguage[lang]++;
                }
            });
        }

        return stats;
    }
}

// Global instance
window.translationEngine = new TranslationEngine();

