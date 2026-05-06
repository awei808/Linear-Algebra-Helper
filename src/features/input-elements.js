import { state } from '../state/state.js';
import { elements } from '../dom/elements.js';
import { adjustInputWidth } from '../utils/dom-utils.js';
import { showSuccess } from '../ui/popup.js';
import { handleMouseDown, handleMouseLeave, createGrid, updateCoordinatesDisplay } from './select-dimension.js';
import { unbindRowColumnIndexEvents } from './elementary-transformation.js';

export function removeNonHighlightedCells() {
    const allCells = Array.from(elements.windowDiv.querySelectorAll('.grid-cell'));
    const nonHighlightedCells = allCells.filter(cell => !cell.classList.contains('highlighted'));

    nonHighlightedCells.forEach(cell => {
        cell.remove();
    });

    state.gridCells = Array.from(elements.windowDiv.querySelectorAll('.grid-cell'));
}

export function convertHighlightedCellsToInputs(highlightedCells) {
    highlightedCells.forEach(cell => {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'grid-cell-input';
        input.dataset.x = cell.dataset.x;
        input.dataset.y = cell.dataset.y;
        input.dataset.index = cell.dataset.index;
        input.placeholder = '0';
        cell.parentNode.replaceChild(input, cell);

        state.gridInputs = state.gridInputs || [];
        state.gridInputs.push(input);
    });
}

export function clearSelectedMatrixElements() {
    const selectedElements = elements.windowDiv.querySelectorAll('.selected-matrix-element');
    selectedElements.forEach(element => {
        element.classList.remove('selected-matrix-element');
    });

    state.selectedMatrixElements = [];
}

export function handleInputChange(event) {
    adjustInputWidth(event.target);
    console.log('桌面端输入框宽度调整');
}

export function handleInputChangeMobile(event) {
    const input = event.target;

    if (window.visualViewport) {
        const currentInput = input;

        const handleViewportChange = () => {
            if (window.visualViewport.height > window.innerHeight * 0.8) {
                adjustInputWidth(currentInput);
                window.visualViewport.removeEventListener('resize', handleViewportChange);
            }
        };

        window.visualViewport.addEventListener('resize', handleViewportChange);

        setTimeout(() => {
            window.visualViewport.removeEventListener('resize', handleViewportChange);
        }, 5000);

    } else {
        setTimeout(() => {
            const activeEl = document.activeElement;
            const isInputFocused = activeEl && activeEl.tagName === 'INPUT';

            if (!isInputFocused) {
                adjustInputWidth(input);
            } else {
                setTimeout(() => {
                    const activeEl2 = document.activeElement;
                    const isInputFocused2 = activeEl2 && activeEl2.tagName === 'INPUT';

                    if (!isInputFocused2) {
                        adjustInputWidth(input);
                        showSuccess('移动端时间差输入框宽度调整');
                    }
                }, 100);
            }
        }, 100);
    }
}

export function enableInputInteraction() {
    const inputs = Array.from(elements.windowDiv.querySelectorAll('.grid-cell-input'));
    inputs.forEach(input => {
        input.disabled = false;
        input.style.backgroundColor = 'white';
        input.style.cursor = 'text';

        if (state.isMobile) {
            input.removeEventListener('input', handleInputChange);
            input.removeEventListener('input', handleInputChangeMobile);
            input.addEventListener('input', handleInputChangeMobile);
        } else {
            input.removeEventListener('input', handleInputChange);
            input.removeEventListener('input', handleInputChangeMobile);
            input.addEventListener('input', handleInputChange);
        }
        adjustInputWidth(input);
    });
}

export function disableGridInteraction() {
    elements.windowDiv.removeEventListener('mousedown', handleMouseDown);
    elements.windowDiv.removeEventListener('mouseleave', handleMouseLeave);
}

export function hideElementaryTransformationUI() {
    elements.operatorButtons.classList.add('hidden');
    unbindRowColumnIndexEvents();
}

export function restoreGridForInputElements() {
    if (state.matrixData) {
        const { rows, cols } = state.matrixData;
        const tempInput = document.createElement('input');
        tempInput.className = 'grid-cell-input';
        document.body.appendChild(tempInput);
        const computedStyle = window.getComputedStyle(tempInput);
        const inputWidth = parseFloat(computedStyle.width);
        const inputHeight = parseFloat(computedStyle.height);
        document.body.removeChild(tempInput);
        const gap = 0;

        elements.windowDiv.classList.add('dynamic');
        elements.windowDiv.style.width = `${cols * (inputWidth + gap)}px`;
        elements.windowDiv.style.height = `${rows * (inputHeight + gap)}px`;
        elements.windowDiv.style.gridTemplateColumns = `repeat(${cols}, ${inputWidth}px)`;
        elements.windowDiv.style.gridTemplateRows = `repeat(${rows}, ${inputHeight}px)`;
    } else {
        elements.windowDiv.classList.remove('dynamic');
        elements.windowDiv.style.width = '400px';
        elements.windowDiv.style.height = '400px';
        elements.windowDiv.style.gridTemplateColumns = 'repeat(10, 40px)';
        elements.windowDiv.style.gridTemplateRows = 'repeat(10, 40px)';
    }

    elements.windowDiv.innerHTML = '';

    state.gridInputs = [];
    state.gridCells = [];

    if (state.matrixData) {
        const { rows, cols, elements: matrixElements } = state.matrixData;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'grid-cell-input';

                input.dataset.x = col;
                input.dataset.y = row;

                input.value = matrixElements[row][col] || '';

                elements.windowDiv.appendChild(input);
                state.gridInputs.push(input);
            }
        }

        state.gridInputs.forEach(input => {
            input.removeEventListener('input', handleInputChange);
            input.addEventListener('input', handleInputChange);

            adjustInputWidth(input);
        });

        updateCoordinatesDisplay(`${rows}×${cols}`);
    } else {
        createGrid();
        updateCoordinatesDisplay('0×0');
        showSuccess('已恢复到初始网格');
    }
}
