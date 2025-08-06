// Basic math operations functions

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
    const result = a / b;
    if (result === Infinity || result === -Infinity) {
        display.textContent = "∞";
    }
    return result;
}

// Math operation switch-handler

function operate(a, operator, b) {
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

// Global variables and initial setup

let displayValue = '';
let firstOperand = null;
let operator = null;
let awaitingSecondOperand = false;

const display = document.getElementById('display');

function updateDisplay() {
    display.textContent = displayValue || '0';
}

// Handle number input from .number buttons and keyboard input

function handleNumber(number) {
    if (awaitingSecondOperand) {
        displayValue = number;
        awaitingSecondOperand = false;
    } else {
        displayValue += number;
    }
    updateDisplay();
}

// Handle operator and intermediary steps in calculation chains (eg. 1+1 = 2, then new function call for 2*2 = 4)

function handleOperator(nextOperator) {
    if (operator && awaitingSecondOperand) { // if an operator is already set, return early to avoid double operators eg. "+ -"
        operator = nextOperator;
        return;
    }

    if (firstOperand == null) { // if no firstOperand stored, assign displayValue to firstOperand variable
        firstOperand = parseFloat(displayValue);

    } else if (operator) {
        const result = operate(firstOperand, operator, displayValue);
        displayValue = String(Math.round(result * 1000) / 1000); // To prevent floating point errors based on binary data
        firstOperand = parseFloat(displayValue);
    }

    operator = nextOperator;
    awaitingSecondOperand = true;
    updateDisplay();
}

// Finalize current calculation with operate function and reset global setup variables

function handleEquals() {
    if (operator && firstOperand !== null) {

        const result = operate(firstOperand, operator, displayValue);

        displayValue = String(result);
        firstOperand = null;
        operator = null;
        awaitingSecondOperand = false;
        updateDisplay();
    }
}

// Adding handleNumber and handleOperator functions to dom buttons

document.querySelectorAll('.number').forEach(button =>
    button.addEventListener('click', () => handleNumber(button.textContent))
);

document.querySelectorAll('.operator').forEach(button =>
    button.addEventListener('click', () => handleOperator(button.textContent))
);

// Inline event listener function for equals button

document.getElementById('equals').addEventListener('click', () => {
    if (operator && firstOperand !== null) {
        const result = operate(firstOperand, operator, displayValue);
        displayValue = String(result);
        firstOperand = null;
        operator = null;
        awaitingSecondOperand = false;
        updateDisplay();
    }
});

// Inline event listener function for clear button

document.getElementById('clear').addEventListener('click', () => {
    displayValue = '';
    firstOperand = null;
    operator = null;
    awaitingSecondOperand = false;
    updateDisplay();
});

// Inline event listener function for backspace button

document.getElementById('backspace').addEventListener('click', () => {
    displayValue = displayValue.slice(0, -1);
    updateDisplay();
});

// Inline event listener function for decimal button. Prevent adding multiple decimals in a number

document.querySelector('.decimal').addEventListener('click', () => {
    if (!displayValue.includes('.')) {
        displayValue += '.';
        updateDisplay();
    }
});

// Keyboard event listener for calculator operations
// Allows the calculator to be used with keyboard input as well
// Listens for keydown events and calls the respective functions

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
