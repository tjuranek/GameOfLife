const game = document.getElementById('gameboard');
const iterationCounter = document.getElementById('iterationCounter');

const context = game.getContext('2d');
context.scale(10, 10);

function Node(livesRemaining, x, y) {
	this.x = x;
	this.y = y;
	this.livesRemaining = livesRemaining;

	this.incrementLivesRemaining = (count) => {
		for (let i = 0; i < count; i++) {
			if (this.livesRemaining < 5) this.livesRemaining++;
		} 
	}

	this.decrementLivesRemaining = (count) => {
		for (let i = 0; i < count; i++) {
			if (this.livesRemaining > 0) this.livesRemaining--;
		}
	}

	this.getNextState = (matrix, height, width) => {
		const relativeNeighborPositions = [[-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1]];

		let liveNeighborCount = 0;

		relativeNeighborPositions.forEach(direction => {
			const x = this.x + direction[0];
			const y = this.y + direction[1];

			if (x >= 0 && y >= 0 && x < width && y < height) {
				if (matrix[x][y].livesRemaining > 0) liveNeighborCount++;
			}
		});

		if (this.livesRemaining > 0) {
			switch (liveNeighborCount) {
				case 0: case 1:
					this.decrementLivesRemaining(2);
					break;
				case 2: case 3: case 4:
					break;
				case 5: case 6: case 7:
					this.decrementLivesRemaining(3);
					break;
				case 7:
					this.incrementLivesRemaining(1);
					break;
				case 8:
					this.decrementLivesRemaining(5);
					break;
			}
		}
		else {
			switch (liveNeighborCount) {
				case 0: case 1: case 2: 
					break;
				case 3: case 4:
					this.incrementLivesRemaining(2)
					break;
				case 5: case 6:
					this.incrementLivesRemaining(1);
					break;
				case 7: case 8:
					break;
			}
		}

		return this;
	}
}

function Gameboard(height, width) {
	this.height = height;
	this.width = width;
	this.matrix = [];

	this.randomlyPopulate = () => {
		for (let x = 0; x < width; x++) {
			this.matrix[x] = [];
	
			for (let y = 0; y < height; y++) {
				this.matrix[x][y] = new Node(Math.floor(Math.random() * Math.floor(4)), x, y,);
			}
		}
	}

	this.checkHasLivesCells = () => {
		const hasLiveCells = false;

		for (let x = 0; x < width; x++) {
			for (let y = 0; y < height; y++) {
				if (this.matrix[x][y].livesRemaining > 0) {
					hasLiveCell = true;
					return hasLiveCells;
				}
			}
		}

		return hasLiveCells;
	}

	this.iterate = () => {
		const nextState = [...this.matrix];

		for (let x = 0; x < this.width; x++) {
			for (let y = 0; y < this.height; y++) {
				nextState[x][y] = this.matrix[x][y].getNextState(this.matrix, this.height, this.width);
			}
		}
		
		this.matrix = [...nextState];
	}
}

const drawGameboardOnCanvas = (canvas, gameboard) => {
	canvas.fillStyle = 'black';
	canvas.fillRect(0, 0, gameboard.width, gameboard.height);

	canvas.fillStyle = 'red';

	for (let x = 0; x < gameboard.width; x++) {
		for (let y = 0; y < gameboard.height; y++) {
			if (gameboard.matrix[x][y].livesRemaining > 0) {
				canvas.fillRect(x, y, 1, 1);
			}
		}
	}
}

let iterationCount = 0;
let iterationInterval = 10;

let lastRenderTime = 0;

let requestId;

const main = (time) => {
	requestId = undefined;

	const timeSinceLastRender = time - lastRenderTime;

	if (timeSinceLastRender > iterationInterval) {
		lastRenderTime = time;

		iterationCount++;

		gameboard.iterate();
		drawGameboardOnCanvas(context, gameboard);

		iterationCounter.innerText = iterationCount + ' iterations';
	}

	if (iterationCount < 100) {
		start();
	}
	else {
		stop();
	}
	
} 

const start = () => {
	if (!requestId) {
		requestId = requestAnimationFrame(main);
	}
}

const stop = () => {
	if (requestId) {
		cancelAnimationFrame(requestId);
		requestId = undefined;
	}
}

let gameboard = new Gameboard(96, 96);
gameboard.randomlyPopulate();

drawGameboardOnCanvas(context, gameboard);

start();
