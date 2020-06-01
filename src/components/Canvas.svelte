<script>
    import { onMount } from 'svelte'; 
    import { matrix } from "../store.js";

    let canvas;
    let context;

    // this takes the matrix and spits it onto the canvas. cells are red if they're alive. #gobigred
    const drawGridOnCanvas = (matrix) => {
        context.fillStyle = 'black';
        context.fillRect(0, 0, 330, 180);

        context.fillStyle = 'red';

        for (let x = 0; x < 330; x++) {
            for (let y = 0; y < 180; y++) {
                if (matrix[x][y].livesRemaining > 0) {
                    context.fillRect(x, y, 1, 1);
                }
            }
        }
    }

    // the canvas binding is undefined until the component mounts. 
    onMount(() => {
        context = canvas.getContext('2d');
        context.scale(3, 3);

        // this subscribes to the matrix in store and runs drawOnCanvas every time it has a new value. gotta subscribe after the canvas context is defined though.
        matrix.subscribe(updatedMatrix => {
            drawGridOnCanvas(updatedMatrix);
        });
    });
</script>

<main>
    <div class="container">
        <canvas bind:this={canvas} width="990" height="540"></canvas>
    </div>
</main>

<style>
    .container {
        display: flex;
        justify-content: center;
    }
</style>