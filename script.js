// Ultimate Calculator Pro - Professional Grade Implementation

// Core math operations (keeping Robin's original functions)
function add(a, b) {
    return a + b;
}

function subtract(a, b) {
    return a - b;
}

function multiply(a, b) {
    return a * b;
}

function divide(a, b) {
    return a / b; // Let JS handle Infinity and NaN cases
}

function operate(a, operator, b) {
    a = parseFloat(a);
    b = parseFloat(b);
    switch (operator) {
        case '+': return add(a, b);
        case '-': return subtract(a, b);
        case '*': return multiply(a, b);
        case '/': return divide(a, b);
        case '^': return Math.pow(a, b);
        default: return null;
    }
}

// ---- numeric helpers
function roundTo(num, places = 12) {
    if (!isFinite(num)) return num;
    const factor = Math.pow(10, places);
    return Math.round(num * factor) / factor;
}

function prettify(num) {
    if (num === null || num === undefined) return '0';

    // Handle special numeric cases first
    if (num === Infinity) return '∞';
    if (num === -Infinity) return '-∞';
    if (isNaN(num)) return 'NaN';

    const n = Number(num);
    const abs = Math.abs(n);

    // Use scientific notation for very large/small numbers
    if (abs >= 1e15 || (abs !== 0 && abs < 1e-6)) {
        return n.toExponential(6);
    }

    // Round and strip trailing zeros
    let s = roundTo(n, 12).toFixed(12);
    return s.replace(/\.?0+$/, '');
}

// Enhanced calculator state
let calculatorState = {
    displayValue: '0',
    firstOperand: null,
    operator: null,
    awaitingOperand: false,
    isScientificMode: false,
    theme: 'system',
    history: [],
    angleMode: 'deg', // 'deg' or 'rad'
    pendingFunction: null, // For functions waiting for input
    powerMode: false // For x^y operations
};

// DOM elements
const display = document.getElementById('display');
const expressionDisplay = document.getElementById('expression');
const statusText = document.querySelector('.status-text');
const statusIndicator = document.querySelector('.status-indicator');
const historyList = document.getElementById('history');

// Initialize calculator
document.addEventListener('DOMContentLoaded', function () {
    initializeCalculator();
    setupEventListeners();
    loadSettings();
    updateDisplay();
    updateHistoryDisplay();
    console.log('🧮 Ultimate Calculator Pro initialized!');
});

function initializeCalculator() {
    // Set initial theme based on system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('calculator-theme') || 'system';
    setTheme(savedTheme);

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (calculatorState.theme === 'system') {
            setTheme('system'); // Re-apply system theme to update
        }
    });

    setStatus('ready', 'Ready');
}

function setupEventListeners() {
    // Theme toggle buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            setTheme(theme);
        });
    });

    // Mode toggle buttons
    document.getElementById('basicModeBtn').addEventListener('click', () => {
        setCalculatorMode('basic');
    });

    document.getElementById('scientificModeBtn').addEventListener('click', () => {
        setCalculatorMode('scientific');
    });

    // Keyboard support
    document.addEventListener('keydown', handleKeyboard);

    // Add click animations to all buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn')) {
            addButtonFeedback(e.target);
        }
    });

    // Prevent zoom on double tap for mobile
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function (event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
}

// Theme Management
function setTheme(theme) {
    calculatorState.theme = theme;

    let actualTheme = theme;

    // If system theme is selected, detect the actual system preference
    if (theme === 'system') {
        actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    document.body.setAttribute('data-theme', actualTheme);

    // Update active theme button
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.theme === theme) {
            btn.classList.add('active');
        }
    });

    // Save preference
    localStorage.setItem('calculator-theme', theme);
    setStatus('theme-changed', `${theme.charAt(0).toUpperCase() + theme.slice(1)} theme`);
    setTimeout(() => setStatus('ready', 'Ready'), 1500);
}

// Calculator Mode Management
function setCalculatorMode(mode) {
    calculatorState.isScientificMode = mode === 'scientific';

    // Update mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const scientificPanel = document.getElementById('scientific-functions');

    if (mode === 'scientific') {
        document.getElementById('scientificModeBtn').classList.add('active');
        scientificPanel.style.display = 'block';
        // Add show class with delay for animation
        setTimeout(() => {
            scientificPanel.classList.add('show');
        }, 50);
        // Basic buttons stay visible in scientific mode
        document.getElementById('basic-buttons').style.display = 'grid';
    } else {
        document.getElementById('basicModeBtn').classList.add('active');
        scientificPanel.classList.remove('show');
        setTimeout(() => {
            scientificPanel.style.display = 'none';
        }, 300);
        document.getElementById('basic-buttons').style.display = 'grid';
    }

    setStatus('mode-changed', `${mode.charAt(0).toUpperCase() + mode.slice(1)} mode`);
    setTimeout(() => setStatus('ready', 'Ready'), 1500);
}

