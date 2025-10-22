class Calculator {
    constructor() {
        this.display = document.getElementById('display');
        this.history = document.getElementById('history');
        this.historyList = document.getElementById('history-list');
        this.currentInput = '0';
        this.previousInput = '';
        this.operator = '';
        this.shouldResetDisplay = false;
        this.lastResult = null;
        this.entries = [];
        this.memoryValue = 0;
        this.memoryDisplay = document.getElementById('memory-display');
        this.renderHistory();
    }

    updateDisplay() {
        // Keep base Tailwind classes and only toggle size modifiers
        this.display.classList.remove('text-3xl', 'sm:text-4xl', 'text-2xl', 'sm:text-3xl');
        if (this.currentInput.length > 12) {
            this.display.classList.add('text-2xl', 'sm:text-3xl');
        } else {
            this.display.classList.add('text-3xl', 'sm:text-4xl');
        }
        this.display.textContent = this.currentInput;
    }

    updateHistory() {
        if (this.previousInput && this.operator) {
            this.history.textContent = `${this.previousInput} ${this.getOperatorSymbol()} `;
        } else {
            this.history.textContent = '';
        }
    }

    getOperatorSymbol() {
        const symbols = {
            '+': '+',
            '-': '−',
            '*': '×',
            '/': '÷'
        };
        return symbols[this.operator] || this.operator;
    }

    clearAll() {
        this.currentInput = '0';
        this.previousInput = '';
        this.operator = '';
        this.shouldResetDisplay = false;
        this.lastResult = null;
        this.updateDisplay();
        this.updateHistory();
    }

    clearEntry() {
        this.currentInput = '0';
        this.updateDisplay();
    }

    backspace() {
        if (this.currentInput.length > 1) {
            this.currentInput = this.currentInput.slice(0, -1);
        } else {
            this.currentInput = '0';
        }
        this.updateDisplay();
    }

    inputNumber(num) {
        if (this.shouldResetDisplay) {
            this.currentInput = num;
            this.shouldResetDisplay = false;
        } else {
            if (this.currentInput === '0') {
                this.currentInput = num;
            } else {
                this.currentInput += num;
            }
        }
        this.updateDisplay();
    }

    inputDecimal() {
        if (this.shouldResetDisplay) {
            this.currentInput = '0.';
            this.shouldResetDisplay = false;
        } else if (!this.currentInput.includes('.')) {
            this.currentInput += '.';
        }
        this.updateDisplay();
    }

    inputOperator(op) {
        if (this.operator && !this.shouldResetDisplay) {
            this.calculate();
        }
        this.operator = op;
        this.previousInput = this.currentInput;
        this.shouldResetDisplay = true;
        this.updateHistory();
    }

    inputFunction(func) {
        const num = parseFloat(this.currentInput);
        let result;

        switch (func) {
            case 'sqrt':
                if (num < 0) {
                    this.showError('Invalid input');
                    return;
                }
                result = Math.sqrt(num);
                break;
            case 'pow':
                result = Math.pow(num, 2);
                break;
            case 'percent':
                result = num / 100;
                break;
            case 'invert':
                if (num === 0) {
                    this.showError('Cannot divide by zero');
                    return;
                }
                result = 1 / num;
                break;
            case 'sign':
                result = -num;
                break;
        }

        this.currentInput = this.formatResult(result);
        this.shouldResetDisplay = true;
        this.updateDisplay();
        this.addHistoryEntry({ type: 'func', func, input: num, result: this.currentInput });
    }

    calculate() {
        // If no operator, treat as identity operation (number = number)
        if (!this.operator || !this.previousInput) {
            if (this.currentInput && this.currentInput !== '0') {
                const current = parseFloat(this.currentInput);
                this.addHistoryEntry({ type: 'nonfunc', input: current, result: this.currentInput });
            }
            return;
        }

        const prev = parseFloat(this.previousInput);
        const current = parseFloat(this.currentInput);
        const operatorSymbol = this.getOperatorSymbol();
        let result;

        switch (this.operator) {
            case '+':
                result = prev + current;
                break;
            case '-':
                result = prev - current;
                break;
            case '*':
                result = prev * current;
                break;
            case '/':
                if (current === 0) {
                    this.showError('Cannot divide by zero');
                    return;
                }
                result = prev / current;
                break;
            default:
                return;
        }

        this.currentInput = this.formatResult(result);
        this.previousInput = '';
        this.operator = '';
        this.shouldResetDisplay = true;
        this.lastResult = result;
        this.updateDisplay();
        this.updateHistory();
        // Add to history for valid operation with two operands
        this.addHistoryEntry({ type: 'op', prev, operator: operatorSymbol, current, result: this.currentInput });
    }

    formatResult(num) {
        if (isNaN(num) || !isFinite(num)) {
            return 'Error';
        }

        // Handle very large or very small numbers
        if (Math.abs(num) > 999999999999 || (Math.abs(num) < 0.000001 && num !== 0)) {
            return num.toExponential(6);
        }

        // Round to avoid floating point precision issues
        const rounded = Math.round(num * 100000000) / 100000000;
        
        // Remove trailing zeros
        return rounded.toString();
    }

    showError(message) {
        this.currentInput = 'Error';
        this.shouldResetDisplay = true;
        this.updateDisplay();
        this.history.textContent = message;
        setTimeout(() => {
            this.clearAll();
        }, 2000);
    }

    addHistoryEntry(entry) {
        this.entries.unshift(entry);
        if (this.entries.length > 100) this.entries.pop();
        this.renderHistory();
    }

    renderHistory() {
        if (!this.historyList) return;
        if (this.entries.length === 0) {
            this.historyList.innerHTML = '<li class="text-sm text-gray-400 italic opacity-70">No history yet</li>';
            return;
        }
        this.historyList.innerHTML = this.entries.map((e) => {
            if (e.type === 'op') {
                return `<li class="text-sm text-gray-200 bg-[#2a2a2a] rounded-md p-2"><div class="opacity-70">${e.prev} ${e.operator} ${e.current}</div><div class="text-right">= ${e.result}</div></li>`;
            } else if (e.type === 'func') {
                const label = {
                    sqrt: '√',
                    pow: 'sqr',
                    percent: '%',
                    invert: '1/x'
                }[e.func] || e.func;
                return `<li class="text-sm text-gray-200 bg-[#2a2a2a] rounded-md p-2"><div class="opacity-70">${label}(${e.input})</div><div class="text-right">= ${e.result}</div></li>`;
            } else {
                return `<li class="text-sm text-gray-200 bg-[#2a2a2a] rounded-md p-2"><div class="opacity-70">${e.input}</div><div class="text-right">= ${e.result}</div></li>`;

            }
        }).join('');
    }

    updateMemoryDisplay() {
        if (this.memoryDisplay) {
            this.memoryDisplay.textContent = this.memoryValue.toString();
        }
    }

    // Memory functions
    memoryClear() {
        this.memoryValue = 0;
        this.updateMemoryDisplay();
    }

    memoryRecall() {
        this.currentInput = this.memoryValue.toString();
        this.shouldResetDisplay = true;
        this.updateDisplay();
    }

    memoryAdd() {
        const current = parseFloat(this.currentInput);
        this.memoryValue += current;
        this.updateMemoryDisplay();
    }

    memorySubtract() {
        const current = parseFloat(this.currentInput);
        this.memoryValue -= current;
        this.updateMemoryDisplay();
    }

    memoryStore() {
        const current = parseFloat(this.currentInput);
        this.memoryValue = current;
        this.updateMemoryDisplay();
    }
}

