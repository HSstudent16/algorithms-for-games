// xxx HS16 :: KA has sadly retired the old API, and this program is only kept because it contains useful
// code demonstrations.

/**
 * The main program;  This library handles all graphics
 * and demonstrations, automatically linking canvses that
 * have a `data-theme` property.
 * 
 * Accepted themes are:
 *   "pacman"
 *   "battleship"
 *   "maze"
 *   "flowchart"
 * 
 * Commands for each theme are discussed in further
 * comments.
 */

//jshint esnext: true
(function main() {
  // Get the global scope, usually `window`
  let root = this,
  // Get the document object
    doc = root[["document"]];

  
  /**
   * Draws Pacman on a given rendering context
   */
  function drawPacman(x, y, _size, facing, openness, $ctx) {
    var o = openness * 0.1;
    $ctx.fillStyle = "yellow";
    $ctx.strokeStyle = "black";
    $ctx.beginPath();
    $ctx.moveTo(x + 0.5 * _size, y + 0.5 * _size);
    $ctx.ellipse(
      x + 0.5 * _size, y + 0.5 * _size,
      16, _size * 0.4, 0,
      /* Some hairy math to make his mouth move */
      (facing ? o + 1 : o) * Math.PI,
      (facing ? 3 - o : 2 - o) * Math.PI
    );
    $ctx.closePath();
    $ctx.fill();
    $ctx.stroke();
  }

  /**
   * Draws blink (the ghost) on a given rendering context
   */
  function drawBlinky(x, y, s, $ctx) {
    $ctx.fillStyle = "red";
    $ctx.strokeStyle = "black";
    $ctx.beginPath();
    $ctx.moveTo(x + s * 0.1, y + s * 0.5);
    // Nice, round head
    $ctx.arcTo(x + s * 0.1, y + s * 0.1, x + s * 0.5, y + s * 0.1, s * 0.4);
    $ctx.arcTo(x + s * 0.9, y + s * 0.1, x + s * 0.9, y + s * 0.5, s * 0.4);
    // Shaggy feet
    $ctx.lineTo(x + s * 0.9, y + s * 0.9);
    $ctx.lineTo(x + s * 0.8, y + s * 0.85);
    $ctx.lineTo(x + s * 0.7, y + s * 0.9);
    $ctx.lineTo(x + s * 0.6, y + s * 0.85);
    $ctx.lineTo(x + s * 0.5, y + s * 0.9);
    $ctx.lineTo(x + s * 0.4, y + s * 0.85);
    $ctx.lineTo(x + s * 0.3, y + s * 0.9);
    $ctx.lineTo(x + s * 0.2, y + s * 0.85);
    $ctx.lineTo(x + s * 0.1, y + s * 0.9);
    $ctx.closePath();
    $ctx.fill();
    $ctx.stroke();

    // Two eyes
    $ctx.fillStyle = "white";
    $ctx.beginPath();
    $ctx.ellipse(x + s * 0.35, y + s * 0.4, s * 0.1, s * 0.1, 0, 0, Math.PI * 2);
    $ctx.fill();
    $ctx.beginPath();
    $ctx.ellipse(x + s * 0.65, y + s * 0.4, s * 0.1, s * 0.1, 0, 0, Math.PI * 2);
    $ctx.fill();

    $ctx.fillStyle = "black";
    $ctx.beginPath();
    $ctx.ellipse(x + s * 0.35, y + s * 0.4, s * 0.05, s * 0.05, 0, 0, Math.PI * 2);
    $ctx.fill();
    $ctx.beginPath();
    $ctx.ellipse(x + s * 0.65, y + s * 0.4, s * 0.05, s * 0.05, 0, 0, Math.PI * 2);
    $ctx.fill();
  }

  /**
   * The demo code for Pacman.  This is 99% example
   * code from the tutorial.  It even has the original 
   * comments!
   * 
   * @param {CanvasRenderingContext2D} $ctx Destination context
   */
  function pacmanLoop($ctx) {
    // Link the canvas and prep for interaction
    let lib = new root.CnvHelper($ctx.canvas, $ctx);

    /*
      The first steps described was to look in
      every direction. Here is every direction:
    */
    var directions = [
      [0, 1],  // Down
      [0, -1], // Up
      [-1, 0], // Left
      [1, 0]   // Right
    ];

    /*
      Next is a bitmap that represents Pacman's
      world.  Every pound (#) symbol represents a
      block.
    */
    var bitmap = [
      "###############",
      "#             #",
      "# # ## # ## # #",
      "# #         # #",
      "#    ## ##    #",
      "# ## #   # ## #",
      "# #  #####  # #",
      "#             #",
      "# # ####### # #",
      "# #         # #",
      "# # ##   ## # #",
      "#    #   #    #",
      "# #  #   #  # #",
      "# ## # # # ## #",
      "#             #",
      "###############"
    ];


    /*
      Here are the exact coordinates of Pacman (or
      player) and Blinky.
    */
    var playerPos = [7, 10];
    var blinkyPos = [7, 5];

    /*
      These store the coordinates Pacman and Blinky
      are moving to.  They are always rounded to whole
      numbers.
    */
    var iPos = [7, 10];
    var bPos = [7, 5];


    /*
      These keep track of which way Pacman and Blinky
      are moving
    */
    var playerDir = -1;
    var blinkyDir = -1;

    /*
      To find the fastest route to Pacman, Blinky
      has to leave a trail of numbers.  Rather
      than cluttering up the original bitmap,
      however, Blinky gets his own copy.
    */
    var blinkysMap = [];

    /*
      Fill Blink's map with placeholder values
    */
    for (var i = 0; i < bitmap.length; i++) {
      blinkysMap.push([]);
      blinkysMap[i].length = bitmap[i].length;
      blinkysMap[i].fill(-1);
    }


    /*
      This function limits Blink's number
      placement to spaces that aren't blocks.

      'x' and 'y' are coordinates for 'bitmap'
    */
    function isBlank(x, y) {
      return bitmap[y][x] === " ";
    }

    /*
      And now, the backbone of the code: the BFS
      algorithm itself!

      This algorithm is used recursively, which
      means the function calls itself until its
      job is done.

      'x' and 'y' are coordinates for 'bitmap', and
      'num' is the number to be placed.
    */
    function pathfindBFS(x, y) {
      // A queue is a term that means "list of things
      // to do", at least to a programmer.  Here, the
      // list is of places where a number was put.

      // Every item in the queue has an x-coordinate,
      // y-coordinate, and a number.
      var queue = [[x, y, 0]];

      // Empty out the last search's values
      for (var i = 0; i < blinkysMap.length; i++) {
        blinkysMap[i].fill(-1);
      }

      // Continue searching until there is no place
      // left to look.
      do {

        // Remove the last item from the queue, and
        // store it.
        var lastItem = queue.shift();

        // Remember the x and y coordinates of that
        // item, and its number.
        var tx = lastItem[0],
          ty = lastItem[1],
          tnum = lastItem[2];

        // If that item does not sit on the world,
        // ignore it.
        if (!isBlank(tx, ty) ||
          blinkysMap[ty][tx] >= 0) {
          continue;
        }

        // Leave a trail of numbers
        blinkysMap[ty][tx] = tnum;

        // Look in every direction by adding each
        // direction to the queue.
        for (var i = 0; i < 4; i++) {
          queue.push([tx + directions[i][0], ty + directions[i][1], tnum + 1]);
        }

        // Repeat until there is nothing left in the
        // queue
      } while (queue.length > 0);

    }

    /*
      And here is where Blinky's movement is
      handled:
    */
    function moveBlinky() {
      // Round off the coordinates, so they work
      // as indexes.
      var at_x = blinkyPos[0] | 0,
        at_y = blinkyPos[1] | 0,
        to_x = 0,
        to_y = 0;

      // If Blinky has arrived at the next square
      if (Math.abs(blinkyPos[0] - bPos[0]) < 0.1 &&
        Math.abs(blinkyPos[1] - bPos[1]) < 0.1) {

        // Make sure his position becomes an integer
        blinkyPos = bPos.slice();

        // Update these variables, too
        at_x = bPos[0];
        at_y = bPos[1];

        // Find what number Blinky is sitting on
        var blinkyNum = blinkysMap[at_y][at_x];

        // Assume Blinky cannot go anywhere
        blinkyDir = -1;

        // Look in every direction for a number
        // smaller than the one Blinky is sitting
        // on.
        for (var i = 0; i < 4; i++) {
          // Where does that direction go?
          to_x = at_x + directions[i][0];
          to_y = at_y + directions[i][1];

          // What number sits there?
          var num = blinkysMap[to_y][to_x];

          // If that number is less than the one
          // Blinky is sitting on (and if it's not
          // the placeholder -1) make that square
          // the next one.
          if (num === blinkyNum - 1 && num >= 0) {
            bPos[0] = to_x;
            bPos[1] = to_y;
            blinkyDir = i;
            break;
          }
        }
      }

      // If there is nowhere for Blinky to go,
      // go nowhere.
      if (blinkyDir < 0) {
        return;
      }

      // Otherwise, move Blinky in the right direction.
      blinkyPos[0] += directions[blinkyDir][0] * 0.1;
      blinkyPos[1] += directions[blinkyDir][1] * 0.1;
    }

    /*
      Move the player based on keyboard input
    */
    function movePlayer() {
      // Round off the coordinates, so they work
      // as indexes.
      var at_x = playerPos[0] | 0,
        at_y = playerPos[1] | 0,
        to_x = 0,
        to_y = 0;

      // If Pacman has arrived at the next square
      if (Math.abs(playerPos[0] - iPos[0]) < 0.1 &&
        Math.abs(playerPos[1] - iPos[1]) < 0.1) {

        // Make sure his position becomes an integer
        playerPos = iPos.slice();

        // Update these variables, too
        at_x = iPos[0];
        at_y = iPos[1];

        // Run a BFS search for Blinky.  This is only
        // done when the player's position changes,
        // because that's really the only time it
        // needs to be done.
        pathfindBFS(at_x, at_y);

        // Change the player's direction if the
        // WASD keys are pressed.
        switch (lib.keyCode) {
          // Down, or "s"
          case 83:
          case 40:
            to_y = at_y + directions[0][1];
            to_x = at_x + directions[0][0];
            if (isBlank(to_x, to_y)) {
              playerDir = 0;
            }
            break;
          // Up, or "w"
          case 87:
          case 38:
            to_y = at_y + directions[1][1];
            to_x = at_x + directions[1][0];
            if (isBlank(to_x, to_y)) {
              playerDir = 1;
            }
            break;
          // Left, or "a"
          case 65:
          case 37:
            to_y = at_y + directions[2][1];
            to_x = at_x + directions[2][0];
            if (isBlank(to_x, to_y)) {
              playerDir = 2;
            }
            break;
          // Right, or "d"
          case 68:
          case 39:
            to_y = at_y + directions[3][1];
            to_x = at_x + directions[3][0];
            if (isBlank(to_x, to_y)) {
              playerDir = 3;
            }
            break;
        }

        // If the key press enables Pacman to not
        // hit a wall, update the player's next square
        // and direction.
        if (playerDir >= 0) {
          to_x = iPos[0] + directions[playerDir][0];
          to_y = iPos[1] + directions[playerDir][1];

          if (!isBlank(to_x, to_y)) {
            playerDir = -1;
          } else {
            iPos[0] = to_x;
            iPos[1] = to_y;
          }
        }
      }

      // If there is nowhere for Pacman to go,
      // go nowhere.
      if (playerDir < 0) {
        return;
      }

      // Otherwise, move Pacman in the right direction.
      playerPos[0] += directions[playerDir][0] * 0.1;
      playerPos[1] += directions[playerDir][1] * 0.1;
    }

    /*
      drawLevel, drawblinky, and drawPlayer are not
      defined in this example.  They exist for
      demonstration purposes.
    */
    lib.draw = function () {
      $ctx.fillStyle = "black";
      $ctx.fillRect(0, 0, lib.cnv.width, lib.cnv.height);
      // Update everything
      moveBlinky();
      movePlayer();

      // Display everything
      var x, y = bitmap.length;
      $ctx.fillStyle = "blue";
      while (y--) {
        x = bitmap[y].length;
        while (x--) {
          if (bitmap[y][x] === "#") {
            $ctx.fillRect(40 * x, 40 * y, 40, 40);
          }
        }
      }
      
      // Draw Blinky & pacman
      drawBlinky(
        blinkyPos[0] * 40,
        blinkyPos[1] * 40,
        40,
        $ctx
      );
      drawPacman(
        playerPos[0] * 40,
        playerPos[1] * 40,
        40,
        1 ^ (Math.abs(playerDir) & 1),
        Math.abs(Math.cos(Date.now() / 100)),
        $ctx
      );

    };
  }


  /**
   * Draws a probability field on a given context.
   */
  function renderBSvisual(data, ships, $ctx) {
    // Declare all needed variables.  I've been using c++
    // too much :P
    let x, y, i, h, s = ships.length, l, j;

    // Set the fill based on how many ships are left.
    $ctx.fillStyle = 'rgba(0, 255, 0, ' + 0.04 * (6 - ships.length) + ')';

    // For each square,
    for (y = 0; y < 10; y++) {
      for (x = 0; x < 10; x++) {
        h = data[y][x];

        // If that square is a hit, draw a white
        // space and move on.
        if (h === 1) {
          $ctx.fillStyle = "white";
          $ctx.fillRect(x * 20, y * 20, 20, 20);
          $ctx.fillStyle = 'rgba(0, 255, 0, ' + 0.04 * (6 - ships.length) + ')';
          continue;
        }

        // If that square is a miss, move on.
        if (h === 6) {
          continue;
        }

        // Check for the overlap of all the ships
        for (i = 0; i < s; i++) {
          // The length of that ship
          l = ships[i];

          // If a ship of length l fits inside the
          // right edge of the grid
          if (x + l <= 10) {
            h = 1;
            // And the ship would not overlap a hit or a miss
            for (j = 0; j < l; j++) {
              if (data[y][x + j] === 1 || data[y][x + j] === 6) {
                h = 0;
                break;
              }
            }
            // Draw a semi-transparent rectangle to represent
            // a the probability increase
            if (h) {
              $ctx.fillRect(x * 20, y * 20, l * 20, 20);
            }
          }

          // If a ship of length l fits within the lower
          // confines of the grid
          if (y + l <= 10) {
            h = 1;
            // Look for overlap
            for (j = 0; j < l; j++) {
              if (data[y + j][x] === 1 || data[y + j][x] === 6) {
                h = 0;
                break;
              }
            }
            // Draw a semi-transparent rectangle to represent
            // a the probability increase
            if (h) {
              $ctx.fillRect(x * 20, y * 20, 20, l * 20);
            }
          }
        }
      }
    }
  }

  /**
   * A function that exchanges ship placement & shot coords
   * for an actual bitmap.  Used for compressing visualization
   * commands.
   */
   function inflateGrid(inShips, inShots) {
    // The bitmap that is sent out.
    let outArr = [],
    // Parse the given coordinates
      ships = inShips.split('-'),
      shots = inShots.split('-'),
    // Preliminary vars.
      i, j, x, y, v, o;
    
    // First, fill up that skinny array.
    for (i = 0; i < 10; i++) {
      outArr[i] = [];
      outArr[i].length = 10;
      outArr[i].fill(0);
    }

    // Then, place ships on it.
    for (i = 0; i < ships.length; i++) {
      x = parseInt(ships[i][0], 10);
      y = parseInt(ships[i][1], 10);
      o = parseInt(ships[i][2], 10);
      v = parseInt(ships[i][3], 10);
      for (j = 0; j < v; j++) {
        outArr[y + o * j][x + j - o * j] = v;
      }
    }

    // Then place shots as directed.  Even
    // the result of the shot must be given.
    for (i = 0; i < shots.length; i++) {
      x = parseInt(shots[i][0], 10);
      y = parseInt(shots[i][1], 10);
      outArr[y][x] = parseInt(shots[i][2], 10);
    }
    return outArr;
  }

  /**
   * The demo code for Battleship.  About 70% of this code is from
   * the example.  Some things were omitted for brevity.
   * 
   * @param {CanvasRenderingContext2D} $ctx Destination context
   */
  function battleshipLoop($ctx) {
    // Link the canvas
    let lib = new root.CnvHelper($ctx.canvas, $ctx);

    // Some user interface details
    let viewProbs = false;
    let orientation = 0;
    let timer = 0;
    let initted = false;
    
    // The message log.  Only holds 3
    // lines.
    let messages;
    
    // Size to fit.
    lib.resize(490, 370);

    // The AI's and the player's grids, condensed.
    var AIgrid = [[],[],[],[],[],[],[],[],[],[]];
    var playerGrid = [[],[],[],[],[],[],[],[],[],[]];

    // These will be automatically be filled out by
    // `resetGame` and `loadShips`
    var AIships, playerShips;
    var AIcoords = [], playerCoords = [];

    // The AI's list of places to shoot at, after a hit 
    // is made.
    var firingQueue = [];

    // Turn management details
    var nextMove = [0, 0];
    var turn = "player";
    var winner = "none";

    // The AI's probability field
    var probs = [[], [], [], [], [], [], [], [], [], []];
    // A list of directions
    var dirs = [[0, +1], [0, -1], [-1, 0], [+1, 0]];

    /*
      Does a square have a "hit" or "miss" on it?
    */
    function isntEmpty(x, y) {
      return playerGrid[y][x] === 1 || playerGrid[y][x] === 6;
    }

    /*
      Finds, for one square, the probabilities of
      the player's remaining ships touching that square
    */
    function getSquareProbs(x, y) {
      var len = playerShips.length;
      // Look at every remaining ship
      for (var i = 0; i < len; i++) {
        // Get the size
        var shipSize = playerShips[i];
        var valid = true;
        var j;
        // If the ship fits in the right edge
        if (x + shipSize <= 10) {
          // Confirm possibility of existence
          for (j = 0; j < shipSize; j++) {
            if (isntEmpty(x + j, y)) {
              valid = false;
              break;
            }
          }
          // Update probability field
          if (valid) {
            for (j = 0; j < shipSize; j++) {
              probs[y][x + j]++;
            }
          }
        }
        // If the ship fits in the bottom edge
        if (y + shipSize <= 10) {
          valid = true;
          // Confirm possibility of existence
          for (j = 0; j < shipSize; j++) {
            if (isntEmpty(x, y + j)) {
              valid = false;
              break;
            }
          }
          // Update probability field
          if (valid) {
            for (j = 0; j < shipSize; j++) {
              probs[y + j][x]++;
            }
          }
        }
      }
    }

    /*
      Resets the probability field, then calls `getSquareProbs`
      for each square.
    */
    function getProbs() {
      var x, y;
      // Reset field
      for (x = 0; x < 10; x++) {
        for (y = 0; y < 10; y++) {
          probs[y][x] = 0;
        }
      }
      // Load probs
      for (y = 0; y < 10; y++) {
        for (x = 0; x < 10; x++) {
          if (isntEmpty(x, y)) {
            continue;
          }
          getSquareProbs(x, y);
        }
      }
    }

    /*
      Run the AI, and determine what `nextMove` will be.
    */
    function handleAIturn() {
      // If there are ships to sink, sink them!
      if (firingQueue.length > 0) {
        nextMove = firingQueue.pop();
        // Don't fire at the same square twice
        if (isntEmpty(nextMove[0], nextMove[1])) {
          return handleAIturn();
        }
      
      // Otherwise, use the probability field to hunt
      // down ships.
      } else {
        // Load probability field
        getProbs();

        // Get the square with the highest probability.
        var highest = 1;
        for (var y = 0; y < 10; y++) {
          for (var x = y & 1; x < 10; x += 2) {
            var prob = probs[y][x];
            // Simple boolean logic
            if (prob > highest) {
              highest = prob;
              nextMove = [x, y];

            // A little randomization for fun.
            } else if (prob === highest && Math.random() < 0.5) {
              highest = prob;
              nextMove = [x, y];
            }
          } 
        }
      }
    }

    /*
      Called when the AI makes a hit;  This function fills
      up the `firingQueue` with more potential hits.
    */
    function trackShip(x, y) {
      // Preliminary vars
      var i, dx, dy, b;

      // For each direction
      for (var i = 4; i--;) {
        dx = x + dirs[i][0];
        dy = y + dirs[i][1];

        // Reality check
        if (dx < 0 || dy < 0 || dx > 9 || dy > 9) {
          continue;
        }

        // Add to queue
        if (!isntEmpty(dx, dy)) {
          firingQueue.push([dx, dy]);
        }
      }
    }

    /*
      Handle shot firing, hit detection, sinking, and
      messages.
    */
    function fireShot() {
      // The next move
      var x = nextMove[0],
          y = nextMove[1],
      // Values to be filled later
        formerItem,
        alignment,
        i,
      // Hit ship specs.
        shipSize, shipX, shipY, hit = false;
      
      // The player fired, so update the AI's
      // grid.
      if (turn === "player") {
        formerItem = AIgrid[y][x];

        // Log hits and misses
        if (formerItem === 0) {
          AIgrid[y][x] = 6;
        } else {
          AIgrid[y][x] = 1;
          hit = true;
        }

        // Generate move log entry
        messages.shift();
        // `(x + 10).toString(32).toUpperCase()` gives letter for the coordinates
        messages.push("Player fired at " + (x + 10).toString(32).toUpperCase() + (y + 1) + " : " + (hit ? "HIT" : "MISS"));
        
        // Look for hit ships
        for (i = 0; i < AIcoords.length; i++) {
          shipSize = AIships[i];
          shipX = AIcoords[i][0];
          shipY = AIcoords[i][1];
          alignment = AIcoords[i][2];

          // Deplete "life" on hit
          if (alignment === 1) {
            if (y === shipY && x >= shipX && x < shipX + shipSize) {
              AIcoords[i][3]--;
              break;
            }
          } else if (x === shipX && y >= shipY && y < shipY + shipSize) {
            AIcoords[i][3]--;
            break;
          }
        }
      }
      // The AI fired, so update the player's grid
      else {
        formerItem = playerGrid[y][x];

        // Mark hits & misses
        if (formerItem === 0) {
          playerGrid[y][x] = 6;
        } else {
          playerGrid[y][x] = 1;
          // Fill the `firingQueue` upon hit
          trackShip(x, y);
          hit = true;
        }

        // Log the message
        messages.shift();
        messages.push("AI fired at " + (x + 10).toString(32).toUpperCase() + (y + 1) + " : " + (hit ? "HIT" : "MISS"));

        // Look for hit ships
        for (i = 0; i < playerCoords.length; i++) {
          shipSize = playerShips[i];
          shipX = playerCoords[i][0];
          shipY = playerCoords[i][1];
          alignment = playerCoords[i][2];

          if (alignment === 1) {
            if (y === shipY && x >= shipX && x < shipX + shipSize) {
              playerCoords[i][3]--;
              break;
            }
          } else if (x === shipX && y >= shipY && y < shipY + shipSize) {
            playerCoords[i][3]--;
            break;
          }
        }
      }
    }


    /*
      This function is not in the example code, save its
      mention in the draw function.  It draws the UI.
    */
    function drawInterface() {
      // A few preliminary vars
      let x, y, e, f;

      // Draw the background
      $ctx.fillStyle = "#333";
      $ctx.fillRect(0, 0, lib.width, lib.height);
      $ctx.strokeStyle = "grey";

      // If requested, draw the probability fields.
      if (viewProbs) {
        $ctx.translate(30, 30);
        renderBSvisual(playerGrid, playerShips, $ctx);
        $ctx.translate(230, 0);
        renderBSvisual(AIgrid, AIships, $ctx);
        $ctx.resetTransform();
      
      // Otherwise, draw the player's ship layout.
      } else {
        $ctx.fillStyle = "#070";
        for (e = playerCoords.length; e--;) {
          x = playerCoords[e][0];
          y = playerCoords[e][1];
          f = playerShips[e];

          // Orientation
          if (playerCoords[e][2]) {
            $ctx.fillRect(30 + x * 20, 30 + y * 20, f * 20, 20);
          } else {
            $ctx.fillRect(30 + x * 20, 30 + y * 20, 20, f * 20);
          }
        }
      }

      // Draw both grids.
      $ctx.fillStyle = "#0f0";
      $ctx.font = "18px monospace";
      for (y = 0; y < 10; y++) {
        // Draw the coordinate labels, A-J and 1-9
        $ctx.fillText((y + 1).toString().padStart(2), 5, 45 + y * 20);
        $ctx.fillText((y + 1).toString(), 465, 45 + y * 20);
        $ctx.fillText((y + 10).toString(32).toUpperCase(), 35 + y * 20, 25);
        $ctx.fillText((y + 10).toString(32).toUpperCase(), 265 + y * 20, 25);

        // Draw each grid cell.
        for (x = 0; x < 10; x++) {
          e = playerGrid[y][x];
          f = AIgrid[y][x];

          // Draw the player's grid
          $ctx.strokeRect(30 + x * 20, 30 + y * 20, 20, 20);
          // Draw the AI's grid
          $ctx.strokeRect(260 + x * 20, 30 + y * 20, 20, 20);

          // If the player has a marker on that spot, draw
          // a marker
          if (e === 1) {
            // Hit gets a square
            $ctx.fillRect(32 + x * 20, 32 + y * 20, 16, 16);
          } else if (e === 6) {
            // Miss gets a dot
            $ctx.beginPath();
            $ctx.arc(40 + x * 20, 40 + y * 20, 5, 0, Math.TWO_PI);
            $ctx.fill();
          }

          // Draw markers for the AI's grid
          if (f === 1) {
            $ctx.fillRect(262 + x * 20, 32 + y * 20, 16, 16);
          } else if (f === 6) {
            $ctx.beginPath();
            $ctx.arc(270 + x * 20, 40 + y * 20, 5, 0, Math.TWO_PI);
            $ctx.fill();
          }
        }
      }

      // Draw the message log
      $ctx.font = "15px monospace";
      $ctx.fillStyle = "black";
      $ctx.fillRect(30, 250, 430, 80);
      $ctx.fillStyle = "#0f0";
      for (e = messages.length; e--;) {
        $ctx.fillText(messages[e], 40, 270 + e * 23);
      }

      // If the player clicks in the log during ship placement,
      if (lib.clicked && lib.mouseX > 30 && lib.mouseX < 460 && !initted) {
        // Change the default orientation OR...
        if (lib.mouseY > 273 && lib.mouseY < 296) {
          orientation ^= 1;
        
        // Remove the last placed ship
        } else if (lib.mouseY > 296 && lib.mouseY < 319 && playerCoords.length > 0) {
          let t = playerCoords.pop();
          for (e = 0; e < t[3]; e++) {
            playerGrid[e - t[2] * e + t[1]][t[2] * e + t[0]] = 0;
          }
        }
      }

      // Draw the "Show Probabilities" button
      if (initted) {
        $ctx.fillStyle = "#aaa";
      } else {
        $ctx.fillStyle = "#888";
      }
      $ctx.fillRect(30, 330, 430, 20);
      $ctx.fillStyle = "#333";
      $ctx.fillText("Show probabilities", 170, 345);

      // Handle clicks on said button
      if (lib.clicked && initted && lib.mouseX > 30 && lib.mouseX < 460 && lib.mouseY > 330 && lib.mouseY < 350) {
        viewProbs = !viewProbs;
      }
    }

    /*
      Resets all the variables that need resetting,
      thus starting over the game.  This function
      is also called to initialize some variables.
    */
    function resetGame() {
      AIcoords.length = 0;
      AIships = [5, 4, 3, 3, 2];
      playerShips = [5, 4, 3, 3, 2];
      playerCoords.length = 0;
      firingQueue.length = 0;
      initted = false;
      winner = "none";
      turn = "player";
      for (var i = 0; i < 10; i++) {
        AIgrid[i].length = 10;
        AIgrid[i].fill(0);
        playerGrid[i].length = 10;
        playerGrid[i].fill(0);
      }
      messages = [
        "Click on the left grid to place your ships.",
        "Click HERE to change the orientation",
        "Click HERE to unplace a ship"
      ];
      viewProbs = false;
    }

    /*
      Returns whether the player clicked on the AI's grid to
      fire a shot.
    */
    function playerHasInput() {
      if (lib.clicked && lib.mouseY > 30 && lib.mouseX > 260 && lib.mouseY < 230 && lib.mouseX < 460) {
        return true;
      }
      return false;
    }

    /*
      Returns the computed coordinates, relative to the AI's
      grid, of the mouse.
    */
    function getPlayerCoords() {
      return [(lib.mouseX - 260) * 0.05 | 0, (lib.mouseY - 30) * 0.05 | 0];
    }

    /*
      Handles ship loading for the AI (randomized) and the
      player.
    */
    function loadShips() {
      // Already loaded?  Skip this step.
      if (initted) {
        return true;
      }

      // Preliminary vars for ship placement
      let forced, failed;
      let x, y, o, l, j;

      // Place 5 ships for the AI
      while (AIcoords.length < 5) {
        // Get the appropriate length, 
        // and make up some random coordinates.
        l = AIships[AIcoords.length];
        x = Math.random() * 10 | 0;
        y = Math.random() * 10 | 0;

        // The ship could be on a valid square,
        // and the orientation will probably be
        // forced.
        forced = true;
        failed = false;

        // If the ship must be vertical
        if (10 - x < l) {
          // bottom-right corner failsafe
          if (10 - y < l) {
            continue;
          }
          o = 0;

        // If the ship must be horizontal
        } else if (10 - y < l) {
          o = 1;

        // If neither, then the orientation is random.
        } else {
          forced = false;
          o = Math.random() * 2 | 0;
        }

        // Check for other ships.  Ships must NEVER
        // overlap each other.
        for (j = 0; j < l; j++) {
          // If they do, then fail the position.
          if (AIgrid[y + j - o * j][x + o * j] !== 0) {
            failed = true;
            break;
          }
        }

        // But wait!  There is hope for a failed ship
        // if its orientation was random
        if (failed && !forced) {
          // Swap the orientation and check again.
          o = 1 - o;
          failed = false;
          for (j = 0; j < l; j++) {            
            if (AIgrid[y + j - o * j][x + o * j] !== 0) {
              failed = true;
              break;
            }
          }
        }

        // If it fails a second time, then get new
        // coordinates.  The ship simply cannot exist
        // here.
        if (failed) {
          continue;
        }

        // If it did not fail, then place the ship
        for (j = 0; j < l; j++) {
          AIgrid[y + j - o * j][x + o * j] = l;
        }

        // And add its placement data to the coords array
        AIcoords.push([x, y, o, l]);
      }

      // If the player has placed 5 ships, loading is done.
      // Give instructions for firing.
      if (playerCoords.length >= 5) {
        initted = true;
        messages.length = 0;
        messages.push("Click anywhere on the right grid to fire.");
        messages.push("Click the button beneath the message box");
        messages.push("  to view the probability \"cloud\"");
        return true;
      }

      // If the player did not place a ship, then do nothing.
      if (lib.mouseX < 30 || lib.mouseX > 230 || lib.mouseY < 30 || lib.mouseY > 230) {
        return false;
      }
      
      if (!lib.clicked) {
          return false;
      }

      // Get the mouse's coordinates, relative to the player's grid
      x = (lib.mouseX - 30) * 0.05 | 0;
      y = (lib.mouseY - 30) * 0.05 | 0;

      // Find the length of the next ship to place
      l = playerShips[playerCoords.length];
      forced = true;
      failed = false;

      // The same test the AI performed, only
      // the orientation is not randomized.
      if (10 - x < l) {
        // bottom-right corner failsafe
        if (10 - y < l) {
          return false;
        }
        o = 0;
      } else if (10 - y < l) {
        o = 1;
      } else {
        forced = false;
        o = orientation;
      }

      // Check for overlap
      for (j = 0; j < l; j++) {
        if (playerGrid[y + j - o * j][x + o * j] !== 0) {
          failed = true;
          break;
        }
      }

      // If overlap is detected,
      // check the other orientation
      if (failed && !forced) {
        o = 1 - o;
        failed = false;
        for (j = 0; j < l; j++) {
          if (playerGrid[y + j - o * j][x + o * j] !== 0) {
            failed = true;
            break;
          }
        }
      }

      // If the coordinate is a bad one,
      // then wait for the user to try again.
      if (failed) {
        return false;
      }

      // Otherwise, place the ship.
      for (j = 0; j < l; j++) {
        playerGrid[y + j - o * j][x + o * j] = l;
      }
      playerCoords.push([x, y, o, l]);
      return initted;
    }

    /*
      Draws a "win" message, and provides a button for resetting
      the game.
    */
    function drawWinScreen() {
      $ctx.fillStyle = "#333";
      $ctx.fillRect(0, 0, lib.width, lib.height);
      $ctx.fillStyle = "#0f0";
      $ctx.font = "48px monospace";
      // Who won, anyway?
      if (winner === "player") {
        $ctx.fillText("You won!", 135, 120);
      } else {
        $ctx.fillText("You lost!", 127, 120);
      }
      $ctx.fillStyle = "#aaa";
      $ctx.fillRect(150, 200, 190, 50);
      $ctx.fillStyle = "#333";
      $ctx.font = "24px monospace";
      $ctx.fillText("Play again?", 165, 233);

      // If the button is clicked, reset.
      if (lib.mouseX > 150 && lib.mouseY > 200 && lib.mouseX < 340 && lib.mouseY < 250 && lib.clicked) {
        resetGame();
      }
    }

    // Initialize the game
    resetGame ();

    /*
      The main loop;  handles turns, input and winning
    */
    lib.draw = function () {
      var i, b;
      
      // The win screen has top priority.
      if (winner !== "none") {
        drawWinScreen();
        return;
      }

      // Draw the UI.  It is used for placing & firing.
      drawInterface();

      // Ship loading has next priority
      if (!loadShips()) {
        return;
      }

      // If its the player's turn...
      if (turn === "player") {
        // Await input
        if (!playerHasInput()) {
          return;
        }

        // Validate input
        nextMove = getPlayerCoords();
        b = AIgrid[nextMove[1]][nextMove[0]];
        if (b === 6 || b === 1) {
          return;
        }

        // The player clicked!  No going back.
        fireShot();

        // Look for hit ships
        for (i = AIships.length; i--;) {
          if (AIcoords[i][3] <= 0) {
            messages.shift();
            messages.push("Ship of length " + AIships[i] + " sunk!");
            AIships.splice(i, 1);
            AIcoords.splice(i, 1);
            break;
          }
        }

        // Swap turns, and set a timer so the AI doesn't
        // fire instantly.
        turn = "ai";
        timer = 100;
      
      // If the AI must fire
      } else {
        // Wait for the timer to expire.
        if (timer --> 0) {
          return;
        }

        // Fire the most logical shot.
        handleAIturn();
        fireShot();

        // Look for sunk ships
        for (i = playerShips.length; i--;) {
          if (playerCoords[i][3] <= 0) {
            messages.shift();
            messages.push("Ship of length " + playerShips[i] + " sunk!");
            playerShips.splice(i, 1);
            playerCoords.splice(i, 1);
            break;
          }
        }

        // Pass the ball back to the player
        turn = "player";
      }

      // Check for a winner.
      if (AIships.length <= 0) {
        winner = "player";
      } else if (playerShips.length <= 0) {
        winner = "AI";
      }
    };
  }
  
  
  /**
   * The maze generation demo.  About 60% of the code is from
   * the example.  A lot was added to make the user interface,
   * and to allow animation.
   * 
   * @param {CanvasRenderingContext2D} $ctx Destination context
   */
  function mazeLoop($ctx) {
    // Link the library.
    let lib = new root.CnvHelper($ctx.canvas, $ctx);
    // Globalize the DFS variables, for animation
    let x, y, number, animate = false;

    // Some UI vars
    let mouseIsPressed = false;
    let drawing = true;
    let roomCount = 2;
    let frameCount = 0;
    let frameSkip = 2;

    // Make it fit
    lib.resize(400, 500);

    // The example code explains these rather nicely ;)
    var START_X = 1;
    var START_Y = 1;
    var GRID_WIDTH = 21;
    var GRID_HEIGHT = 21;

    // This stuff gets filled out whenever a maze is generated.
    var rooms = [];
    var grid = [];

    // The same directions, multiplied by 2.
    var dirs = [[-2, 0], [+2, 0], [0, -2], [0, +2]];

    /*
      Returns whether a coordinate fits in the grid
    */
    function cantGo(x, y) {
      return x < 0 || y < 0 || y >= GRID_HEIGHT || x >= GRID_WIDTH;
    }

    /*
      Sets/resets the grid for a new maze
    */
    function primeGrid() {
      grid.length = 0;
      for (var i = 0; i < GRID_HEIGHT; i++) {
        grid.push([]);
        grid[i].length = GRID_WIDTH;
        grid[i].fill(0);
      }
    }

    /*
      Adds control values to the grid, based on
      an input "room" object
    */
    function placeRoom(room) {
      // Confine the room to within `grid`
      var startX = Math.max(room.x, 0),
        startY = Math.max(room.y, 0),
        endX = Math.min(room.x + room.width, GRID_WIDTH),
        endY = Math.min(room.y + room.height, GRID_HEIGHT);

      // Loop through each square of the grid that a
      // room overlaps
      var x, y, i;
      for (y = startY; y < endY; y++) {
        for (x = startX; x < endX; x++) {
          // Place a value there.
          grid[y][x] = -1;
        }
      }

      // Add exits as specified by the room's object.
      // `cantGo` ensures exits are inside the `grid`
      for (i = 0; i < room.exits.length; i++) {
        x = room.exits[i][0] + room.x;
        y = room.exits[i][1] + room.y;

        if (cantGo(x, y)) {
          continue;
        }
        grid[y][x] = -2;
      }
    }

    /*
      Manages the DFS algorithm. The example code
      shows this function as recursive, but I have removed
      the recursion in favor of a `while` loop, which allows
      me to animate the generation.
    */
    function mazeDFS() {
      // What the DFS is currently over
      var atop = grid[y][x];

      // A list of valid squares where
      // the maze could go
      var available = [];

      // Coordinates of the square with a
      // number one less than the current one.
      var previousX = x,
          previousY = y;

      // A handy integer/iterator/index
      var i;

      // Set the current square with the proper
      // number.
      grid[y][x] = number;

      // Look in each direction
      for (i = 0; i < 4; i++) {
        // Remember that direction
        var to_x = x + dirs[i][0];
        var to_y = y + dirs[i][1];

        // If it goes off the grid,
        // ignore it.
        if (cantGo(to_x, to_y)) {
          continue;
        }
        
        // What is in that direction?
        var value = grid[to_y][to_x];

        // Determine where the previous square lies
        if (value > 0 && value === number - 1) {
          previousX = to_x;
          previousY = to_y;
        }

        // If there is an exit which the maze
        // must go through, then go through it!
        if (
          (value === -2 && atop === 0) ||
          (value === 0 && atop === -2)
        ) {
          x = to_x;
          y = to_y;
          number++;
          return;
        }

        // If the DFS is inside a room, restrict it to
        // that room.  The maze should only exit it where
        // told to.
        if (
          (atop === -1 || atop === -2) &&
          (value === -1 || value === -2)
        ) {
            let half_x = x + (dirs[i][0] >> 1);
            let half_y = y + (dirs[i][1] >> 1);
            if (grid[half_y][half_x] === -1) {
              available.push([to_x, to_y]);
            }
          // If the DFS is not in a room, then add valid
          // squares to `available`
        } else if (value === 0) {
          available.push([to_x, to_y]);
        }

      }

      // If there were no valid squares found...
      if (available.length <= 0) {
        // If the DFS has returned to its origin,
        // then the maze is complete -- 100%
        // guaranteed, or your money back!
        if (number <= 1) {
          drawing = false;
          return;
        }

        // Otherwise, backtrack to the previous square
        // and look for another route to make
        x = previousX;
        y = previousY;
        number --;

        // If there are valid squares, pick a random one
        // and go there.
      } else {
        i = Math.random() * available.length | 0;
        x = available[i][0];
        y = available[i][1];
        number ++;
      }
    }

    /*
      Returns a nicely formatted grid, based on the DFS grid,
      that has ones for walls and zeros for paths.
    */
    function cleanGrid() {
      // The cleaned-up grid
      var returnGrid = [];

      // Some generic x & y coordinates
      var x, y, tx, ty;

      // A value gathered from `grid`
      var v;

      // An iterator/integer
      var i;

      // Start by assuming everything is a wall.
      for (y = 0; y < GRID_HEIGHT; y++) {
        returnGrid.push([]);
        for (x = 0; x < GRID_WIDTH; x++) {
          returnGrid[y][x] = 1;
        }
      }

      // Then look closer at each square
      for (y = 0; y < GRID_HEIGHT; y++) {
        for (x = 0; x < GRID_WIDTH; x++) {
          v = grid[y][x];

          // If there is nothing there,
          // move on to the next square.
          if (v === 0 || v === -1) {
            continue;
          }

          // Otherwise, carve a path.
          returnGrid[y][x] = 0;

          // Remember that squares are skipped for
          // a wall 1-unit thick.  This carves
          // a path between squares so it looks
          // as it should.
          for (i = 0; i < 4; i++) {
            tx = dirs[i][0];
            ty = dirs[i][1];

            // Makes sure we're looking in the right
            // places
            if (cantGo(x + tx, y + ty)) {
              continue;
            }

            // If we found it,
            if (grid[y + ty][x + tx] === v - 1) {
              // Put a square here.
              // Since the DFS moves two squares at a
              // time, dividing by 2 will give the
              // desired 1 square.
              tx >>= 1;
              ty >>= 1;
              returnGrid[y + ty][x + tx] = 0;
              break;
            }
          }
        }
      }

      // Now, clear each room of potential walls.
      for (var i = 0; i < rooms.length; i++) {
        var room = rooms[i];

        // Make sure the room doesn't reach beyond
        // the `grid`
        var startX = Math.max(room.x, 0),
          startY = Math.max(room.y, 0),
          endX = Math.min(room.x + room.width, GRID_WIDTH),
          endY = Math.min(room.y + room.height, GRID_HEIGHT);

        // Set the needed squares
        for (y = startY; y < endY; y++) {
          for (x = startX; x < endX; x++) {
            returnGrid[y][x] = 0;
          }
        }
      }
      return returnGrid;
    }

    /*
      An extremely handy UI function;  It looks similar to an HTML
      <input type = "range"> element, and returns a value based on
      user input.
    */
    function slider (msg, x, y, l, min, max, step, val, active) {
      // A scalar based on the initial value
      var computed = (val - min) / (max - min);
      // Draw a line and circle for the slider
      $ctx.lineWidth = 5;
      $ctx.strokeStyle = $ctx.fillStyle = active ? "blue" : "#55f";
      $ctx.lineCap = "round";
      $ctx.beginPath ();
      $ctx.moveTo (x, y);
      $ctx.lineTo (x + l, y);
      $ctx.stroke();
      $ctx.beginPath();
      $ctx.arc(x + l * computed, y, 7, 0, Math.TWO_PI);
      $ctx.fill();
      // Draw a label with `msg` and the value
      $ctx.fillStyle = active ? "black" : "#333";
      $ctx.fillText (msg + ": " + val, x + 5, y - 10);

      // If this slider is disabled, ignore input
      if(!active) {
        return val;
      }
      // Handle input
      if (lib.mouseX > x - 7 && lib.mouseY > y - 17 && lib.mouseX < x + l + 7 && lib.mouseY < y + 7) {
        lib.cnv.style.cursor = "grab";
        if (mouseIsPressed) {
          // Compute the new value.
          val = Math.round((max - min) * (lib.mouseX - x) / (l * step)) * step + min;
        }
      }

      // Return the new or unchanged value.
      return Math.min(Math.max(val, min), max);
    }

    /*
      Another useful UI function; Returns `true` if a user clicks on
      it.
    */
    function button (msg, x, y, w, h, active) {
      $ctx.fillStyle = "#eee";
      $ctx.lineWidth = 1;
      $ctx.strokeStyle = active ? "grey" : "#aaa";
      $ctx.fillRect (x, y, w, h);
      $ctx.strokeRect (x, y, w, h);
      $ctx.fillStyle = active ? "black" : "#333";
      $ctx.fillText (msg, x + 5, y + h - 5);

      // Ignore if the button is disabled
      if (!active) {
        return false;
      }
      // Handle input
      if (lib.mouseX > x && lib.mouseY > y && lib.mouseX < x + w && lib.mouseY < y + h) {
        lib.cnv.style.cursor = "pointer";
        if (lib.clicked) {
          return true;
        }
      }
      return false;
    }

    /*
      A third really useful UI function;  This one returns the Boolean
      opposite of a value when a user clicks on it.
    */
    function toggle (msg, x, y, w, h, val, active) {
      $ctx.fillStyle = "#eee";
      $ctx.lineWidth = 1;
      $ctx.strokeStyle = active ? "grey" : "#aaa";
      $ctx.fillRect (x, y, w, h);
      $ctx.strokeRect (x, y, w, h);
      $ctx.fillStyle = active ? "black" : "#333";
      $ctx.fillText (msg + ": " + (val ? "on" : "off"), x + 5, y + h - 5);
      if (!active) {
        return val;
      }
      // Handel input
      if (lib.mouseX > x && lib.mouseY > y && lib.mouseX < x + w && lib.mouseY < y + h) {
        lib.cnv.style.cursor = "pointer";
        if (lib.clicked) {
          return !val;
        }
      }
      return val;
    }

    /*
      Places randomly-generated rooms on `grid`, as specified by
      the user.
    */
    function addRooms () {
      rooms.length = 0;
      while (rooms.length < roomCount) {
        // Random size
        let w = ((Math.random() * Math.sqrt(GRID_WIDTH) >> 1) << 1) + 3;
        let h = ((Math.random () * Math.sqrt(GRID_HEIGHT) >> 1) << 1) + 3;
        rooms.push({
          // Random pos
          x: ((Math.random() * (GRID_WIDTH - w) >> 1) << 1) + 1,
          y: ((Math.random() * (GRID_HEIGHT - h) >> 1) << 1) + 1,
          width: w,
          height: h,

          // Exits are always on the corners.
          exits: [
            [0, 0],
            [w-1, 0],
            [0, h-1],
            [w-1, h-1]
          ]
        });
        placeRoom (rooms[rooms.length-1]);
      }
    }
    
    // Set everything up for the first maze
    primeGrid ();

    // Add some random rooms.
    addRooms();
    
    // Set up some vars
    x = START_X;
    y = START_Y;
    number = 1;

    /*
      The draw function.  It does what I want to the maze,
      which is what the example code said to do :D
    */
    lib.draw = function () {
      // Background for the top
      lib.cnv.style.cursor = "default";
      $ctx.fillStyle = "#efefef";
      $ctx.fillRect(0, 0, lib.width, 100);

      // Display the UI, and make it affect important variables.
      GRID_WIDTH = slider("Width", 15, 35, 75, 11, 35, 2, GRID_WIDTH, !drawing);
      GRID_HEIGHT = slider("Height", 15, 70, 75, 11, 35, 2, GRID_HEIGHT, !drawing);
      START_X = slider("Start x", 115, 35, 75, 1, GRID_WIDTH - 2, 2, START_X, !drawing);
      START_Y = slider("Start y", 115, 70, 75, 1, GRID_HEIGHT - 2, 2, START_Y, !drawing);
      animate = toggle ("Animate", 310, 60, 75, 15, animate, !drawing);
      frameSkip = slider ("Speed", 310, 35, 75, 2, 10, 1, frameSkip, !drawing && animate);
      roomCount = slider ("Rooms", 210, 35, 75, 0, 10, 1, roomCount, !drawing);

      // If the user clicks the "Create Maze" button...
      if (button ("Create Maze", 210, 60, 75, 15, !drawing)) {
        // Disable the UI
        frameCount = 0;
        drawing = true;

        // Prep the grid for generation
        primeGrid();
        addRooms();
        x = START_X;
        y = START_Y;
        number = 1;
      }

      // Only update this part of the canvas if needed.
      // frameSkip allows the user to control the animation speed.
      if (!drawing || ++frameCount % (10 - frameSkip) > 0) {
        return;
      }

      // What time is it?
      let startTime = Date.now();
      do {
        mazeDFS();
      // Run once if animating, or run within 20 ms if not.
      } while (!animate && drawing && Date.now() - startTime < 20);

      // Draw a background for the bottom half of the canvas.
      $ctx.fillStyle = "white";
      $ctx.fillRect(0,100, lib.width, 400);

      // Get a simple bitmap
      var formatted = cleanGrid ();

      // Draw that simple bitmap.
      $ctx.fillStyle = "black";
      for (let i = 0; i < GRID_HEIGHT; i++) {
        for (let j = 0; j < GRID_WIDTH; j++) {
          if (formatted[i][j]) {
            $ctx.fillRect (200 - GRID_WIDTH * 5 + j * 10, 300 - GRID_HEIGHT * 5 + i * 10, 10, 10);
          }
        }
      }
      
      // Draw the blue wanderer if desired.
      if (animate) {
        $ctx.fillStyle = "blue";
        $ctx.fillRect (200 - GRID_WIDTH * 5 + x * 10, 300 - GRID_HEIGHT * 5 + y * 10, 10, 10);
      }
    };

    /*
      Manage user input.  Yes, my Event library does not have a 
      `mouseIsPressed` boolean.
    */
    lib.mousePressed = function () {
      mouseIsPressed = true;
    };
    lib.mouseReleased = function () {
      mouseIsPressed = false;
    };

    // That's all, folks!
  }


  /*
    This is the API part of my code.  Each object contains data for
    each theme. The last argument of command functions is always $ctx,
    the destination context of the graphic.
    
    The `call` property holds a list of methods that 
    act as commands for a canvas' `data-code` attribute.

    The `parseNumbers` attribute determines whether arguments are
    expected as strings or numbers.

    The `bgColor` attribute tells the parse what background color
    (if any) should be drawn before handling commands.
  */
  let dataThemes = {
    // The pacman theme
    "pacman": {
      // Pre-written levels
      "grids": [
        [
          " # # ",
          " #   ",
          " # ##",
          "   # ",
          " #   ",
        ],
        [
          "###############",
          "#             #",
          "# # ## # ## # #",
          "# #         # #",
          "     ## ##     ",
          "# ## #   # ## #",
          "# #  #####  # #",
          "#             #",
          "# # ####### # #",
          "# #         # #",
          "# # ##   ## # #",
          "#    #   #    #",
          "# #  #   #  # #",
          "# ## # # # ## #",
          "#             #",
          "###############"
        ]
      ],

      // Numbers = coordinates :D
      "parseNumbers": true,

      // Valid commands
      "call": [
        "num",
        "block",
        "blinky",
        "pacman",
        "qmark",
        "demo",
        "grid",
      ],

      // Black backdrop
      "bgColor": "black",

      // Draw a bitmap from grids
      "grid": function (index, $ctx) {
        // Get the grid index and make sure it exists
        var x, g = dataThemes.pacman.grids, y = g.length;
        if (index <= 0 || index > y) {
          return;
        }
        index--;
        g = g[index];
        y = g.length;

        // Draw it!
        $ctx.fillStyle = "blue";
        while (y--) {
          x = g[y].length;
          while (x--) {
            if (g[y][x] === "#") {
              $ctx.fillRect(40 * x, 40 * y, 40, 40);
            }
          }
        }
      },

      // Draw a blue square
      "block": function (x, y, $ctx) {
        $ctx.fillStyle = "blue";
        $ctx.fillRect(40 * x, 40 * y, 40, 40);
      },

      // Draw blinky
      "blinky": function (x, y, $ctx) {
        drawBlinky(x * 40, y * 40, 40, $ctx);
      },

      // Draw Pacman
      "pacman": function (x, y, faceLeft, $ctx) {
        drawPacman(x * 40, y * 40, 40, faceLeft, 1, $ctx);
      },

      // Draw a question mark
      "qmark": function (x, y, $ctx) {
        var x = x * 40,
          y = y * 40,
          s = 40;
        $ctx.fillStyle = "grey";
        // The curvy part
        $ctx.beginPath();
        $ctx.moveTo(x + s * 0.2, y + s * 0.3);
        $ctx.arc(x + s * 0.5, y + s * 0.3, s * 0.3, Math.PI, Math.PI * 2.39);
        $ctx.lineTo(x + s * 0.6, y + s * 0.7);
        $ctx.lineTo(x + s * 0.4, y + s * 0.7);
        $ctx.lineTo(x + s * 0.4, y + s * 0.55);
        $ctx.arcTo(x + s * 0.4, y + s * 0.4, x + s * 0.55, y + s * 0.39, s * 0.15);
        $ctx.arc(x + s * 0.5, y + s * 0.3, s * 0.1, Math.PI * 2.3, Math.PI, 1);
        $ctx.fill();
        // The period-like thing at the bottom
        $ctx.fillRect(x + s * 0.4, y + s * 0.75, s * 0.2, s * 0.15);
      },

      // Draw a number
      "num": function (x, y, num, $ctx) {
        $ctx.textBaseline = "middle";
        $ctx.textAlign = "center";
        $ctx.font = (40 / Math.ceil(Math.log(num + 1) / Math.log(10))) + "px monospace";
        $ctx.fillStyle = "white";
        $ctx.fillText(num, 20 + x * 40, 20 + y * 40);
      },

      // The demonstration
      "demo": pacmanLoop
    },

    // The battleship theme
    "battleship": {
      // Valid arguments
      "call": [
        "visual",
        "demo",
        "blankmap"
      ],

      // Another black backdrop
      "bgColor": "black",

      // Draws a probability cloud for a 
      // grid with no shots on it.
      "blankmap": function ($ctx) {
        renderBSvisual([[], [], [], [], [], [], [], [], [], []], [2, 3, 3, 4, 5], $ctx);
      },

      // Draws a probability cloud for a
      // grid with ships & shots on it.
      "visual": function (ships, shots, $ctx) {
        // Parse the ships, and figure out which ones exist.
        let t = ships.split('-'), s = [];
        for (let i = 0; i < t.length; i++) {
          s[i] = parseInt(t[i][3], 10);
        }

        // Draw the cloud.
        renderBSvisual(inflateGrid(ships, shots), s, $ctx);
      },

      // The demonstration
      "demo": battleshipLoop
    },

    // The maze theme.
    "maze": {
      // Only one argument :P
      "call": [
        "demo"
      ],

      // White backdrop
      "bgColor": "white",

      // The maze generator, with a UI
      "demo": mazeLoop
    },

    // The flowchart theme.  This is used for
    // both the pacman explanation and the
    // maze generation.  Its commands draw
    // visual aids to demonstrate search 
    // algorithms
    "flowchart": {
      // Umm...  I got bored when naming these :P
      "call": [
        "uno",  // A confusing flowchart with blinky & pacman
        "dos",  // Draw the path DFS takes in a maze
        "tres", // Draw the maze
        "quatro"// Draw the path BFS takes in a maze
      ],

      "uno": function ($ctx) {
        // Draw a bunch of green rectangles
        $ctx.fillStyle = "#00ff7f";
        $ctx.fillRect(35, 85, 50, 30);
        $ctx.fillRect(113, 22, 50, 30);
        $ctx.fillRect(95, 186, 50, 30);
        $ctx.fillRect(24, 145, 50, 30);
        $ctx.fillRect(123, 102, 50, 30);
        $ctx.fillRect(188, 126, 50, 30);
        $ctx.fillRect(209, 48, 50, 30);

        // Label the rectangles "A" to "G"
        $ctx.fillStyle = "white";
        $ctx.font = "18px sans-serif";
        $ctx.textAlign = "center";
        $ctx.textBaseline = "middle";
        $ctx.fillText("A", 60, 100);
        $ctx.fillText("B", 138, 36);
        $ctx.fillText("C", 233, 63);
        $ctx.fillText("D", 147, 116);
        $ctx.fillText("E", 48, 159);
        $ctx.fillText("F", 213, 141);
        $ctx.fillText("G", 119, 201);

        // Draw a bunch of curves connecting
        // those rectangles.
        $ctx.strokeStyle = "black";
        $ctx.beginPath();
        $ctx.moveTo(65, 83);
        $ctx.quadraticCurveTo(72, 43, 109, 35);
        $ctx.moveTo(89, 103);
        $ctx.quadraticCurveTo(100, 127, 121, 119);
        $ctx.moveTo(205, 63);
        $ctx.quadraticCurveTo(150, 62, 139, 97);
        $ctx.moveTo(59, 120);
        $ctx.quadraticCurveTo(49, 129, 58, 143);
        $ctx.moveTo(37, 179);
        $ctx.quadraticCurveTo(49, 212, 93, 200);
        $ctx.moveTo(113, 184);
        $ctx.quadraticCurveTo(148, 156, 148, 134);
        $ctx.moveTo(149, 203);
        $ctx.quadraticCurveTo(216, 210, 193, 159);
        $ctx.stroke();

        // Draw a very confused blinky
        dataThemes.pacman.blinky(0, 1, $ctx);
        dataThemes.pacman.qmark(0, 0, $ctx);

        // Draw pacman.
        dataThemes.pacman.pacman(5, 4, 1, $ctx);
      },
      
      "dos": function ($ctx) {
        // One long line
        // You'll have to see it to understand it xD
        $ctx.strokeStyle = "green";
        $ctx.beginPath();
        $ctx.moveTo(50, 20);
        $ctx.lineTo(30, 20);
        $ctx.lineTo(30, 110);
        $ctx.lineTo(66, 110);
        $ctx.lineTo(66, 146);
        $ctx.lineTo(26, 146);
        $ctx.lineTo(26, 154);
        $ctx.lineTo(114, 154);
        $ctx.lineTo(114, 146);
        $ctx.lineTo(74, 146);
        $ctx.lineTo(74, 110);
        $ctx.lineTo(146, 110);
        $ctx.lineTo(146, 74);
        $ctx.lineTo(66, 74);
        $ctx.lineTo(66, 66);
        $ctx.lineTo(154, 66);
        $ctx.lineTo(154, 110);
        $ctx.lineTo(186, 110);
        $ctx.lineTo(186, 66);
        $ctx.lineTo(194, 66);
        $ctx.lineTo(194, 150);
        $ctx.lineTo(150, 150);
        $ctx.lineTo(150, 190);
        $ctx.stroke();
        // An arrow at the end
        $ctx.fillStyle = "green";
        $ctx.beginPath();
        $ctx.moveTo(145, 190);
        $ctx.lineTo(155, 190);
        $ctx.lineTo(150, 200);
        $ctx.fill();
      },

      "tres": function ($ctx) {
        // The black backdrop is actually a
        // bunch of walls.
        $ctx.fillStyle = "black";
        $ctx.fillRect(0, 40, 220, 140);

        // A white path is drawn on top
        $ctx.fillStyle = "white";
        $ctx.fillRect(20, 40, 20, 80);
        $ctx.fillRect(60, 60, 80, 20);
        $ctx.fillRect(40, 100, 140, 20);
        $ctx.fillRect(60, 120, 20, 20);
        $ctx.fillRect(180, 60, 20, 80);
        $ctx.fillRect(140, 160, 20, 20);
        $ctx.fillRect(140, 60, 20, 40);
        $ctx.fillRect(20, 140, 100, 20);
        $ctx.fillRect(140, 140, 60, 20);
      },

      "quatro": function ($ctx) {
        // Draw a line
        $ctx.strokeStyle = "green";
        $ctx.beginPath();
        $ctx.moveTo(50, 20);
        $ctx.lineTo(30, 20);
        $ctx.lineTo(30, 110);
        $ctx.lineTo(70, 110);
        $ctx.lineTo(70, 150);
        $ctx.lineTo(40, 150);
        // Draw a line that branches off the first
        $ctx.moveTo(70, 150);
        $ctx.lineTo(100, 150);
        // A line that branches off the second
        $ctx.moveTo(70, 110);
        $ctx.lineTo(150, 110);
        $ctx.lineTo(150, 70);
        $ctx.lineTo(80, 70);
        // Another branch
        $ctx.moveTo(150, 110);
        $ctx.lineTo(190, 110);
        $ctx.lineTo(190, 80);
        // A fourth (and final) branch
        $ctx.moveTo(190, 110);
        $ctx.lineTo(190, 150);
        $ctx.lineTo(150, 150);
        $ctx.lineTo(150, 190);
        $ctx.stroke();

        // A bunch of arrows at the end of the branches
        $ctx.fillStyle = "green";
        $ctx.beginPath();

        $ctx.moveTo(145, 190);
        $ctx.lineTo(155, 190);
        $ctx.lineTo(150, 200);

        $ctx.moveTo(40, 145);
        $ctx.lineTo(40, 155);
        $ctx.lineTo(30, 150);

        $ctx.moveTo(80, 65);
        $ctx.lineTo(80, 75);
        $ctx.lineTo(70, 70);

        $ctx.moveTo(100, 145);
        $ctx.lineTo(100, 155);
        $ctx.lineTo(110, 150);

        $ctx.moveTo(185, 80);
        $ctx.lineTo(190, 70);
        $ctx.lineTo(195, 80);
        $ctx.fill();
      }
    }
  };


  /**
   * Parse a canvas' data-code property, and run the specified
   * commands
   * @param {HTMLCanvasElement} cnv The destination canvas
   * @param {CanvasRenderingContext2D} ctx The destination context
   * @param {Object} theme The theme (from `dataThemes`) that is used
   */
  function parseData(cnv, ctx, theme) {
    // Separate individual commands
    let code = cnv.dataset.code.split(',');

    // For each command,
    for (let i = 0; i < code.length; i++) {
      // Separate the arguments.  The first one
      // is the command name.  It gets removed.
      let args = code[i].split(" "),
          cmd = args.shift();
      
      // If required, parse each argument to numbers
      if (theme[cmd].parseNumbers) {
        args = args.map(parseFloat);
      }

      // Add the rendering context to the list of arguments
      args.push(ctx);

      // The command is allowed, call it.
      if (theme.call.indexOf(cmd) > -1) {
        theme[cmd].apply(theme[cmd], args);
      }
    }
  }

  /**
   * Takes a canvas that has `data-theme` set, and parses its
   * `data-code` property to generate a visualization.
   * 
   * @param {HTMLCanvasElement} canvas A canvas to draw on
   */
  function loadDataScripts(canvas) {
    // Create a rendering context for the canvas.
    let ctx = canvas.getContext('2d'),
    // Get the canvas' theme
        theme = canvas.dataset.theme;

    // If the theme is defined
    if (theme && theme in dataThemes) {
      // Draw a background
      ctx.fillStyle = dataThemes[theme].bgColor || "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Parse the code.
      parseData(canvas, ctx, dataThemes[theme]);
    }
  }


  // Find every canvas with `data-theme` specified,
  let cnvs = doc.querySelectorAll("canvas[data-theme]");
  // And draw a visualization on it.
  cnvs.forEach(loadDataScripts);

})();

// 2000+ lines of code, folks!