// Display Management
function updateDisplay() {
    display.textContent = formatNumber(calculatorState.displayValue);
    updateExpressionDisplay();
    display.scrollLeft = display.scrollWidth;
}

function updateExpressionDisplay() {
    if (calculatorState.firstOperand !== null && calculatorState.operator) {
        const operator = getOperatorSymbol(calculatorState.operator);
        if (calculatorState.awaitingOperand) {
            expressionDisplay.textContent = `${formatNumber(calculatorState.firstOperand)} ${operator}`;
        } else {
            expressionDisplay.textContent = `${formatNumber(calculatorState.firstOperand)} ${operator} ${formatNumber(calculatorState.displayValue)}`;
        }
    } else {
        expressionDisplay.textContent = formatNumber(calculatorState.displayValue);
    }
}

function formatNumber(num) {
    return prettify(num);
}

function getOperatorSymbol(op) {
    const symbols = { '+': '+', '-': '−', '*': '×', '/': '÷', '^': '^' };
    return symbols[op] || op;
}

// Input Handlers - Enhanced with animations

function handleOperator(nextOperator) {
    const inputValue = parseFloat(calculatorState.displayValue);
    setStatus('processing', 'Processing...');

    // ✅ If user is switching operators before entering the next number,
    // just replace the operator and update the expression display.
    if (calculatorState.awaitingOperand && calculatorState.firstOperand !== null) {
        calculatorState.operator = nextOperator;
        updateExpressionDisplay();
        setTimeout(() => setStatus('ready', 'Ready'), 300);
        return;
    }

    if (calculatorState.firstOperand === null) {
        calculatorState.firstOperand = inputValue;
    } else if (calculatorState.operator) {
        const currentValue = calculatorState.firstOperand || 0;
        const newValue = roundTo(operate(currentValue, calculatorState.operator, inputValue));

        calculatorState.displayValue = String(newValue);
        calculatorState.firstOperand = newValue;

        addToHistory(
            `${formatNumber(currentValue)} ${getOperatorSymbol(calculatorState.operator)} ` +
            `${formatNumber(inputValue)} = ${formatNumber(newValue)}`
        );
    }

    calculatorState.awaitingOperand = true;
    calculatorState.operator = nextOperator;

    updateDisplay();
    setTimeout(() => setStatus('ready', 'Ready'), 500);
}

function handleEquals() {
    const inputValue = parseFloat(calculatorState.displayValue);

    if (calculatorState.firstOperand !== null && calculatorState.operator) {
        const newValue = roundTo(operate(calculatorState.firstOperand, calculatorState.operator, inputValue));

        // Add to history
        addToHistory(`${formatNumber(calculatorState.firstOperand)} ${getOperatorSymbol(calculatorState.operator)} ${formatNumber(inputValue)} = ${formatNumber(newValue)}`);

        calculatorState.displayValue = String(newValue);
        calculatorState.firstOperand = null;
        calculatorState.operator = null;
        calculatorState.awaitingOperand = true;

        updateDisplay();
        setStatus('calculated', 'Calculated');
        setTimeout(() => setStatus('ready', 'Ready'), 1500);
    }
}

function addDecimal() {
    if (calculatorState.awaitingOperand) {
        calculatorState.displayValue = '0.';
        calculatorState.awaitingOperand = false;
    } else if (calculatorState.displayValue.indexOf('.') === -1) {
        calculatorState.displayValue += '.';
    }

    updateDisplay();
}

function clearAll() {
    calculatorState.displayValue = '0';
    calculatorState.firstOperand = null;
    calculatorState.operator = null;
    calculatorState.awaitingOperand = false;

    updateDisplay();
    setStatus('cleared', 'Cleared');
    setTimeout(() => setStatus('ready', 'Ready'), 1000);
}

function clearEntry() {
    calculatorState.displayValue = '0';
    updateDisplay();
    setStatus('entry-cleared', 'Entry cleared');
    setTimeout(() => setStatus('ready', 'Ready'), 1000);
}

function backspace() {
    if (calculatorState.displayValue.length > 1) {
        calculatorState.displayValue = calculatorState.displayValue.slice(0, -1);
    } else {
        calculatorState.displayValue = '0';
    }
    updateDisplay();
}

