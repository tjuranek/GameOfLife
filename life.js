// get page elements
const game = document.getElementById('gameboard');
const iterationCounter = document.getElementById('iterationCounter');

// get canvas context and increase scale
const context = game.getContext('2d');
context.scale(3, 3);

// nodes represent a cell in the grid. they contain a lives remaining count and are only considered
// dead if their lives remaining is zero.
function Node(livesRemaining, x, y) {
	this.x = x;
	this.y = y;
	this.livesRemaining = livesRemaining;

	// never allow more than five health/lives to a single node
	this.incrementLivesRemaining = (count) => {
		for (let i = 0; i < count; i++) {
			if (this.livesRemaining < 5) this.livesRemaining++;
		} 
	}

	// never let the health go below zero
	this.decrementLivesRemaining = (count) => {
		for (let i = 0; i < count; i++) {
			if (this.livesRemaining > 0) this.livesRemaining--;
		}
	}

	// take in a matrix and determine the next state of the node given how many alive neighbors it has.
	// most people realize that the matrix should handle this. most people realize this before the last
	// day of the deadline.
	this.getNextState = (matrix, height, width) => {
		// there are eight potential neighbors and these are their positions relative to the node
		const relativeNeighborPositions = [[-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1]];

		let liveNeighborCount = 0;

		// get how many neightbors are live nodes
		relativeNeighborPositions.forEach(direction => {
			const x = this.x + direction[0];
			const y = this.y + direction[1];

			if (x >= 0 && y >= 0 && x < width && y < height) {
				if (matrix[x][y].livesRemaining > 0) liveNeighborCount++;
			}
		});

		// cases for incrementing or decrementing lives from a node depending on if it's currently
		// living and how many live neighbors there are
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

		// we need to return the whole node after we get the next state cause I wrote this poorly
		return this;
	}
}

// the gameboard holds the matrix of all the nodes. 
function Gameboard(height, width) {
	this.height = height;
	this.width = width;
	this.matrix = [];

	// it took me like two days to realize canvases can't register clicks. oof. instead of my original
	// idea to let the users set configurations, it's random. 
	this.randomlyPopulate = () => {
		for (let x = 0; x < width; x++) {
			this.matrix[x] = [];
	
			for (let y = 0; y < height; y++) {
				this.matrix[x][y] = new Node(Math.floor(Math.random() * Math.floor(4)), x, y,);
			}
		}
	}

	// TODO: implement an "end of game" with my stop method
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

	// an iteration is just going over all the nodes and getting new states from the current matrix state
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

// take the canvas context and gameboard and spit out on the canvas. red cells are the alive ones.
const drawGameboardOnCanvas = (canvas, gameboard) => {
	canvas.fillStyle = 'black';
	canvas.fillRect(0, 0, gameboard.width, gameboard.height);

	canvas.fillStyle = 'red';

	// i should've made a wrapper for looping over this all the time and running a passed function on 
	// each node.
	for (let x = 0; x < gameboard.width; x++) {
		for (let y = 0; y < gameboard.height; y++) {
			if (gameboard.matrix[x][y].livesRemaining > 0) {
				canvas.fillRect(x, y, 1, 1);
			}
		}
	}
}

// keep track of how many iterations have happened, gotta hit 1000+. the interval is the number of 
// milliseconds between each interval.
let iterationCount = 0;
let iterationInterval = 100;

// to keep track of if we should render a new iteration, we gotta keep track of the times that we 
// go over the main loop and the time that we last rendered a iteration
let lastFrameTime = 0;
let lastRenderTime = 0;

// this is for requestAnimationFrame, it's how we start and stop
let requestId;

// the main game loop that's always called by requestAnimationFrame which gives a timestamp
const main = (time) => {
	requestId = undefined;

	const timeSinceLastRender = time - lastRenderTime;

	// if it's time to render, reset render time counter, increase iteration count, iterate
	// the gameboard, draw the gameboard, and display the iteration count
	if (timeSinceLastRender > iterationInterval) {
		lastRenderTime = time;

		iterationCount++;

		gameboard.iterate();
		drawGameboardOnCanvas(context, gameboard);

		iterationCounter.innerText = iterationCount + ' iterations';
	}

	// TODO: have pause and play instead of going until an iteration number
	//iterationCount < 100 ? start() : stop();

	start();
} 

// handles starting the game loop
const start = () => {
	if (!requestId) {
		requestId = requestAnimationFrame(main);
	}
}

// handles stopping the game loop
const stop = () => {
	if (requestId) {
		cancelAnimationFrame(requestId);
		requestId = undefined;
	}
}

// declare a gameboard and randomly populate it
let gameboard = new Gameboard(180, 330);
gameboard.randomlyPopulate();

// diplay the first iteration
drawGameboardOnCanvas(context, gameboard);

// start the game
start();
