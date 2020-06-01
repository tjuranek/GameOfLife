// the node is a cell in the grid. i should've named it cell but I thought it was really funny to have a file named node.js. 
// the cool thing here is they have a lives remaining. so not only did the rules change from conways game of life with neighbors, but each cells can be better than each other
function Node (livesRemaining, x, y) {
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
    
    // take in a matrix and determine the next state of the node given how many alive neighbors it has. most people realize that the gameboard should handle this.
    // most people realize this before the last day of the deadline.
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

        // cases for incrementing or decrementing lives from a node depending on if it's currently living and how many live neighbors there are
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

export default Node;