// Scientific Functions - Professional Calculator Behavior
function scientificFunction(func) {
    // Prevent execution if display is 0 and not awaiting operand (fresh start)
    if (calculatorState.displayValue === '0' && !calculatorState.awaitingOperand) {
        setStatus('error', 'Enter a number first!');
        setTimeout(() => setStatus('ready', 'Ready'), 2000);
        return;
    }

    const value = parseFloat(calculatorState.displayValue);
    let result;

    // Check for invalid input
    if (isNaN(value)) {
        setStatus('error', 'Invalid input!');
        setTimeout(() => setStatus('ready', 'Ready'), 2000);
        return;
    }

    setStatus('calculating', 'Computing...');

    // Handle special cases that require two operands
    if (func === 'powY') {
        calculatorState.powerMode = true;
        calculatorState.firstOperand = value;
        calculatorState.operator = '^';
        calculatorState.awaitingOperand = true;
        updateExpressionDisplay();
        setStatus('ready', 'Enter exponent...');
        return;
    }

    // Validate input for functions that have domain restrictions
    if (!validateInput(func, value)) {
        return;
    }

    // Convert angle units for trig functions
    const angleValue = (func.includes('sin') || func.includes('cos') || func.includes('tan')) && !func.startsWith('a')
        ? (calculatorState.angleMode === 'deg' ? value * Math.PI / 180 : value)
        : value;

    switch (func) {
        case 'sin':
            result = Math.sin(angleValue);
            break;
        case 'cos':
            result = Math.cos(angleValue);
            break;
        case 'tan':
            result = Math.tan(angleValue);
            break;
        case 'asin':
            result = Math.asin(value);
            result = calculatorState.angleMode === 'deg' ? result * 180 / Math.PI : result;
            break;
        case 'acos':
            result = Math.acos(value);
            result = calculatorState.angleMode === 'deg' ? result * 180 / Math.PI : result;
            break;
        case 'atan':
            result = Math.atan(value);
            result = calculatorState.angleMode === 'deg' ? result * 180 / Math.PI : result;
            break;
        case 'log':
            result = Math.log10(value);
            break;
        case 'ln':
            result = Math.log(value);
            break;
        case 'sqrt':
            result = Math.sqrt(value);
            break;
        case 'pow':
            result = Math.pow(value, 2);
            break;
        case 'cube':
            result = Math.pow(value, 3);
            break;
        case 'factorial':
            result = factorial(value);
            break;
        case 'inverse':
            result = 1 / value;
            break;
        case 'percent':
            result = value / 100;
            break;
        case 'exp':
            result = Math.exp(value);
            break;
        case 'abs':
            result = Math.abs(value);
            break;
        default:
            return;
    }

    result = roundTo(result);

    // Format the function name for history
    const funcDisplay = {
        'sin': 'sin', 'cos': 'cos', 'tan': 'tan',
        'asin': 'sin⁻¹', 'acos': 'cos⁻¹', 'atan': 'tan⁻¹',
        'log': 'log', 'ln': 'ln', 'sqrt': '√',
        'pow': 'x²', 'cube': 'x³', 'factorial': '!',
        'inverse': '1/x', 'percent': '%', 'exp': 'eˣ', 'abs': '|x|'
    };

    const displayFunc = funcDisplay[func] || func;
    const angleUnit = (func.includes('sin') || func.includes('cos') || func.includes('tan'))
        ? ` (${calculatorState.angleMode.toUpperCase()})` : '';

    addToHistory(`${displayFunc}(${formatNumber(value)})${angleUnit} = ${formatNumber(result)}`);

    calculatorState.displayValue = String(result);
    calculatorState.awaitingOperand = true;

    updateDisplay();
    setTimeout(() => setStatus('ready', 'Ready'), 500);
}

