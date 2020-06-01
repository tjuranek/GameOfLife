<script>
    import { iterationCount, iterationInterval } from "../store.js";
</script>

<main>
    <div class="container">
        <p>Iteration Count: {$iterationCount}</p>
        <p>Iteration Interval: {$iterationInterval} ms</p>
    </div>
</main>

<style>
    .container {
        text-align: center;
    }
</style>