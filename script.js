document.addEventListener('DOMContentLoaded', () => {
    const countdownMinDisplay = document.getElementById('countdown-min');
    const countdownSecDisplay = document.getElementById('countdown-sec');
    const currentPeriodDisplay = document.getElementById('current-period');
    const generatedNumberDisplay = document.getElementById('generated-number');
    const resultsHistoryBody = document.getElementById('results-history');

    const predictPeriodInput = document.getElementById('predict-period-input');
    const predictButton = document.getElementById('predict-button');
    const predictedPeriodDisplay = document.getElementById('predicted-period');
    const predictedNumberDisplay = document.getElementById('predicted-number');
    const predictedOutcomeDisplay = document.getElementById('predicted-outcome');

    const PERIOD_DURATION = 30; // seconds
    let timeLeft = PERIOD_DURATION;
    let timerInterval;
    let lastPeriodStartTime; // Timestamp when the current period started

    // --- PRNG (Pseudo-Random Number Generator) ---
    // Modified to accept a seed, making it deterministic for prediction
    function seededPRNG(initialSeed) {
        let currentSeed = initialSeed;
        const a = 1103515245;
        const c = 12345;
        const m = Math.pow(2, 31);

        return function() {
            currentSeed = (a * currentSeed + c) % m;
            return currentSeed / m; // Value between 0 and 1
        };
    }

    // Function to generate a random integer for a specific seed
    function getNumberForPeriod(periodString) {
        // Use a part of the period string as the seed for reproducibility
        // A simple way is to convert the period string (or its numerical part) to a number
        // Ensure it's a number to be used as a seed. We can use the full period number for a better seed.
        let seedValue = parseInt(periodString.slice(-7)); // Using last few digits for a more varying seed.
        if (isNaN(seedValue)) {
            seedValue = Date.now(); // Fallback if parsing fails
        }
        
        const prngGenerator = seededPRNG(seedValue);
        return Math.floor(prngGenerator() * 10); // Generates 0-9
    }

    // --- Period Number Generation ---
    let periodSerialCounter = 0;

    function getCurrentTimeBasedPrefix(timestamp = new Date()) {
        const now = new Date(timestamp);
        const year = now.getFullYear().toString();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const secondsBlock = Math.floor(now.getSeconds() / PERIOD_DURATION) * PERIOD_DURATION;
        const seconds = secondsBlock.toString().padStart(2, '0');

        return `${year}${month}${day}${hours}${minutes}${seconds}`;
    }

    // This function now just provides the string for display/history
    function getDisplayPeriodNumber() {
        const timePrefix = getCurrentTimeBasedPrefix();
        return `${timePrefix}${periodSerialCounter.toString().padStart(3, '0')}`;
    }

    // This function helps to derive the *next* serial period from a given period string
    function getNextSerialPeriod(currentPeriodStr) {
        if (!currentPeriodStr || currentPeriodStr.length < 3) {
            console.error("Invalid period string for next serial calculation.");
            return null;
        }
        const currentSerial = parseInt(currentPeriodStr.slice(-3));
        const nextSerial = currentSerial + 1;
        const timePrefix = currentPeriodStr.slice(0, -3); // Get the YYYYMMDDHHMMSS part
        return `${timePrefix}${nextSerial.toString().padStart(3, '0')}`;
    }


    // --- Number Outcome Logic ---
    function getNumberOutcome(number) {
        let outcomeText = '';
        let outcomeClass = '';
        let colorClass = '';

        if (number >= 0 && number <= 4) {
            outcomeText = 'Small';
            outcomeClass = 'outcome-small';
        } else if (number >= 5 && number <= 9) {
            outcomeText = 'Big';
            outcomeClass = 'outcome-big';
        }

        switch (number) {
            case 0:
                colorClass = 'color-red-violet';
                break;
            case 1:
                colorClass = 'color-green';
                break;
            case 2:
                colorClass = 'color-red';
                break;
            case 3:
                colorClass = 'color-green';
                break;
            case 4:
                colorClass = 'color-red';
                break;
            case 5:
                colorClass = 'color-green-violet';
                break;
            case 6:
                colorClass = 'color-red';
                break;
            case 7:
                colorClass = 'color-green';
                break;
            case 8:
                colorClass = 'color-red';
                break;
            case 9:
                colorClass = 'color-green';
                break;
            default:
                colorClass = '';
        }

        let dotColorClass = colorClass;
        if (number === 0) {
            dotColorClass = 'color-red-violet';
        } else if (number === 5) {
            dotColorClass = 'color-green-violet';
        }

        return { outcomeText, outcomeClass, colorClass, dotColorClass };
    }

    // --- Countdown and Game Loop ---
    function updateDisplayCountdown() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        countdownMinDisplay.textContent = minutes.toString().padStart(2, '0');
        countdownSecDisplay.textContent = seconds.toString().padStart(2, '0');
    }

    function tick() {
        const now = Date.now();
        const elapsedTime = Math.floor((now - lastPeriodStartTime) / 1000);

        timeLeft = PERIOD_DURATION - (elapsedTime % PERIOD_DURATION);

        const periodsPassed = Math.floor(elapsedTime / PERIOD_DURATION);

        if (periodsPassed > 0) {
            for (let i = 0; i < periodsPassed; i++) {
                periodSerialCounter++; // Increment for each passed period
                const simulatedPeriodTime = lastPeriodStartTime + (i + 1) * PERIOD_DURATION * 1000;
                const historicalTimePrefix = getCurrentTimeBasedPrefix(simulatedPeriodTime);
                const historicalPeriod = `${historicalTimePrefix}${periodSerialCounter.toString().padStart(3, '0')}`;

                // Generate number deterministically for this historical period
                const generatedNumber = getNumberForPeriod(historicalPeriod);
                const { outcomeText, outcomeClass, colorClass, dotColorClass } = getNumberOutcome(generatedNumber);
                
                addResultToHistory(historicalPeriod, generatedNumber, outcomeText, outcomeClass, dotColorClass); // Removed animate=false, as it defaults to true
            }

            // Update lastPeriodStartTime to the start of the current, active partial period
            lastPeriodStartTime = now - (elapsedTime % PERIOD_DURATION) * 1000;
            
            // Only update the main display for the *current* active period
            // The number generated for the display should be for the *newly active* period.
            const currentPeriodNumberString = getDisplayPeriodNumber(); // Get the latest period number
            const currentNumber = getNumberForPeriod(currentPeriodNumberString);

            generatedNumberDisplay.classList.remove('color-red', 'color-green', 'color-red-violet', 'color-green-violet');
            generatedNumberDisplay.textContent = currentNumber;
            generatedNumberDisplay.classList.add(getNumberOutcome(currentNumber).colorClass);
            generatedNumberDisplay.style.transform = 'scale(0.8)';
            setTimeout(() => {
                generatedNumberDisplay.style.transform = 'scale(1)';
            }, 50);

            currentPeriodDisplay.textContent = currentPeriodNumberString;
            
        }
        updateDisplayCountdown();
    }

    function startTimer() {
        if (timerInterval) clearInterval(timerInterval);
        lastPeriodStartTime = Date.now() - (PERIOD_DURATION - timeLeft) * 1000;
        timerInterval = setInterval(tick, 1000);
        tick();
    }

    function stopTimer() {
        clearInterval(timerInterval);
    }

    function addResultToHistory(period, number, outcomeText, outcomeClass, dotColorClass) {
        const row = resultsHistoryBody.insertRow(0);

        const cellPeriod = row.insertCell(0);
        cellPeriod.textContent = period;

        const cellNumber = row.insertCell(1);
        cellNumber.textContent = number;

        const cellBigSmall = row.insertCell(2);
        cellBigSmall.classList.add('big-small-text', outcomeClass);
        cellBigSmall.textContent = outcomeText;

        const cellColor = row.insertCell(3);
        const colorDot = document.createElement('span');
        colorDot.classList.add('number-dot', dotColorClass);
        cellColor.appendChild(colorDot);

        while (resultsHistoryBody.children.length > 15) {
            resultsHistoryBody.removeChild(resultsHistoryBody.lastChild);
        }
    }

    // --- Visibility Change Handling ---
    function handleVisibilityChange() {
        if (document.visibilityState === 'hidden') {
            stopTimer();
        } else {
            console.log('Tab is visible. Resuming game state.');
            syncGameState();
            startTimer();
        }
    }

    // --- Core Game State Synchronization ---
    function syncGameState() {
        const now = Date.now();
        const elapsedSinceLastPeriodStart = now - lastPeriodStartTime;
        
        const fullPeriodsElapsed = Math.floor(elapsedSinceLastPeriodStart / (PERIOD_DURATION * 1000));
        
        if (fullPeriodsElapsed > 0) {
            for (let i = 0; i < fullPeriodsElapsed; i++) {
                periodSerialCounter++;
                const simulatedPeriodTime = lastPeriodStartTime + (i + 1) * PERIOD_DURATION * 1000;
                const historicalTimePrefix = getCurrentTimeBasedPrefix(simulatedPeriodTime);
                const historicalPeriod = `${historicalTimePrefix}${periodSerialCounter.toString().padStart(3, '0')}`;
                
                const generatedNumber = getNumberForPeriod(historicalPeriod);
                const { outcomeText, outcomeClass, colorClass, dotColorClass } = getNumberOutcome(generatedNumber);
                addResultToHistory(historicalPeriod, generatedNumber, outcomeText, outcomeClass, dotColorClass);
            }
            lastPeriodStartTime += fullPeriodsElapsed * PERIOD_DURATION * 1000;
        }

        timeLeft = PERIOD_DURATION - Math.floor((now - lastPeriodStartTime) / 1000);
        if (timeLeft < 0) timeLeft = 0;

        periodSerialCounter++; // Increment to get the current actual period number for display
        currentPeriodDisplay.textContent = getDisplayPeriodNumber();
        // The displayed number should be for the *current* period that is ticking down.
        const currentNumber = getNumberForPeriod(getDisplayPeriodNumber());
        const { outcomeText: currentOutcome, colorClass: currentColorClass } = getNumberOutcome(currentNumber);
        generatedNumberDisplay.classList.remove('color-red', 'color-green', 'color-red-violet', 'color-green-violet');
        generatedNumberDisplay.textContent = currentNumber;
        generatedNumberDisplay.classList.add(currentColorClass);
        generatedNumberDisplay.style.transform = 'scale(0.8)';
        setTimeout(() => {
            generatedNumberDisplay.style.transform = 'scale(1)';
        }, 50);

        updateDisplayCountdown();
    }

    // --- Prediction Logic ---
    predictButton.addEventListener('click', () => {
        const inputLast3Digits = predictPeriodInput.value.trim();
        if (!inputLast3Digits || inputLast3Digits.length > 3) {
            alert('Please enter the last 3 digits of the current period.');
            return;
        }

        // Get the full current period string from the display to derive the time prefix
        const currentFullPeriodString = currentPeriodDisplay.textContent;
        if (!currentFullPeriodString || currentFullPeriodString.length < 3) {
            alert('Current period not available yet for prediction.');
            return;
        }
        
        const timePrefix = currentFullPeriodString.slice(0, -3); // e.g., 20250715100051

        // Construct the full input period string
        const inputFullPeriodString = `${timePrefix}${inputLast3Digits.padStart(3, '0')}`;

        // Validate if the input period makes sense (optional but good practice)
        // e.g., check if it's not too far in the past/future, or if it's the current period
        const actualCurrentSerial = parseInt(currentPeriodDisplay.textContent.slice(-3));
        const inputSerial = parseInt(inputLast3Digits);
        
        // This logic predicts for the NEXT period based on the INPUT period.
        // So if user enters '781', they want to know the result for '782'.
        let nextPeriodSerial;
        let nextPeriodTimePrefix = timePrefix;

        if (inputSerial === actualCurrentSerial) {
             // If they entered the current period, we want to predict the *next* actual period.
             nextPeriodSerial = actualCurrentSerial + 1;
             // The time prefix should also advance if we are crossing a 30-second boundary
             // This is tricky. For a client-side PRNG, it's safer to always base prediction on the *given* input period + 1.
             // For strict alignment, we'd need to calculate the actual time for inputFullPeriodString + 1 period.
             // Simpler approach: Assume the time prefix for prediction stays same, only serial changes,
             // UNLESS the serial wraps around (e.g. 999 to 000 implies time prefix changes).

            // Let's make it robust: derive the full next period string based on the input serial
            // If the input serial would wrap around, the time prefix would change
            // This is complex for a client-side PRNG that only has current time for real periods.
            // Simplified: The prediction just increments the *serial* part. The time prefix is always derived from *current* game time.
            
            // For a robust deterministic prediction, the entire period string (YYYYMMDDHHMMSSSSS)
            // *is* the seed. So, we need to generate the *next* period string based on the input.

            // Derive the time portion (YYYYMMDDHHMMSS) from the current full period.
            // Then calculate the 'next' period based on its last 3 digits.
            const fullPeriodToPredictFrom = timePrefix + inputLast3Digits.padStart(3, '0');
            const nextPeriodToPredict = getNextPeriodStringFromBase(fullPeriodToPredictFrom);

            if (nextPeriodToPredict) {
                const predictedNumber = getNumberForPeriod(nextPeriodToPredict);
                const { outcomeText, colorClass } = getNumberOutcome(predictedNumber);

                predictedPeriodDisplay.textContent = nextPeriodToPredict;
                predictedNumberDisplay.textContent = predictedNumber;
                predictedNumberDisplay.className = `number-circle-small ${colorClass}`; // Apply color
                predictedOutcomeDisplay.textContent = outcomeText;
                predictedOutcomeDisplay.className = `big-small-text ${outcomeText.toLowerCase()}`; // Apply color for Big/Small
            } else {
                 predictedPeriodDisplay.textContent = '---';
                 predictedNumberDisplay.textContent = '?';
                 predictedNumberDisplay.className = 'number-circle-small';
                 predictedOutcomeDisplay.textContent = 'Invalid Period';
                 predictedOutcomeDisplay.className = '';
            }

        } else {
             // If they entered a period that is not the current one,
             // we still want to predict the period *after* their input.
             const fullPeriodToPredictFrom = timePrefix + inputLast3Digits.padStart(3, '0');
             const nextPeriodToPredict = getNextPeriodStringFromBase(fullPeriodToPredictFrom);

             if (nextPeriodToPredict) {
                const predictedNumber = getNumberForPeriod(nextPeriodToPredict);
                const { outcomeText, colorClass } = getNumberOutcome(predictedNumber);

                predictedPeriodDisplay.textContent = nextPeriodToPredict;
                predictedNumberDisplay.textContent = predictedNumber;
                predictedNumberDisplay.className = `number-circle-small ${colorClass}`;
                predictedOutcomeDisplay.textContent = outcomeText;
                predictedOutcomeDisplay.className = `big-small-text ${outcomeText.toLowerCase()}`;
            } else {
                 predictedPeriodDisplay.textContent = '---';
                 predictedNumberDisplay.textContent = '?';
                 predictedNumberDisplay.className = 'number-circle-small';
                 predictedOutcomeDisplay.textContent = 'Invalid Period';
                 predictedOutcomeDisplay.className = '';
            }
        }
    });

    // Helper to calculate the next full period string given a base period string
    // This is crucial for deterministic prediction across period boundaries.
    function getNextPeriodStringFromBase(basePeriodString) {
        if (!basePeriodString || basePeriodString.length !== 18) { // YYYYMMDDHHMMSSSSS = 18 chars
            return null; // Invalid format
        }

        let serialPart = parseInt(basePeriodString.slice(-3));
        let timePart = basePeriodString.slice(0, -3);

        serialPart++; // Increment the serial

        // Check if serial overflows (e.g., from 999 to 1000, implies time needs to advance)
        // This is where it gets tricky for a purely serial counter with time embedded.
        // For simplicity with this PRNG, we'll assume serial rolls over at 999,
        // and the time part *doesn't* automatically advance unless it's the live game.
        // For prediction, we just increment the serial part and assume the time part stays the same
        // unless you want a more complex time-synchronous prediction.
        // Given your example "781" -> "782", it suggests only the last 3 digits increment.
        
        return `${timePart}${serialPart.toString().padStart(3, '0')}`;
    }


    // --- Initial Setup ---
    function initializeGame() {
        document.addEventListener('visibilitychange', handleVisibilityChange);

        const now = new Date();
        const totalSecondsInDay = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
        periodSerialCounter = 700 + Math.floor(totalSecondsInDay / PERIOD_DURATION);

        const currentSeconds = now.getSeconds();
        const secondsIntoCurrentBlock = currentSeconds % PERIOD_DURATION;
        lastPeriodStartTime = now.getTime() - secondsIntoCurrentBlock * 1000;

        syncGameState();
        startTimer();
    }

    initializeGame();
});
