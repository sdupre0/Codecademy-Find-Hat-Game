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

    this._wasHere = [];
    for (let i = 0; i < this._height; i++) {
      let subWas = new Array(this._width);
      subWas.fill(false);
      this._wasHere.push(subWas);
    }
  }

  get height() {
    return this._height;
  }

  get width() {
    return this._width;
  }

  get playerCoords() {
    return this._currentPlayerPos;
  }

  print() {
    for (let i = 0; i < this._fieldArray.length; i++) {
      let line = '';
      this._fieldArray[i].forEach(element => {
        line = line + element;
      });
      console.log(line);
    }
  }

  printWas() {
    for (let i = 0; i < this._wasHere.length; i++) {
      let line = '';
      this._wasHere[i].forEach(element => {
        line = line + element;
      });
      console.log(line);
    }
  }

  static generateField(h, w, percent) {
    if (percent === 100) {
      console.log('100% holes not permitted, lowering...');
      percent = 75;
    }
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

    // fill in holes based on percent
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

  static getRandomFieldPos(h, w) {
    let randX = Math.floor(Math.random() * h);
    let randY = Math.floor(Math.random() * w);
    return [randX, randY];
  }

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

    if (newX < 0 || newX >= this._width || newY < 0 || newY >= this._height) {
      gameEnded = true;
      console.log('You went off the edge! Game over.');
    }
    else {
      switch(this._fieldArray[newY][newX]) {
        case hole:
          console.log('\x1Bc');
          this._fieldArray[currY][currX] = fieldCharacter;
          //this._fieldArray[newY][newX] = pathCharacter;
          this.print();
          console.log('You fell in a hole! Game over.');
          gameEnded = true;
          break;
        case hat:
          console.log('\x1Bc');
          this._fieldArray[currY][currX] = fieldCharacter;
          this._fieldArray[newY][newX] = pathCharacter;
          this.print();
          console.log('You found your hat! You win!');
          gameEnded = true;
          break;
        case fieldCharacter:
          console.log('\x1Bc');
          this._fieldArray[currY][currX] = fieldCharacter;
          this._fieldArray[newY][newX] = pathCharacter;
          this._currentPlayerPos = [newY, newX];
          this.print();
          break;
      }
    }
  }

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

const gameIntro = () => {
  console.log('Map: Small = s, Medium = m, Large = l');
  console.log('Difficulty: Easy = 1, Medium = 2, Hard = 3');
  let diffSize = prompt('Enter a size and difficulty (e.g. \'m3\'): ');

  let size = diffSize[0];
  let difficulty = diffSize[1];

  runGame(size, difficulty);
}

const runGame = (size, difficulty) => {
  gameEnded = false;
  console.log('\x1Bc');

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
      perc = 40;
      break;
    case '3':
      perc = 60;
      break;
  }

  console.log('Generating game field...');
  let gameField = new Field(Field.generateField(hw[0], hw[1], perc));
  while (!gameField.verify(gameField.playerCoords)) {
    gameField = new Field(Field.generateField(hw[0], hw[1], perc));
  }
  console.log('\x1Bc');
  gameField.print();

  while (!gameEnded) {
    let dir = prompt('Enter a direction: ');
    gameField.tryDirection(dir);
  }
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