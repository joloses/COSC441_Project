document.addEventListener("DOMContentLoaded", () => {
  const inputScreen = document.getElementById("input-screen");
  const testSelectionScreen = document.getElementById("test-selection-screen");
  const testScreen = document.getElementById("test-screen");
  const resultScreen = document.getElementById("result-screen");

  const stimulusDiv = document.getElementById("stimulus");
  const instruction = document.getElementById("instruction");
  const summary = document.getElementById("summary");

  const startButton = document.getElementById("start-button");
  const iconTestButton = document.getElementById("icon-test-button");
  const colorTestButton = document.getElementById("color-test-button");
  const downloadButton = document.getElementById("download-button");
  const restartButton = document.getElementById("restart-button");

  let participantId;
  let numTrials;
  let testType;
  let targetIcon = "circle"; // Default target for icon test
  let targetColor = "red"; // Default target for color test
  const shapes = ["circle", "square", "triangle", "pentagon"];
  const colors = ["red", "blue", "green", "yellow", "orange"];

  let stimuli = [];
  let currentStimulusIndex = 0;
  let startTime;
  let results = [];
  let reactionTimeout; // To store the timeout for reactions
  let acceptingInput = false; // To control when the space bar can be pressed
  const timeoutMs = 2000; // Max reaction time
  const delayMs = 500; // Delay before next stimulus
  const goalMessageDuration = 3000; // Duration to show goal message before the test starts (ms)

  // Step 1: Participant Input
  startButton.addEventListener("click", () => {
    participantId = document.getElementById("participant-id").value.trim();
    numTrials = parseInt(document.getElementById("num-trials").value, 10);

    if (!participantId || numTrials <= 0) {
      alert("Please enter valid inputs.");
      return;
    }

    inputScreen.classList.add("hidden");
    testSelectionScreen.classList.remove("hidden");
  });

  // Step 2: Test Selection
  iconTestButton.addEventListener("click", () => {
    testType = "icon";
    instruction.textContent = `Press SPACE when you see the target shape: ${targetIcon}. Ignore the color.`;
    generateStimuli();
    testSelectionScreen.classList.add("hidden");
    testScreen.classList.remove("hidden");

    // Show the goal message for a few seconds, then start the test
    setTimeout(() => {
      instruction.style.fontSize = "16px"; // Make the text smaller during the test
      showStimulus();
    }, goalMessageDuration);
  });

  colorTestButton.addEventListener("click", () => {
    testType = "color";
    instruction.textContent = `Press SPACE when you see the target color: ${targetColor}. Ignore the shape.`;
    generateStimuli();
    testSelectionScreen.classList.add("hidden");
    testScreen.classList.remove("hidden");

    // Show the goal message for a few seconds, then start the test
    setTimeout(() => {
      instruction.style.fontSize = "16px"; // Make the text smaller during the test
      showStimulus();
    }, goalMessageDuration);
  });

  // Step 3: Generate Stimuli
function generateStimuli() {
  const numDistractors = numTrials; // Equal number of distractors and targets
  const totalTrials = numTrials + numDistractors; // Total trials = targets + distractors

  // Generate target stimuli
  const targetStimuli = Array(numTrials)
    .fill(null)
    .map(() => ({
      type: "target",
      shape: testType === "icon" ? targetIcon : randomShape(),
      color: testType === "color" ? targetColor : randomColor()
    }));

  // Generate distractor stimuli
  const distractorStimuli = Array(numDistractors)
    .fill(null)
    .map(() => ({
      type: "non-target",
      shape: randomShape(),
      color: randomColor()
    }));

  // Combine and shuffle the stimuli
  stimuli = shuffleArray([...targetStimuli, ...distractorStimuli]);

  console.log(`Generated Stimuli: ${stimuli.length} trials (${numTrials} targets, ${numDistractors} distractors)`);
}

// Utility function to shuffle the array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
  return array;
}

  // Step 4: Show Stimulus
  function showStimulus() {
    if (currentStimulusIndex >= stimuli.length) {
      endTest(); // End test after all trials
      return;
    }
  
    const stimulus = stimuli[currentStimulusIndex];
    currentStimulusIndex++;
  
    renderShape(stimulus.shape, stimulus.color);
    startTime = Date.now();
    acceptingInput = true; // Enable space bar input
  
    // Set a timeout for handling no reaction
    reactionTimeout = setTimeout(() => {
      if (acceptingInput) {
        handleTimeout(stimulus);
      }
    }, timeoutMs);
  }
  

  // Step 5: Render SVG Shape
  function renderShape(shape, color) {
    stimulusDiv.innerHTML = ""; // Clear previous stimulus

    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("width", "100");
    svg.setAttribute("height", "100");

    let shapeElement;
    switch (shape) {
      case "circle":
        shapeElement = document.createElementNS(ns, "circle");
        shapeElement.setAttribute("cx", "50");
        shapeElement.setAttribute("cy", "50");
        shapeElement.setAttribute("r", "40");
        break;
      case "square":
        shapeElement = document.createElementNS(ns, "rect");
        shapeElement.setAttribute("x", "10");
        shapeElement.setAttribute("y", "10");
        shapeElement.setAttribute("width", "80");
        shapeElement.setAttribute("height", "80");
        break;
      case "triangle":
        shapeElement = document.createElementNS(ns, "polygon");
        shapeElement.setAttribute("points", "50,10 10,90 90,90");
        break;
      case "pentagon":
        shapeElement = document.createElementNS(ns, "polygon");
        shapeElement.setAttribute(
          "points",
          "50,10 90,35 72,90 28,90 10,35"
        );
        break;
    }

    shapeElement.setAttribute("fill", color);
    svg.appendChild(shapeElement);
    stimulusDiv.appendChild(svg);
  }

  // Step 6: Handle Reaction
  document.addEventListener("keydown", (event) => {
    if (event.code === "Space" && acceptingInput) {
      acceptingInput = false; // Disable input until the next stimulus
      clearTimeout(reactionTimeout); // Clear any pending timeout

      const reactionTime = Date.now() - startTime;
      const stimulus = stimuli[currentStimulusIndex - 1];
      const isError =
        (testType === "icon" && stimulus.shape !== targetIcon) ||
        (testType === "color" && stimulus.color !== targetColor) ? 1 : 0;

      results.push({
        shape: stimulus.shape,
        color: stimulus.color,
        reactionTime: reactionTime,
        error: isError
      });

      stimulusDiv.innerHTML = ""; // Clear current stimulus
      setTimeout(showStimulus, delayMs); // Delay before next stimulus
    }
  });

  // Step 7: Handle Timeout
  function handleTimeout(stimulus) {
    acceptingInput = false; // Disable input for the timeout case
    const isError = stimulus.type === "target" ? 1 : 0;

    results.push({
      shape: stimulus.shape,
      color: stimulus.color,
      reactionTime: null, // No reaction time for timeouts
      error: isError
    });

    stimulusDiv.innerHTML = ""; // Clear current stimulus
    setTimeout(showStimulus, delayMs); // Delay before next stimulus
  }

  // Step 8: End Test
  function endTest() {
    testScreen.classList.add("hidden");
    resultScreen.classList.remove("hidden");

    const validResults = results.filter((r) => r.reactionTime !== null);
    const correctResults = validResults.filter((r) => r.error === 0);
    const avgReaction =
      correctResults.reduce((sum, r) => sum + r.reactionTime, 0) /
      Math.max(1, correctResults.length);

    summary.textContent = `Average Reaction Time: ${avgReaction.toFixed(
      2
    )} ms\nTotal Errors: ${results.filter((r) => r.error === 1).length}`;
  }

  // Step 9: Download Results
  downloadButton.addEventListener("click", () => {
    const csv =
      "Participant ID,Shape,Color,Reaction Time (ms),Error\n" +
      results
        .map(
          (r) =>
            `${participantId},${r.shape},${r.color},${r.reactionTime || ""},${r.error}`
        )
        .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `participant_${participantId}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });
  
  // Step 10: Restart Test
restartButton.addEventListener("click", () => {
  resetTest(); // Reset test state
  resultScreen.classList.add("hidden"); // Hide results screen
  inputScreen.classList.remove("hidden"); // Show input screen
});

// Reset Test State
function resetTest() {
  currentStimulusIndex = 0;
  results = [];
  stimulusDiv.innerHTML = ""; // Clear any remaining stimulus
  instruction.textContent = ""; // Clear any remaining instructions
  instruction.style.fontSize = "20px"; // Reset font size for instructions
  clearTimeout(reactionTimeout); // Clear any pending timeout
  acceptingInput = false; // Disable input to avoid unwanted interactions
}

  // Utility Functions
  function randomShape() {
    return shapes[Math.floor(Math.random() * shapes.length)];
  }

  function randomColor() {
    return colors[Math.floor(Math.random() * colors.length)];
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
});
