const gameboard = document.getElementById('gameboard');
const iterationCounter = document.getElementById('iterationCounter');

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

const drawGrid = () => {
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

const getNextState = () => {
	const tempGrid = [...grid];

	for (let y = 0; y < 24; y++) {
		for (let x = 0; x < 24; x++) {
			tempGrid[y][x] = getNewState(x, y, grid[y][x]) ? 1 : 0;
		}
	}
	grid = [...tempGrid];
};

const getAliveNeighborsCount = (x, y) => {
	const directions = [
		[-1, -1],
		[-1, 0],
		[-1, 1],
		[0, 1],
		[1, 1],
		[1, 0],
		[1, -1],
		[0, -1],
	];

	let count = 0;

	directions.forEach((direction) => {
		const nX = x + direction[0];
		const nY = y + direction[1];

		if (nX >= 0 && nY >= 0 && nX < 24 && nY < 24) {
			if (grid[nY][nX] !== 0) count++;
		}
	});
	return count;
};

const getNewState = (x, y, currentState) => {
	const count = getAliveNeighborsCount(x, y);

	/*
	Any live cell with fewer than two live neighbours dies, as if by underpopulation.
Any live cell with two or three live neighbours lives on to the next generation.
Any live cell with more than three live neighbours dies, as if by overpopulation.
Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.

These rules, which compare the behavior of the automaton to real life, can be condensed into the following:

Any live cell with two or three live neighbours survives.
Any dead cell with three live neighbours becomes a live cell.
All other live cells die in the next generation. Similarly, all other dead cells stay dead.
	*/
	if (currentState === 1) {
		if (2 > count || count >= 4) {
			return false;
		}

		return true;
	} else {
		return count === 3;
	}
};

let counter = 0;
let interval = 100;
let lastTime = 0;

let iterations = 1;

const run = (time = 0) => {
	const elapsed = time - lastTime;

	lastTime = time;
	counter += elapsed;

	if (counter >= interval) {
		iterations++;

		iterationCounter.innerText = iterations + ' iterations';

		getNextState();
		drawGrid(grid);

		counter = 0;
	}

	requestAnimationFrame(run);
};

let grid = makeGrid(24, 24);

drawGrid();

run();
