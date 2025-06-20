class UIController {
    constructor() {
        this.currentTab = 'editor';
        this.editor = null;
        this.isTranslatedView = false;
        this.originalCode = '';
        
        this.init();
    }

    async init() {
        await this.initializeEditor();
        this.setupEventListeners();
        this.updateTranslationStats();
        this.populateTranslationList();
    }

    async initializeEditor() {
        try {
            const monaco = await import('monaco-editor');
            
            this.editor = monaco.editor.create(document.getElementById('codeEditor'), {
                value: this.getDefaultCode(),
                language: 'javascript',
                theme: 'vs-dark',
                automaticLayout: true,
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                wordWrap: 'on'
            });

            this.originalCode = this.editor.getValue();
        } catch (error) {
            console.error('Failed to initialize Monaco editor:', error);
            // Fallback to textarea
            this.createFallbackEditor();
        }
    }

    createFallbackEditor() {
        const editorContainer = document.getElementById('codeEditor');
        editorContainer.innerHTML = `
            <textarea id="fallbackEditor" style="width: 100%; height: 100%; 
                font-family: 'Courier New', monospace; font-size: 14px; 
                padding: 1rem; border: none; background: #1e1e1e; color: #fff;">
${this.getDefaultCode()}
            </textarea>
        `;
        
        this.editor = {
            getValue: () => document.getElementById('fallbackEditor').value,
            setValue: (value) => document.getElementById('fallbackEditor').value = value
        };
    }

    getDefaultCode() {
        return `// Sample JavaScript code for translation
function calculateTotal(items) {
    let total = 0;
    for (const item of items) {
        total += item.price;
    }
    return total;
}

class ShoppingCart {
    constructor() {
        this.items = [];
        this.customerName = "";
    }
    
    addItem(product, quantity) {
        this.items.push({
            name: product.name,
            price: product.price,
            quantity: quantity
        });
        console.log("Item added to cart");
    }
    
    getTotal() {
        return calculateTotal(this.items);
    }
}

// Usage example
const cart = new ShoppingCart();
cart.customerName = "John Doe";
cart.addItem({ name: "Apple", price: 1.50 }, 3);
cart.addItem({ name: "Banana", price: 0.75 }, 2);

console.log("Total cost: $" + cart.getTotal());
`;
    }

    setupEventListeners() {
        // Language selector
        document.getElementById('currentLanguage').addEventListener('change', (e) => {
            window.translationEngine.setCurrentLanguage(e.target.value);
            this.updateUI();
        });

        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Code scanning
        document.getElementById('scanCode').addEventListener('click', () => {
            this.scanCode();
        });

        // Translation view toggle
        document.getElementById('toggleTranslatedView').addEventListener('click', () => {
            this.toggleTranslatedView();
        });

        // Translation management
        document.getElementById('generateTranslations').addEventListener('click', () => {
            this.generateTranslations();
        });

        document.getElementById('exportTranslations').addEventListener('click', () => {
            this.exportTranslations();
        });

        document.getElementById('importTranslations').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });

        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.importTranslations(e.target.files[0]);
        });

        // Search and filter
        document.getElementById('searchTranslations').addEventListener('input', (e) => {
            this.filterTranslations(e.target.value);
        });

        document.getElementById('filterType').addEventListener('change', (e) => {
            this.filterTranslations(document.getElementById('searchTranslations').value, e.target.value);
        });

        // Preview controls
        document.getElementById('runTranslatedCode').addEventListener('click', () => {
            this.runCode(true);
        });

        document.getElementById('runOriginalCode').addEventListener('click', () => {
            this.runCode(false);
        });

        // Language change events
        window.addEventListener('languageChanged', () => {
            this.updateUI();
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        this.currentTab = tabName;
    }

    scanCode() {
        const codeInput = document.getElementById('codeInput').value;
        const code = codeInput || this.editor.getValue();

        const options = {
            scanStrings: document.getElementById('scanStrings').checked,
            scanVariables: document.getElementById('scanVariables').checked,
            scanFunctions: document.getElementById('scanFunctions').checked,
            scanComments: document.getElementById('scanComments').checked,
            scanClasses: document.getElementById('scanClasses').checked
        };

        const results = window.codeParser.parseCode(code, options);
        this.processParseResults(results);
        this.updateStatus(`Scanned code: found ${this.getTotalResults(results)} translatable items`);
    }

    processParseResults(results) {
        const engine = window.translationEngine;
        
        // Add strings
        results.strings.forEach(str => {
            engine.addTranslation(str, 'STRING', { en: str });
        });

        // Add variables
        results.variables.forEach(variable => {
            engine.addTranslation(variable, 'VARIABLE', { en: variable });
        });

        // Add functions
        results.functions.forEach(func => {
            engine.addTranslation(func, 'FUNCTION', { en: func });
        });

        // Add comments
        results.comments.forEach(comment => {
            engine.addTranslation(comment, 'COMMENT', { en: comment });
        });

        // Add classes
        results.classes.forEach(cls => {
            engine.addTranslation(cls, 'CLASS', { en: cls });
        });

        this.populateTranslationList();
        this.updateTranslationStats();
    }

    getTotalResults(results) {
        return Object.values(results).reduce((total, arr) => total + arr.length, 0);
    }

    toggleTranslatedView() {
        this.isTranslatedView = !this.isTranslatedView;
        
        const button = document.getElementById('toggleTranslatedView');
        const viewMode = document.querySelector('.view-mode');
        
        if (this.isTranslatedView) {
            const currentCode = this.editor.getValue();
            const translatedCode = window.codeParser.translateCode(
                currentCode, 'en', window.translationEngine.currentLanguage
            );
            this.editor.setValue(translatedCode);
            button.textContent = 'Show Original Code';
            viewMode.textContent = `Translated View (${window.translationEngine.currentLanguage})`;
        } else {
            this.editor.setValue(this.originalCode);
            button.textContent = 'Show Translated Code';
            viewMode.textContent = 'Original View';
        }
    }

    populateTranslationList() {
        const listContainer = document.getElementById('translationList');
        const translations = window.translationEngine.getAllTranslations();
        
        listContainer.innerHTML = '';
        
        translations.forEach(({ key, original, type, translations }) => {
            const item = this.createTranslationItem(key, original, type, translations);
            listContainer.appendChild(item);
        });
    }

    createTranslationItem(key, original, type, translations) {
        const item = document.createElement('div');
        item.className = 'translation-item';
        
        const currentLang = window.translationEngine.currentLanguage;
        const currentTranslation = translations[currentLang] || original;
        
        item.innerHTML = `
            <div>
                <div class="translation-original">${original}</div>
                <span class="translation-type">${type}</span>
            </div>
            <input type="text" class="translation-input" value="${currentTranslation}" 
                   data-key="${key}" data-lang="${currentLang}">
        `;
        
        const input = item.querySelector('.translation-input');
        input.addEventListener('change', (e) => {
            this.updateTranslation(key, currentLang, e.target.value);
        });
        
        return item;
    }

    updateTranslation(key, language, translation) {
        const [type, original] = key.split(':');
        window.translationEngine.updateTranslation(original, type, language, translation);
        this.updateTranslationStats();
    }

    filterTranslations(query, type = 'all') {
        const results = window.translationEngine.searchTranslations(query, type);
        const listContainer = document.getElementById('translationList');
        
        listContainer.innerHTML = '';
        
        results.forEach(({ key, original, type, translations }) => {
            const item = this.createTranslationItem(key, original, type, translations);
            listContainer.appendChild(item);
        });
    }

    generateTranslations() {
        const languages = window.translationEngine.supportedLanguages;
        const files = {};
        
        languages.forEach(lang => {
            const translationFile = window.translationEngine.generateTranslationFile(lang);
            files[`translations_${lang}.json`] = JSON.stringify(translationFile, null, 2);
        });
        
        this.downloadFiles(files);
        this.updateStatus('Translation files generated and downloaded');
    }

    async downloadFiles(files) {
        if (Object.keys(files).length === 1) {
            // Single file download
            const [filename, content] = Object.entries(files)[0];
            this.downloadFile(filename, content);
        } else {
            // Multiple files - create zip
            try {
                const JSZip = (await import('jszip')).default;
                const zip = new JSZip();
                
                Object.entries(files).forEach(([filename, content]) => {
                    zip.file(filename, content);
                });
                
                const blob = await zip.generateAsync({ type: 'blob' });
                this.downloadBlob('translations.zip', blob);
            } catch (error) {
                console.error('Failed to create zip file:', error);
                // Fallback to individual file downloads
                Object.entries(files).forEach(([filename, content]) => {
                    this.downloadFile(filename, content);
                });
            }
        }
    }

    downloadFile(filename, content) {
        const blob = new Blob([content], { type: 'application/json' });
        this.downloadBlob(filename, blob);
    }

    downloadBlob(filename, blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    exportTranslations() {
        const exportData = window.translationEngine.exportTranslations();
        this.downloadFile('all_translations.json', exportData);
        this.updateStatus('All translations exported');
    }

    async importTranslations(file) {
        if (!file) return;
        
        try {
            const content = await this.readFile(file);
            const success = window.translationEngine.importTranslations(content);
            
            if (success) {
                this.populateTranslationList();
                this.updateTranslationStats();
                this.updateStatus('Translations imported successfully');
            } else {
                this.updateStatus('Failed to import translations');
            }
        } catch (error) {
            console.error('Import error:', error);
            this.updateStatus('Error importing translations');
        }
    }

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    runCode(useTranslated) {
        const code = useTranslated ? 
            window.codeParser.translateCode(this.originalCode, 'en', window.translationEngine.currentLanguage) :
            this.originalCode;
        
        const output = document.getElementById('previewOutput');
        output.innerHTML = '';
        
        // Create a custom console for output
        const customConsole = {
            log: (...args) => {
                const div = document.createElement('div');
                div.textContent = args.join(' ');
                div.style.color = '#00ff00';
                output.appendChild(div);
            },
            error: (...args) => {
                const div = document.createElement('div');
                div.textContent = 'ERROR: ' + args.join(' ');
                div.style.color = '#ff0000';
                output.appendChild(div);
            }
        };
        
        try {
            // Execute code in a safe context
            const func = new Function('console', code);
            func(customConsole);
        } catch (error) {
            customConsole.error(error.message);
        }
    }

    updateTranslationStats() {
        const stats = window.translationEngine.getTranslationStats();
        document.getElementById('translationStats').textContent = 
            `${stats.total} translations managed`;
    }

    updateStatus(message) {
        document.getElementById('statusText').textContent = message;
        setTimeout(() => {
            document.getElementById('statusText').textContent = 'Ready';
        }, 3000);
    }

    updateUI() {
        // Update language-dependent UI elements
        this.populateTranslationList();
        
        if (this.isTranslatedView) {
            this.toggleTranslatedView();
            this.toggleTranslatedView(); // Toggle twice to refresh with new language
        }
    }
}

// Global instance
window.uiController = new UIController();