function factorial(n) {
    if (n < 0 || n !== Math.floor(n)) return NaN;
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

// Input validation for scientific functions
function validateInput(func, value) {
    switch (func) {
        case 'sqrt':
            if (value < 0) {
                showError("Cannot take square root of negative number");
                return false;
            }
            break;
        case 'log':
            if (value <= 0) {
                showError("Log requires positive number");
                return false;
            }
            break;
        case 'ln':
            if (value <= 0) {
                showError("Natural log requires positive number");
                return false;
            }
            break;
        case 'asin':
        case 'acos':
            if (value < -1 || value > 1) {
                showError("Input must be between -1 and 1");
                return false;
            }
            break;
        case 'inverse':
            if (value === 0) {
                showError("Cannot divide by zero");
                return false;
            }
            break;
        case 'factorial':
            if (value < 0 || value !== Math.floor(value) || value > 170) {
                showError("Factorial requires non-negative integer ≤ 170");
                return false;
            }
            break;
    }
    return true;
}

// Angle mode toggle
function toggleAngleMode() {
    calculatorState.angleMode = calculatorState.angleMode === 'deg' ? 'rad' : 'deg';
    const modeBtn = document.getElementById('angleMode');
    const modeDisplay = document.getElementById('angleModeDisplay');

    if (modeBtn) {
        modeBtn.textContent = calculatorState.angleMode.toUpperCase();
    }
    if (modeDisplay) {
        modeDisplay.textContent = calculatorState.angleMode.toUpperCase();
    }

    setStatus('angle-mode', `${calculatorState.angleMode.toUpperCase()} mode`);
    setTimeout(() => setStatus('ready', 'Ready'), 1500);
}

function addConstant(constant) {
    const constants = {
        'pi': Math.PI,
        'e': Math.E
    };

    if (constants[constant]) {
        calculatorState.displayValue = String(constants[constant]);
        calculatorState.awaitingOperand = true;
        updateDisplay();

        addToHistory(`${constant} = ${formatNumber(constants[constant])}`);
        setStatus('constant-added', `${constant.toUpperCase()} added`);
        setTimeout(() => setStatus('ready', 'Ready'), 1000);
    }
}

// History Management
function addToHistory(calculation) {
    calculatorState.history.unshift({
        calculation,
        timestamp: new Date().toLocaleTimeString(),
        id: Date.now()
    });

    // Keep only last 50 calculations
    if (calculatorState.history.length > 50) {
        calculatorState.history = calculatorState.history.slice(0, 50);
    }

    updateHistoryDisplay();
    saveSettings();
}

function updateHistoryDisplay() {
    if (!historyList) return;

    if (calculatorState.history.length === 0) {
        historyList.innerHTML = '<div class="empty-state">No calculations yet</div>';
    } else {
        historyList.innerHTML = calculatorState.history
            .map(item => `
                <div class="history-item" onclick="useFromHistory('${item.calculation}')" title="Click to use result">
                    <div class="calculation">${item.calculation}</div>
                    <div class="timestamp" style="font-size: 0.7rem; opacity: 0.7; margin-top: 0.25rem;">${item.timestamp}</div>
                </div>
            `).join('');
    }
}

function useFromHistory(calculation) {
    const result = calculation.split(' = ')[1];
    if (result) {
        calculatorState.displayValue = result;
        calculatorState.awaitingOperand = true;
        updateDisplay();
        setStatus('history-used', 'Used from history');
        setTimeout(() => setStatus('ready', 'Ready'), 1500);
    }
}

function clearHistory() {
    calculatorState.history = [];
    updateHistoryDisplay();
    saveSettings();
    setStatus('history-cleared', 'History cleared');
    setTimeout(() => setStatus('ready', 'Ready'), 1500);
}

// Utility Functions
function copyResult() {
    const result = calculatorState.displayValue;
    navigator.clipboard.writeText(result).then(() => {
        setStatus('copied', 'Copied to clipboard');
        setTimeout(() => setStatus('ready', 'Ready'), 1500);
    }).catch(() => {
        setStatus('error', 'Copy failed');
        setTimeout(() => setStatus('ready', 'Ready'), 1500);
    });
}

function setStatus(type, message) {
    if (statusText) statusText.textContent = message;
    if (statusIndicator) {
        const colors = {
            'ready': '#10b981',
            'calculating': '#3b82f6',
            'processing': '#8b5cf6',
            'cleared': '#f59e0b',
            'error': '#ef4444',
            'copied': '#10b981',
            'theme-changed': '#8b5cf6',
            'mode-changed': '#3b82f6'
        };
        statusIndicator.style.background = colors[type] || colors.ready;
    }
}

function showError(message) {
    display.textContent = message;
    setStatus('error', 'Error');
    setTimeout(() => {
        calculatorState.displayValue = '0';
        updateDisplay();
        setStatus('ready', 'Ready');
    }, 2000);
}

// Keyboard Support
function handleKeyboard(event) {
    const key = event.key.toLowerCase();

    // If tutorial is open, let ESC close it and stop further handling
    const tutorial = document.getElementById('tutorial-modal');
    const tutorialOpen = tutorial && tutorial.classList.contains('show');
    if (tutorialOpen && key === 'escape') {
        event.preventDefault();
        closeTutorial();
        return;
    }

    // Prevent default behavior for calculator keys (and 't' to avoid page find on some setups)
    if (/[0-9+\-*/.=]/.test(key) || key === 'enter' || key === 'escape' || key === 'backspace' || key === 't') {
        event.preventDefault();
    }

    if (/\d/.test(key)) {
        handleNumber(key);
    } else if (['+', '-', '*', '/'].includes(key)) {
        handleOperator(key);
    } else if (key === 'enter' || key === '=') {
        handleEquals();
    } else if (key === '.') {
        addDecimal();
    } else if (key === 'backspace') {
        backspace();
    } else if (key === 'escape' || key === 'c') {
        clearAll();
    } else if (key === 'delete') {
        clearEntry();
    } else if (key === 't') {
        // Toggle tutorial with 't'
        if (tutorialOpen) {
            closeTutorial();
        } else {
            showTutorial();
        }
    }
}

// Settings Management
function saveSettings() {
    const settings = {
        theme: calculatorState.theme,
        history: calculatorState.history,
        isScientificMode: calculatorState.isScientificMode
    };
    localStorage.setItem('calculator-settings', JSON.stringify(settings));
}

function loadSettings() {
    const saved = localStorage.getItem('calculator-settings');
    if (saved) {
        const settings = JSON.parse(saved);
        calculatorState.history = settings.history || [];
        if (settings.isScientificMode) {
            setCalculatorMode('scientific');
        }
    }
}

// Tutorial Functions
function showTutorial() {
    const modal = document.getElementById('tutorial-modal');
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
    }
}

