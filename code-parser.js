class CodeParser {
    constructor() {
        this.stringPatterns = [
            // JavaScript strings
            /"([^"\\]|\\.)*"/g,
            /'([^'\\]|\\.)*'/g,
            /`([^`\\]|\\.)*`/g,
        ];
        
        this.variablePatterns = [
            // Variable declarations
            /(?:var|let|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
            // Function parameters
            /function\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(([^)]*)\)/g,
            // Object properties
            /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g,
        ];
        
        this.functionPatterns = [
            // Function declarations
            /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
            // Arrow functions with names
            /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:\([^)]*\)|\w+)\s*=>/g,
            // Method definitions
            /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*\{/g,
        ];
        
        this.commentPatterns = [
            // Single line comments
            /\/\/(.*)$/gm,
            // Multi line comments
            /\/\*([\s\S]*?)\*\//g,
        ];
        
        this.classPatterns = [
            // Class declarations
            /class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
        ];
    }

    parseCode(code, options = {}) {
        const results = {
            strings: [],
            variables: [],
            functions: [],
            comments: [],
            classes: []
        };

        if (options.scanStrings !== false) {
            results.strings = this.extractStrings(code);
        }
        
        if (options.scanVariables !== false) {
            results.variables = this.extractVariables(code);
        }
        
        if (options.scanFunctions !== false) {
            results.functions = this.extractFunctions(code);
        }
        
        if (options.scanComments !== false) {
            results.comments = this.extractComments(code);
        }
        
        if (options.scanClasses !== false) {
            results.classes = this.extractClasses(code);
        }

        return results;
    }

    extractStrings(code) {
        const strings = new Set();
        
        this.stringPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(code)) !== null) {
                const str = match[0];
                // Remove quotes and process escape sequences
                const content = str.slice(1, -1)
                    .replace(/\\"/g, '"')
                    .replace(/\\'/g, "'")
                    .replace(/\\\\/g, "\\");
                
                if (content.trim().length > 0 && !this.isCodeLike(content)) {
                    strings.add(content);
                }
            }
        });
        
        return Array.from(strings);
    }

    extractVariables(code) {
        const variables = new Set();
        
        this.variablePatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(code)) !== null) {
                if (match[1]) {
                    // Handle multiple variable declarations
                    const varNames = match[1].split(',').map(v => 
                        v.trim().replace(/\s*=.*$/, '')
                    );
                    varNames.forEach(name => {
                        if (this.isValidIdentifier(name)) {
                            variables.add(name);
                        }
                    });
                }
            }
        });
        
        return Array.from(variables);
    }

    extractFunctions(code) {
        const functions = new Set();
        
        this.functionPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(code)) !== null) {
                if (match[1] && this.isValidIdentifier(match[1])) {
                    functions.add(match[1]);
                }
            }
        });
        
        return Array.from(functions);
    }

    extractComments(code) {
        const comments = new Set();
        
        this.commentPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(code)) !== null) {
                const comment = match[1].trim();
                if (comment.length > 0 && !this.isCodeComment(comment)) {
                    comments.add(comment);
                }
            }
        });
        
        return Array.from(comments);
    }

    extractClasses(code) {
        const classes = new Set();
        
        this.classPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(code)) !== null) {
                if (match[1] && this.isValidIdentifier(match[1])) {
                    classes.add(match[1]);
                }
            }
        });
        
        return Array.from(classes);
    }

    isValidIdentifier(name) {
        return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name) && 
               !this.isReservedWord(name) &&
               name.length > 1;
    }

    isReservedWord(word) {
        const reserved = [
            'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
            'default', 'delete', 'do', 'else', 'export', 'extends', 'finally',
            'for', 'function', 'if', 'import', 'in', 'instanceof', 'new',
            'return', 'static', 'super', 'switch', 'this', 'throw', 'try',
            'typeof', 'var', 'void', 'while', 'with', 'yield', 'let'
        ];
        return reserved.includes(word.toLowerCase());
    }

    isCodeLike(str) {
        // Check if string looks like code rather than translatable text
        const codeIndicators = [
            /^[a-zA-Z_$][a-zA-Z0-9_$]*$/, // Simple identifier
            /^[0-9]+$/, // Just numbers
            /^[{}[\]().,;]+$/, // Just punctuation
            /^[\w\s]*\([^)]*\)/, // Function call pattern
            /^[a-zA-Z_$][a-zA-Z0-9_$.]*$/, // Property access pattern
        ];
        
        return codeIndicators.some(pattern => pattern.test(str));
    }

    isCodeComment(comment) {
        // Check if comment is likely code-related rather than translatable
        const codeCommentPatterns = [
            /TODO|FIXME|HACK|NOTE/i,
            /^\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*$/, // Single identifier
            /^\s*[{}[\]().,;]+\s*$/, // Just punctuation
        ];
        
        return codeCommentPatterns.some(pattern => pattern.test(comment));
    }

    translateCode(code, fromLanguage = 'en', toLanguage) {
        let translatedCode = code;
        const engine = window.translationEngine;
        
        // Replace strings
        this.stringPatterns.forEach(pattern => {
            translatedCode = translatedCode.replace(pattern, (match) => {
                const content = match.slice(1, -1);
                const translation = engine.getTranslation(content, 'STRING', toLanguage);
                return match.charAt(0) + translation + match.charAt(0);
            });
        });
        
        // Replace variable names
        const variables = this.extractVariables(code);
        variables.forEach(variable => {
            const translation = engine.getTranslation(variable, 'VARIABLE', toLanguage);
            if (translation !== variable) {
                const regex = new RegExp(`\\b${variable}\\b`, 'g');
                translatedCode = translatedCode.replace(regex, translation);
            }
        });
        
        // Replace function names
        const functions = this.extractFunctions(code);
        functions.forEach(func => {
            const translation = engine.getTranslation(func, 'FUNCTION', toLanguage);
            if (translation !== func) {
                const regex = new RegExp(`\\b${func}\\b`, 'g');
                translatedCode = translatedCode.replace(regex, translation);
            }
        });
        
        // Replace class names
        const classes = this.extractClasses(code);
        classes.forEach(cls => {
            const translation = engine.getTranslation(cls, 'CLASS', toLanguage);
            if (translation !== cls) {
                const regex = new RegExp(`\\b${cls}\\b`, 'g');
                translatedCode = translatedCode.replace(regex, translation);
            }
        });
        
        return translatedCode;
    }
}

// Global instance
window.codeParser = new CodeParser();

