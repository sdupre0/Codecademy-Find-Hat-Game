const prompt = require('prompt-sync')({sigint: true});

const hat = '^';
const hole = 'O';
const fieldCharacter = '░';
const pathCharacter = '*';
let gameEnded = false;

class Field {

  constructor(fieldArray) {
    this._fieldArray = fieldArray;
    this._currentPlayerPos = fieldArray.pop();
    this._height = fieldArray.length;
    this._width = fieldArray[0].length;

    // fill wasHere with false on initialization
    this._wasHere = [];
    for (let i = 0; i < this._height; i++) {
      let subWas = new Array(this._width);
      subWas.fill(false);
      this._wasHere.push(subWas);
    }
  }

  // getters
  get height() {
    return this._height;
  }

  get width() {
    return this._width;
  }

  get playerCoords() {
    return this._currentPlayerPos;
  }

  // helper function to print out the field in an easy to read grid
  print() {
    for (let i = 0; i < this._fieldArray.length; i++) {
      let line = '';
      this._fieldArray[i].forEach(element => {
        line = line + element;
      });
      console.log(line);
    }
  }

  // generates field
  static generateField(h, w, percent) {
    // 100 percent holes makes no sense and is unsolveable, lower to hard value
    if (percent === 100) {
      console.log('100% holes not permitted, lowering...');
      percent = 60;
    }
    // actual number of holes based on percent and field dimensions
    const numHoles = Math.floor((h * w) * (percent / 100));
    const fieldArray = [];

    // fill array with standard field character
    for (let i = 0; i < h; i++) {
      const subArray = new Array(w);
      subArray.fill(fieldCharacter);
      fieldArray.push(subArray);
    }
    // get random player start and fill in
    let randCoord = Field.getRandomFieldPos(h, w);
    while (fieldArray[randCoord[0]][randCoord[1]] !== fieldCharacter) {
      randCoord = Field.getRandomFieldPos(h, w);
    }
    fieldArray[randCoord[0]][randCoord[1]] = pathCharacter;
    fieldArray.push(randCoord);

    // fill in holes based on actual number derived from percent
    let k = 0;
    while (k < numHoles) {
      randCoord = Field.getRandomFieldPos(h, w);
      while (fieldArray[randCoord[0]][randCoord[1]] !== fieldCharacter) {
        randCoord = Field.getRandomFieldPos(h, w);
      }
      fieldArray[randCoord[0]][randCoord[1]] = hole;
      k++; 
    }
    // add hat in random location
    randCoord = Field.getRandomFieldPos(h, w);
    while (fieldArray[randCoord[0]][randCoord[1]] !== fieldCharacter) {
      randCoord = Field.getRandomFieldPos(h, w);
    }
    fieldArray[randCoord[0]][randCoord[1]] = hat;

    return fieldArray;
  }

  // helper function to get random field position coordinates
  static getRandomFieldPos(h, w) {
    let randX = Math.floor(Math.random() * h);
    let randY = Math.floor(Math.random() * w);
    return [randX, randY];
  }

  // "translates" user char input into actual x or y change
  tryDirection(dir) {
    let currY = this._currentPlayerPos[0];
    let currX = this._currentPlayerPos[1];
    let newY = currY;
    let newX = currX;

    switch (dir) {
      case 'U':
      case 'u':
        newY = currY - 1;
        break;
      case 'D':
      case 'd':
        newY = currY + 1;
        break;
      case 'L':
      case 'l':
        newX = currX - 1;
        break;
      case 'R':
      case 'r':
        newX = currX + 1;
        break;
    }

    // if attempt to move outside field dimensions, game over
    if (newX < 0 || newX >= this._width || newY < 0 || newY >= this._height) {
      gameEnded = true;
      console.log('You went off the edge! Game over.');
    }
    else {
      // other options, clears map and reprints no matter the result
      switch(this._fieldArray[newY][newX]) {
        // player moves into hole space, game over
        case hole:
          console.log('\x1Bc');
          this._fieldArray[currY][currX] = fieldCharacter;
          //this._fieldArray[newY][newX] = pathCharacter;
          this.print();
          console.log('You fell in a hole! Game over.');
          gameEnded = true;
          break;
        case hat:
          // player moves into hat space, win
          console.log('\x1Bc');
          this._fieldArray[currY][currX] = fieldCharacter;
          this._fieldArray[newY][newX] = pathCharacter;
          this.print();
          console.log('You found your hat! You win!');
          gameEnded = true;
          break;
        case fieldCharacter:
          // player moves into neutral ground space, nothing
          console.log('\x1Bc');
          this._fieldArray[currY][currX] = fieldCharacter;
          this._fieldArray[newY][newX] = pathCharacter;
          this._currentPlayerPos = [newY, newX];
          this.print();
          break;
      }
    }
  }