// Initialize calculator
const calculator = new Calculator();

// Global functions for button onclick events
function clearAll() {
    calculator.clearAll();
}

function clearEntry() {
    calculator.clearEntry();
}

function backspace() {
    calculator.backspace();
}

function inputNumber(num) {
    calculator.inputNumber(num);
}

function inputDecimal() {
    calculator.inputDecimal();
}

function inputOperator(op) {
    calculator.inputOperator(op);
}

function inputFunction(func) {
    calculator.inputFunction(func);
}

function calculate() {
    calculator.calculate();
}

function clearHistory() {
    calculator.entries = [];
    calculator.renderHistory();
}

// Memory functions
function memoryClear() {
    calculator.memoryClear();
}

function memoryRecall() {
    calculator.memoryRecall();
}

function memoryAdd() {
    calculator.memoryAdd();
}

function memorySubtract() {
    calculator.memorySubtract();
}

function memoryStore() {
    calculator.memoryStore();
}

// Toggle functions
function toggleHistory() {
    const sidebar = document.getElementById('history-sidebar');
    if (sidebar.classList.contains('hidden')) {
        sidebar.classList.remove('hidden');
        showHistory(); // Ensure history tab is active when opened
    } else {
        sidebar.classList.add('hidden');
    }
}

function showHistory() {
    document.getElementById('history-frame').classList.remove('hidden');
    document.getElementById('memory-frame').classList.add('hidden');
    document.getElementById('history-tab').classList.remove('bg-calc-button', 'hover:bg-calc-button-hover');
    document.getElementById('history-tab').classList.add('bg-calc-function', 'hover:bg-calc-function-hover');
    document.getElementById('memory-tab').classList.remove('bg-calc-function', 'hover:bg-calc-function-hover');
    document.getElementById('memory-tab').classList.add('bg-calc-button', 'hover:bg-calc-button-hover');
}

function showMemory() {
    document.getElementById('history-frame').classList.add('hidden');
    document.getElementById('memory-frame').classList.remove('hidden');
    document.getElementById('memory-tab').classList.remove('bg-calc-button', 'hover:bg-calc-button-hover');
    document.getElementById('memory-tab').classList.add('bg-calc-function', 'hover:bg-calc-function-hover');
    document.getElementById('history-tab').classList.remove('bg-calc-function', 'hover:bg-calc-function-hover');
    document.getElementById('history-tab').classList.add('bg-calc-button', 'hover:bg-calc-button-hover');
}

// Keyboard support
document.addEventListener('keydown', (e) => {
    e.preventDefault();
    
    const key = e.key;
    
    // Numbers
    if (key >= '0' && key <= '9') {
        inputNumber(key);
    }
    // Decimal point
    else if (key === '.') {
        inputDecimal();
    }
    // Operators
    else if (key === '+' || key === '-') {
        inputOperator(key);
    }
    else if (key === '*') {
        inputOperator('*');
    }
    else if (key === '/') {
        inputOperator('/');
    }
    // Calculate
    else if (key === 'Enter' || key === '=') {
        calculate();
    }
    // Clear
    else if (key === 'Escape' || key === 'c' || key === 'C') {
        clearAll();
    }
    // Backspace
    else if (key === 'Backspace') {
        backspace();
    }
    // Delete
    else if (key === 'Delete') {
        clearEntry();
    }
});