function closeTutorial() {
    const modal = document.getElementById('tutorial-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.style.display = 'none', 300);
    }
}

function runExample(calculation) {
    closeTutorial();
    const parts = calculation.split(' ');
    if (parts.length >= 3) {
        calculatorState.displayValue = parts[0];
        updateDisplay();

        setTimeout(() => {
            if (parts[1]) handleOperator(parts[1]);
            setTimeout(() => {
                if (parts[2]) handleNumber(parts[2]);
                setTimeout(() => handleEquals(), 300);
            }, 300);
        }, 300);
    }
}

// Initialize button animations for touch feedback
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('touchstart', function () {
            this.style.transform = 'scale(0.95)';
        });

        btn.addEventListener('touchend', function () {
            this.style.transform = '';
        });
    });
});

// Performance optimization: Debounce rapid calculations
let calculationTimeout;
function debounceCalculation(fn, delay = 100) {
    clearTimeout(calculationTimeout);
    calculationTimeout = setTimeout(fn, delay);
}

// Error boundary for production
window.addEventListener('error', function (event) {
    console.error('Calculator error:', event.error);
    setStatus('error', 'Something went wrong');
    setTimeout(() => {
        clearAll();
        setStatus('ready', 'Ready');
    }, 2000);
});

// Premium button feedback system
function addButtonFeedback(button) {
    if (!button) return;

    // Add pressed class for visual feedback
    button.classList.add('pressed');

    // Create ripple effect
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');

    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (event?.clientX - rect.left - size / 2) + 'px' || '50%';
    ripple.style.top = (event?.clientY - rect.top - size / 2) + 'px' || '50%';

    button.appendChild(ripple);

    // Remove ripple after animation
    setTimeout(() => {
        ripple.remove();
        button.classList.remove('pressed');
    }, 600);
}

// Enhanced number input with animation
function handleNumber(number) {
    setStatus('calculating', 'Entering number...');

    if (calculatorState.awaitingOperand) {
        calculatorState.displayValue = number;
        calculatorState.awaitingOperand = false;
    } else {
        calculatorState.displayValue = calculatorState.displayValue === '0' ? number : calculatorState.displayValue + number;
    }

    updateDisplay();

    // Add subtle animation to display
    display.style.transform = 'scale(1.02)';
    setTimeout(() => {
        display.style.transform = 'scale(1)';
    }, 150);

    setTimeout(() => setStatus('ready', 'Ready'), 300);
}

// Add CSS for pressed state and ripple effect
const style = document.createElement('style');
style.textContent = `
    .btn.pressed {
        transform: scale(0.95) !important;
    }
    
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        pointer-events: none;
        animation: ripple-animation 0.6s linear;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(2);
            opacity: 0;
        }
    }
    
    #display {
        transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .history-item {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        transform: translateX(0);
    }
    
    .history-item:hover {
        transform: translateX(8px) scale(1.02);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
`;
document.head.appendChild(style);

console.log('🧮 Ultimate Calculator Pro fully loaded and ready!');
console.log('Features: Theme switching, Scientific mode, History, Keyboard support, Touch optimization');
console.log('✨ Premium animations and micro-interactions enabled!');
console.log('Try pressing T for tutorial, or use keyboard shortcuts!');