  // verification function close to a maze solver that recursively tests paths
  // to ensure that the generated field is actually solveable
  verify(coords) {
    let coordY = coords[0];
    let coordX = coords[1];
    let coordItem = this._fieldArray[coordY][coordX];

    // is this the hat or a hole??? or has this place already been checked?
    if (coordItem === hat) {
      return true;
    }
    else if (coordItem === hole || this._wasHere[coordY][coordX] === true) {
      return false;
    }
    // you're here, so place true into wasHere at current coords
    this._wasHere[coordY][coordX] = true;

    // if not then recursively use verify() to pathfind to the hat
    // try up
    if (coordY - 1 < 0 || !this.verify([coordY - 1, coordX])) {
      // try down
      if (coordY + 1 >= this._height || !this.verify([coordY + 1, coordX])) {
        // try left
        if (coordX - 1 < 0 || !this.verify([coordY, coordX - 1])) {
          // try right
          if (coordX + 1 >= this._width || !this.verify([coordY, coordX + 1])) {
            // all directions tried and all were invalid
            return false;
          }
        }
      }
    }
    return true;
  }
}

// initial prompt for user to select difficulty
const gameIntro = () => {
  console.log('Map: Small = s, Medium = m, Large = l');
  console.log('Difficulty: Easy = 1, Medium = 2, Hard = 3');
  let diffSize = prompt('Enter a size and difficulty (e.g. \'m3\'): ');

  let size = diffSize[0];
  let difficulty = diffSize[1];

  runGame(size, difficulty);
}

// the main game function that continuously loops for player input
const runGame = (size, difficulty) => {
  gameEnded = false;
  console.log('\x1Bc');

  // sets dimensions and hole percent based on player input
  // hole percentages higher than 50 can basically only result in a successful
  // field generation where the player starts 1-2 spaces away from the goal
  // which is not great
  let hw = [], perc = 0;
  switch(size) {
    case 's':
      hw = [6, 18];
      break;
    case 'm':
      hw = [10, 30];
      break;
    case 'l':
      hw = [14, 42];
      break;
  }
  switch(difficulty) {
    case '1':
      perc = 20;
      break;
    case '2':
      perc = 35;
      break;
    case '3':
      perc = 50;
      break;
  }

  // generate field
  console.log('Generating game field...');
  let gameField = new Field(Field.generateField(hw[0], hw[1], perc));
  while (!gameField.verify(gameField.playerCoords)) {
    gameField = new Field(Field.generateField(hw[0], hw[1], perc));
  }
  // clear console commands and print map
  console.log('\x1Bc');
  gameField.print();

  // loops that continuously takes user directional inputs
  while (!gameEnded) {
    let dir = prompt('Enter a direction: ');
    gameField.tryDirection(dir);
  }
  // replay or quit prompt for end
  let replay = prompt('Enter R to replay or X to quit: ');
  if (replay === 'R' || replay === 'r') {
    console.log('\x1Bc');
    gameIntro();
  }
  else if (replay === 'X' || replay === 'x') {
    process.exit();
  }
}

gameIntro();
