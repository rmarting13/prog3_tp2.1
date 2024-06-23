class Card {
    constructor(name, img) {
        this.name = name;
        this.img = img;
        this.isFlipped = false;
        this.element = this.#createCardElement();
    }

    #createCardElement() {
        const cardElement = document.createElement("div");
        cardElement.classList.add("cell");
        cardElement.innerHTML = `
          <div class="card" data-name="${this.name}">
              <div class="card-inner">
                  <div class="card-front"></div>
                  <div class="card-back">
                      <img src="${this.img}" alt="${this.name}">
                  </div>
              </div>
          </div>
      `;
        return cardElement;
    }

    #flip() {
        const cardElement = this.element.querySelector(".card");
        cardElement.classList.add("flipped");
    }

    #unflip() {
        const cardElement = this.element.querySelector(".card");
        cardElement.classList.remove("flipped");
    }

    toggleFlip(){
        if(this.isFlipped){
            this.#unflip();
            this.isFlipped = false;
        }
        else{
            this.#flip();
            this.isFlipped = true;
        }
    }

    matches(otherCard){
        return this.name == otherCard.name;
    }
}

class Board {
    constructor(cards) {
        this.cards = cards;
        this.fixedGridElement = document.querySelector(".fixed-grid");
        this.gameBoardElement = document.getElementById("game-board");
    }

    #calculateColumns() {
        const numCards = this.cards.length;
        let columns = Math.floor(numCards / 2);

        columns = Math.max(2, Math.min(columns, 12));

        if (columns % 2 !== 0) {
            columns = columns === 11 ? 12 : columns - 1;
        }

        return columns;
    }

    #setGridColumns() {
        const columns = this.#calculateColumns();
        this.fixedGridElement.className = `fixed-grid has-${columns}-cols`;
    }

    render() {
        this.#setGridColumns();
        this.gameBoardElement.innerHTML = "";
        this.cards.forEach((card) => {
            card.element
                .querySelector(".card")
                .addEventListener("click", () => this.onCardClicked(card));
            this.gameBoardElement.appendChild(card.element);
        });
    }

    onCardClicked(card) {
        if (this.onCardClick) {
            this.onCardClick(card);
        }
    }

    #shuffleCards(){
        let ran;
        let shuffled = [];
        do{
            ran = Math.floor(Math.random() * this.cards.length);
            shuffled.push(this.cards[ran]);
            this.cards.splice(ran,1);
        }while(this.cards.length);
        this.cards = shuffled;
    }

    #flipDownAllCards(){
        this.cards.forEach(card => (card.isFlipped)? card.toggleFlip() : null);
    }

    reset(){
        this.#flipDownAllCards();
        this.#shuffleCards();
        this.render();
    }
}

class MemoryGame {
    constructor(board, flipDuration = 500) {
        this.board = board;
        this.flippedCards = [];
        this.matchedCards = [];
        if (flipDuration < 350 || isNaN(flipDuration) || flipDuration > 3000) {
            flipDuration = 350;
            alert(
                "La duración de la animación debe estar entre 350 y 3000 ms, se ha establecido a 350 ms"
            );
        }
        this.flipDuration = flipDuration;
        this.board.onCardClick = this.#handleCardClick.bind(this);
        this.board.reset();
        this.movements = 0;
        this.movementsDisplayElement = document.getElementById('movements');
        this.timeDisplayElement = document.getElementById('time');
        this.time = 0;
        this.timeCounter = null;
        this.scoreDisplayElement = document.getElementById('score');
    }

    #handleCardClick(card) {
        if (this.flippedCards.length < 2 && !card.isFlipped) {
            if(!this.timeCounter){
                this.#initTimeCounter();
            }
            card.toggleFlip();
            this.flippedCards.push(card);
            if (this.flippedCards.length === 2) {
                setTimeout(() => this.#checkForMatch(), this.flipDuration);
                this.#updateMovementsCounter();
            }
        }
    }

    #checkForMatch(){
        const card1 = this.flippedCards.pop();
        const card2 = this.flippedCards.pop();
        if(card1.matches(card2)){
            this.matchedCards.push(card1);
            this.matchedCards.push(card2);
            // Si todas las cartas hicieron match, finaliza el juego deteniendo el contador de tiempo
            // y mostrando el puntaje obtenido:
            if(this.matchedCards.length === this.board.cards.length){
                this.#stopTimeCounter();
                this.#showScore();
            }
        }
        else{
            card1.toggleFlip();
            card2.toggleFlip();
        }

    }

    #initTimeCounter(){
        let min = 0;
        let sec = 0;
        let textMin, textSec;
        this.timeCounter = setInterval(() => {
            sec ++;
            if(sec === 60){
                sec = 0;
                min++;
            }
            textSec = (sec < 10)? `0${sec}`: sec;
            textMin = (min < 10)? `0${min}`: min;
            this.timeDisplayElement.textContent = `${textMin}:${textSec}`;
            this.time ++;
        }, 1000);
    }

    #updateMovementsCounter(){
        this.movements ++;
        this.movementsDisplayElement.textContent = `${this.movements}`;
    }

    #stopTimeCounter(){
        (this.timeCounter)? clearInterval(this.timeCounter):null;
    }

    #showScore(){
        let score = 5000;
        if(this.movements > 6){
            score -= (this.movements-6)*100;
        }
        if(this.time > 15){
            score -= (this.time-15)*50;
        }
        this.scoreDisplayElement.innerText = `${score}`;
    }

    #clearScreenValues(){
        this.movements = 0;
        this.movementsDisplayElement.textContent = '';
        this.#stopTimeCounter();
        this.timeCounter = null;
        this.timeDisplayElement.textContent = '';
        this.score = 0
        this.scoreDisplayElement.textContent = '';
    }

    resetGame(){
        this.flippedCards = [];
        this.matchedCards = [];
        this.board.reset();
        this.#clearScreenValues();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const cardsData = [
        { name: "Python", img: "./img/Python.svg" },
        { name: "JavaScript", img: "./img/JS.svg" },
        { name: "Java", img: "./img/Java.svg" },
        { name: "CSharp", img: "./img/CSharp.svg" },
        { name: "Go", img: "./img/Go.svg" },
        { name: "Ruby", img: "./img/Ruby.svg" },
    ];

    const cards = cardsData.flatMap((data) => [
        new Card(data.name, data.img),
        new Card(data.name, data.img),
    ]);
    const board = new Board(cards);
    const memoryGame = new MemoryGame(board, 1000);

    document.getElementById("restart-button").addEventListener("click", () => {
        memoryGame.resetGame();
    });
});
