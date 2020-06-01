import Node from "./node.js"; // OMEGALUL

// the gameboard holds all the nodes, can iterate to a new state, populate itself, tell if it's empty. it's half the game logic. it should be almost all the game logic but I
// made a dumb decision to get new node state in the node instead of in here and I don't have time to fix it.
function Gameboard(height, width) {
    this.height = height;
    this.width = width;
	this.matrix = [];

    // it took me like two days to realize canvases can't register clicks. oof. instead of my original idea to let the users set configurations, it's random. 
	this.randomlyPopulate = () => {
		for (let x = 0; x < width; x++) {
			this.matrix[x] = [];
	
			for (let y = 0; y < height; y++) {
				this.matrix[x][y] = new Node(Math.floor(Math.random() * Math.floor(4)), x, y,);
			}
        }
	}

    // TODO: after each iteration this should make sure the game isn't over, like if the grid doesn't have any live cells
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

    // an iteration is going over all the nodes for the current state and getting a new state for that node. after this is done we have to save the matrix in the svelte store. 
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

export default Gameboard;