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

  // Define shapes and colors
  const shapes = ["circle", "square", "triangle", "arrow", "minus", "X"];
  const colors = ["red", "blue", "green", "yellow", "orange"];

  let participantId;
  let numTrials;
  let testType;
  let targetIcon = randomShape(); // Default target for icon test
  let targetColor = randomColor(); // Default target for color test

  let stimuli = [];
  let currentStimulusIndex = 0;
  let startTime;
  let results = [];
  let reactionTimeout; // To store the timeout for reactions
  let acceptingInput = false; // To control when the space bar can be pressed
  const timeoutMs = 2000; // Max reaction time (Before next stimuli will be shown)
  const delayMs = 500; // Delay before next stimulus
  const goalMessageDuration = 3000; // Duration to show goal message before the test starts (ms)

  // Step 1: Participant Input
  startButton.addEventListener("click", () => {
    participantId = document.getElementById("participant-id").value.trim();
    numTrials = parseInt(document.getElementById("num-trials").value, 10);

    if (!participantId || isNaN(numTrials) || numTrials <= 0) {
      alert("Please enter a valid Participant ID and a positive number of trials.");
      return;
    }

    inputScreen.classList.add("hidden");
    testSelectionScreen.classList.remove("hidden");
  });

  // Step 2: Test Selection
  iconTestButton.addEventListener("click", () => {
    testType = "icon";

    // Dynamically select a random target shape for the icon test
    targetIcon = randomShape();

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
    const numDistractors = numTrials; // Equal number of distractors as targets
    const totalTrials = numTrials * 2; // Total trials = targets + distractors

    // Generate target stimuli (goal icons)
    const targetStimuli = Array(numTrials)
      .fill(null)
      .map(() => ({
        type: "target",
        shape: testType === "icon" ? targetIcon : randomShape(),
        color: testType === "color" ? targetColor : randomColor(),
      }));

    // Generate distractor stimuli (non-target icons)
    const distractorStimuli = Array(numDistractors)
      .fill(null)
      .map(() => ({
        type: "non-target",
        shape: testType === "icon" ? randomShapeExcluding(targetIcon) : randomShape(),
        color: testType === "color" ? randomColorExcluding(targetColor) : randomColor(),
      }));

    // Combine and shuffle the stimuli
    stimuli = shuffleArray([...targetStimuli, ...distractorStimuli]);

    console.log(
      `Generated Stimuli: ${stimuli.length} trials (${numTrials} targets, ${numDistractors} distractors)`
    );
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
      case "arrow":
        shapeElement = document.createElementNS(ns, "polygon");
        shapeElement.setAttribute("points", "50,10 10,40 40,40 40,90 60,90 60,40 90,40");
        break;
      case "minus":
        shapeElement = document.createElementNS(ns, "rect");
        shapeElement.setAttribute("x", "20");
        shapeElement.setAttribute("y", "45");
        shapeElement.setAttribute("width", "60");
        shapeElement.setAttribute("height", "10");
        break;
      case "X":
        shapeElement = document.createElementNS(ns, "line");
        shapeElement.setAttribute("x1", "20");
        shapeElement.setAttribute("y1", "20");
        shapeElement.setAttribute("x2", "80");
        shapeElement.setAttribute("y2", "80");
        shapeElement.setAttribute("stroke", color);
        shapeElement.setAttribute("stroke-width", "10");

        const line2 = document.createElementNS(ns, "line");
        line2.setAttribute("x1", "80");
        line2.setAttribute("y1", "20");
        line2.setAttribute("x2", "20");
        line2.setAttribute("y2", "80");
        line2.setAttribute("stroke", color);
        line2.setAttribute("stroke-width", "10");

        svg.appendChild(shapeElement);
        svg.appendChild(line2);
        stimulusDiv.appendChild(svg);
        return; // Return early to avoid duplicate shapes.
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
        (testType === "color" && stimulus.color !== targetColor)
          ? 1
          : 0;

      results.push({
        shape: stimulus.shape,
        color: stimulus.color,
        reactionTime: reactionTime,
        error: isError,
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
      error: isError,
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

  function randomShapeExcluding(exclude) {
    const filteredShapes = shapes.filter((shape) => shape !== exclude);
    return filteredShapes[Math.floor(Math.random() * filteredShapes.length)];
  }

  function randomColor() {
    return colors[Math.floor(Math.random() * colors.length)];
  }

  function randomColorExcluding(exclude) {
    const filteredColors = colors.filter((color) => color !== exclude);
    return filteredColors[Math.floor(Math.random() * filteredColors.length)];
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
    return array;
  }
});
