// Basic math operations
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
    if (b === 0) return "Can't divide by 0!";
    return a / b;
}

function operate(operator, a, b) {
    a = parseFloat(a);
    b = parseFloat(b);
    switch (operator) {
        case '+': return add(a, b);
        case '-': return subtract(a, b);
        case '*': return multiply(a, b);
        case '/': return divide(a, b);
        default: return null;
    }
}

let displayValue = '';
let firstOperand = null;
let operator = null;
let awaitingSecondOperand = false;

const display = document.getElementById('display');

function updateDisplay() {
    display.textContent = displayValue || '0';
}

function handleNumber(number) {
    if (awaitingSecondOperand) {
        displayValue = number;
        awaitingSecondOperand = false;
    } else {
        displayValue += number;
    }
    updateDisplay();
}

function handleOperator(nextOperator) {
    if (operator && awaitingSecondOperand) {
        operator = nextOperator;
        return;
    }

    if (firstOperand == null) {
        firstOperand = parseFloat(displayValue);
    } else if (operator) {
        const result = operate(operator, firstOperand, displayValue);
        displayValue = String(Math.round(result * 1000) / 1000);
        firstOperand = parseFloat(displayValue);
    }

    operator = nextOperator;
    awaitingSecondOperand = true;
    updateDisplay();
}

function handleEquals() {
    if (operator && firstOperand !== null) {
        const result = operate(operator, firstOperand, displayValue);
        displayValue = String(result);
        firstOperand = null;
        operator = null;
        awaitingSecondOperand = false;
        updateDisplay();
    }
}

function clearCalculator() {
    displayValue = '';
    firstOperand = null;
    operator = null;
    awaitingSecondOperand = false;
    updateDisplay();
}

function addDecimal() {
    if (!displayValue.includes('.')) {
        displayValue += '.';
        updateDisplay();
    }
}

function backspace() {
    displayValue = displayValue.slice(0, -1);
    updateDisplay();
}

document.querySelectorAll('.number').forEach(button =>
    button.addEventListener('click', () => handleNumber(button.textContent))
);

document.querySelectorAll('.operator').forEach(button =>
    button.addEventListener('click', () => handleOperator(button.textContent))
);

document.getElementById('equals').addEventListener('click', handleEquals);
document.getElementById('clear').addEventListener('click', clearCalculator);
document.getElementById('backspace').addEventListener('click', backspace);
document.querySelector('.decimal').addEventListener('click', addDecimal);

document.addEventListener('keydown', (e) => {
    if (!isNaN(e.key)) {
        handleNumber(e.key);
    } else if (['+', '-', '*', '/'].includes(e.key)) {
        handleOperator(e.key);
    } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEquals();
    } else if (e.key === '.') {
        addDecimal();
    } else if (e.key === 'Backspace') {
        backspace();
    } else if (e.key.toLowerCase() === 'c') {
        clearCalculator();
    }
});