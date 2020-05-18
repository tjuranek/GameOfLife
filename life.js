const gameboard = document.getElementById('gameboard');

const context = gameboard.getContext('2d');
context.scale(20, 20);

const makeGrid = (height, width) => {
	const grid = [];

	for (let y = 0; y < height; y++) {
		grid[y] = [];

		for (var x = 0; x < width; x++) {
			grid[y][x] = Math.floor(Math.random() * Math.floor(2));
		}
	}

	return grid;
};

const drawGrid = (grid) => {
	context.fillStyle = 'black';
	context.fillRect(0, 0, gameboard.width, gameboard.height);

	context.fillStyle = 'red';

	grid.forEach((row, y) => {
		row.forEach((value, x) => {
			if (value === 1) {
				context.fillRect(x, y, 1, 1);
			}
		});
	});
};

let counter = 0;
let interval = 100;
let lastTime = 0;

const run = (time = 0) => {
	const elapsed = time - lastTime;

	lastTime = time;
	counter += elapsed;

	console.log('counter: ' + counter);

	if (counter >= interval) {
		drawGrid(makeGrid(24, 24));

		counter = 0;
	}

	requestAnimationFrame(run);
};

drawGrid(makeGrid(24, 24));
run();
