// Main application initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('Universal Translation Generator initialized');
    
    // Initialize the application
    if (window.uiController) {
        console.log('UI Controller ready');
    }
    
    // Set up global error handling
    window.addEventListener('error', (e) => {
        console.error('Application error:', e.error);
    });
    
    // Set up unhandled promise rejection handling
    window.addEventListener('unhandledrejection', (e) => {
        console.error('Unhandled promise rejection:', e.reason);
    });
});

// Utility functions for the application
window.AppUtils = {
    // Debounce function for search inputs
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Format file size for display
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    // Generate unique IDs
    generateId() {
        return 'id_' + Math.random().toString(36).substr(2, 9);
    },
    
    // Copy text to clipboard
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
            return false;
        }
    }
};

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + S to scan code
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        document.getElementById('scanCode').click();
    }
    
    // Ctrl/Cmd + E to export translations
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        document.getElementById('exportTranslations').click();
    }
    
    // Ctrl/Cmd + T to toggle translated view
    if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        document.getElementById('toggleTranslatedView').click();
    }
});

console.log('Application scripts loaded successfully');

