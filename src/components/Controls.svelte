<script context="module">
    import { iterationCount, iterationInterval, matrix } from "../store.js";
    import Gameboard from "../models/gameboard.js";

    // create a gameboard
    const gameboard = new Gameboard(180, 330);
    gameboard.randomlyPopulate();

    // set the initial gameboard matrix in store
    matrix.set([...gameboard.matrix]);

    // since we can pause/play, add a isRunning value that will get checked every render
    let isRunning = false;

    // set a default main loop interval
    let mainInterval = 500;

    // we show the interval in stats, so set it in state
    iterationInterval.set(500);

    // add a couple counters for determining if it's time to render a new iteration or not
    let lastFrameTime = 0;
    let lastRenderTime = 0;

    // animation frame id, this is how we start or stop rendering
    let requestId;

    // the main game loop, it's always called by requestAnimationFrame which gives a timestamp which lets me have intervals.
    const main = (time) => {
        // big undefined boy for success in start/stop
        requestId = undefined;

        const timeSinceLastRender = time - lastRenderTime;

        // if time since last render is past our interval render it up
        if (timeSinceLastRender > mainInterval) {
            lastRenderTime = time;

            iterationCount.update(currentValue => currentValue + 1);

            gameboard.iterate();

            // after every interval update the store matrix, this will automatically draw in the canvas component because subscriptions. svelte is cool.
            matrix.set([...gameboard.matrix]);
        }

        // if we are running, keep going, else stop
        isRunning ? start() : stop();
    } 

    // starts the loop up
    const start = () => {
        if (!requestId) {
            requestId = requestAnimationFrame(main);
        }
    }

    // stops the loop
    const stop = () => {
        if (requestId) {
            cancelAnimationFrame(requestId);
            requestId = undefined;
        }
    }

    // toggle isRunning and go through game loop one time
    const handlePausePlay = () => {
        isRunning = !isRunning;

        start();
    }

    // slows speed by increasing the interval, but never let the user be slower than 1 second
    const handleSlowDown = () => {
        if (mainInterval < 1000) mainInterval = mainInterval + 100;
        iterationInterval.set(mainInterval);
    }

    // increase speed by decreasing interval, never going below a 0ms interval.
    const handleSpeedUp = () => {
        if (mainInterval > 0) mainInterval = mainInterval - 100;
        iterationInterval.set(mainInterval);
    }
</script>

<main>
    <div class="container">
        <button on:click={handleSlowDown}>slower</button>
        <button on:click={handlePausePlay}>pause/play</button>
        <button on:click={handleSpeedUp}>faster</button>
    </div>
</main>

<style>
    .container {
        display: flex;
        justify-content: center;
        padding-top: 1rem
    }
</style>