// ==UserScript==
// @name         KG_Snowflakes
// @namespace    http://tampermonkey.net/
// @version      2023-12-30
// @description  Add some snow particles
// @author       Patcher
// @match        *://klavogonki.ru/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=klavogonki.ru
// @grant        none
// ==/UserScript==

// Constants
const snowflakesCount = 200; // Total number of snowflakes
const snowFallDuration = 10; // Duration of the snowfall animation in seconds
const maxMovementX = 30; // Maximum horizontal movement of snowflakes in percentage of window width
const incrementDuration = 300; // Time between each increment in milliseconds

// Function to start the snowfall animation
function startSnowfall() {
  // Create a container for the snowflakes
  const snowflakeContainer = document.createElement("div");
  snowflakeContainer.className = "snowflakes";
  document.body.appendChild(snowflakeContainer);

  // Initialize the count of currently created snowflakes
  let currentSnowflakesCount = 0;

  // Function to create a single snowflake
  function createSnowflake() {
    const snowflake = document.createElement("div");
    snowflake.className = "snowflake";
    snowflakeContainer.appendChild(snowflake);

    // Set random properties for the snowflake
    const speedFactor = Math.random() * (4 / snowFallDuration) + (2 / snowFallDuration);
    const opacity = Math.random() * 0.5 + 0.5;
    const size = Math.random() * 0.2 + 0.2;
    const startX = Math.random() * window.innerWidth;

    // Apply styles to the snowflake
    snowflake.style.width = size + "em";
    snowflake.style.height = size + "em";
    snowflake.style.background = `rgba(255, 255, 255, ${opacity})`;
    snowflake.style.setProperty("border-radius", "50%", "important");
    snowflake.style.position = "absolute";
    snowflake.style.top = "0";
    snowflake.style.left = "0";

    // Start animation for the snowflake
    animateSnowflake(snowflake, startX, speedFactor);
  }

  // Function to animate a single snowflake
  function animateSnowflake(snowflake, startX, speedFactor) {
    // Calculate the end position for the snowflake
    const endY = window.innerHeight;
    const maxXMovement = (window.innerWidth * maxMovementX) / 100;
    const endX = startX + (Math.random() * maxXMovement * 2 - maxXMovement);

    // Calculate the total duration for the animation based on speed factor
    const duration = 10000 * speedFactor; // duration based on speed factor

    // Record the start time of the animation
    const startTime = Date.now();

    // Recursive function to animate the snowflake
    function animate() {
      // Calculate the current time and progress of the animation
      const currentTime = Date.now() - startTime;
      const progress = currentTime / duration;

      if (progress < 1) {
        // Calculate the current position of the snowflake based on progress
        const x = startX + (endX - startX) * progress;
        const y = (endY * progress) / window.innerHeight * 100;

        // Apply the transformation to move the snowflake
        snowflake.style.transform = `translate(${(x / window.innerWidth) * 100}vw, ${y}vh)`;

        // Continue the animation by requesting the next frame
        requestAnimationFrame(animate);
      } else {
        // Remove the snowflake when the animation is complete
        snowflake.parentNode.removeChild(snowflake);
        currentSnowflakesCount--;

        // Create a new snowflake if the count is below the total desired count
        if (currentSnowflakesCount < snowflakesCount) {
          createSnowflake();
          currentSnowflakesCount++;
        }
      }
    }

    // Start the animation
    animate();
  }

  // Function to incrementally create snowflakes with a delay
  function incrementSnowflakes() {
    if (currentSnowflakesCount < snowflakesCount) {
      // Create a new snowflake
      createSnowflake();
      currentSnowflakesCount++;

      // Set a timeout for the next increment
      setTimeout(incrementSnowflakes, incrementDuration);
    }
  }

  // Start incrementing snowflakes
  incrementSnowflakes();

  // Set styles for the snowflake container
  snowflakeContainer.style.position = "absolute";
  snowflakeContainer.style.top = "0";
  snowflakeContainer.style.bottom = "0";
  snowflakeContainer.style.left = "0";
  snowflakeContainer.style.right = "0";
  snowflakeContainer.style.pointerEvents = "none";
  snowflakeContainer.style.overflow = "hidden"; // Add overflow hidden for the container
}

// Call the function to start the continuous snowfall
startSnowfall();