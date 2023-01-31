const suits = ["Clubs", "Diamond", "Hearts", "Spades"];
const values = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13"];

let currentCardIndex;
let cardsInDrawPile;
const gameBoard = document.getElementById("game-container");
const yourDeck = document.getElementById("your-deck");
const yourNextCard = document.getElementById("your-next-card");
let activePiles = [yourNextCard]; // Array of piles that cards can be taken from
let mainDeck = [];
let drawPile = [];
let clientStartX;
let clientStartY;
let isDragging = false;
let draggingCard = document.createElement("div");
draggingCard.classList.add("your-cards");
draggingCard.id = "dragging-card";


function buildDeck() {
    let deck = [];

    for (let suit of suits) {
        for (let value of values) {
            deck.push({value: value, suit: suit});
        }
    }

    return deck;
}

function shuffleDeck(deck) { //Fisher–Yates shuffle
    let m = deck.length, t, i;
  
    // While there remain elements to shuffle…
    while (m) {
  
      // Pick a remaining element…
      i = Math.floor(Math.random() * m--);
  
      // And swap it with the current element.
      t = deck[m];
      deck[m] = deck[i];
      deck[i] = t;
    }
  
    return deck;
}

function drawNextCard(deck) {
    let nextCard = deck[currentCardIndex];

    if (currentCardIndex >= cardsInDrawPile - 1) {
        yourDeck.style.backgroundImage = null;
        return
    } else {
        currentCardIndex += 1;
        yourDeck.style.backgroundImage = "url('/card-pngs/Back\ Red\ 2.png')";
    }

    console.log(nextCard)

    yourNextCard.style.backgroundImage = `url('/card-pngs/${nextCard.suit} ${nextCard.value}.png')`;
}

// Cycle through the deck when you click on it
yourDeck.addEventListener("click", () => {
    drawNextCard(deck);
    yourNextCard.classList.add("draw-animation");
});
yourDeck.addEventListener("mouseup", () => {yourNextCard.classList.remove("draw-animation")});

// Reset deck when all cards have been looked at // Don't need anymore
yourNextCard.addEventListener("click", () => {
    if (currentCardIndex >= cardsInDrawPile - 1) {
        currentCardIndex = 0;
        yourNextCard.style.backgroundImage = null;
        yourDeck.classList.add("reset-deck");
        yourDeck.style.backgroundImage = "url('/card-pngs/Back\ Red\ 2.png')";
    }
});
yourNextCard.addEventListener("mouseup", () => {yourDeck.classList.remove("reset-deck")});

/* ---- Dragging Stuff ---- */

// Checks if the mouse is over a specified pile of cards
function is_mouse_over(x, y, pile) {
    let left = pile.getBoundingClientRect().left;
    let right = pile.getBoundingClientRect().right;
    let top = pile.getBoundingClientRect().top;
    let bottom = pile.getBoundingClientRect().bottom;

    if (left <= x && right >= x && top <= y && bottom >= y) {
        return true;
    }

    return false;
}

// The function run when the user clicks on the gameboard
let mouse_down = function(e) {
    e.preventDefault();

    clientStartX = parseInt(e.clientX);
    clientStartY = parseInt(e.clientY);

    let curCard = deck[currentCardIndex-1];
    let nextCard = deck[currentCardIndex+1];

    for (let pile of activePiles) {
        if(is_mouse_over(clientStartX, clientStartY, pile)) {
            console.log(pile.getBoundingClientRect().left);
            draggingCard.style.left =  `${pile.getBoundingClientRect().left}px`;
            draggingCard.style.top = `${pile.getBoundingClientRect().top}px`;
            draggingCard.style.backgroundImage = `url('/card-pngs/${curCard.suit} ${curCard.value}.png')`;
            //yourNextCard.style.backgroundImage = `url('/card-pngs/${nextCard.suit} ${nextCard.value}.png')`;
            gameBoard.appendChild(draggingCard);
            isDragging = true;
        } else {
            console.log("no");
        }
    }
}

let mouse_move = function(e) {
    if (!isDragging) {
        return;
    } else {
        e.preventDefault();

        let curX = parseInt(e.clientX);
        let curY = parseInt(e.clientY);
        
        let dX = curX - clientStartX;
        let dY = curY - clientStartY;

        clientStartX = curX;
        clientStartY = curY;

        draggingCard.style.left = `${parseInt(draggingCard.style.left) + dX}px`;
        draggingCard.style.top = `${parseInt(draggingCard.style.top) + dY}px`;
    }
}

let mouse_up = function(e) {
    if (!isDragging) {
        return
    } else {
        e.preventDefault();
    }
    isDragging = false;
    gameBoard.removeChild(draggingCard);
}

let mouse_out = function(e) {
    if (!isDragging) {
        return
    } else {
        e.preventDefault();
    }
    isDragging = false;
}

let mouse_click = function(e) {
    let curX = parseInt(e.clientX);
    let curY = parseInt(e.clientY);

    if (is_mouse_over(curX, curY, yourNextCard)) {
        if (currentCardIndex >= cardsInDrawPile - 1) {
            currentCardIndex = 0;
            yourNextCard.style.backgroundImage = null;
            yourDeck.classList.add("reset-deck");
            yourDeck.style.backgroundImage = "url('/card-pngs/Back\ Red\ 2.png')";
        }
    }
}

/**
 * Returns the path to the given card image in a string
 * @param  {Card} card Card object containing a 'suit' and 'value
 * @return {String} cardImg String correspsonding to the given card img path
 */
function get_card_img(card) {
    cardImg = `url('/card-pngs/${card.suit} ${card.value}.png')`

    return cardImg;
}

/**
 * Adds the given card to the specified pile
 * @param  {Card} card Card object containing a 'suit' and 'value
 * @param  {Pile} pile Pile object representing the face-up piles on
 * the gameboard. Contains a 'cards' array and a 'div' element.
 */
function add_card_to_pile(card, pile) {
    pile.cards.append(card);
    pile.element.style.backgroundImage = get_card_img(card);
}

/**
 * Removes the top card from the given pile. Updates the array and
 * background image of the pile's div.
 * @param  {Pile} pile Pile object representing the face-up piles on
 * the gameboard. Contains a 'cards' array and a 'div' element.
 */
function remove_card_from_pile(pile) {
    poppedCard = pile.cards.pop();
    topCard = pile.cards[pile.cards.length - 1];
    pile.element.style.backgroundImage = get_card_img(topCard);
    
    return poppedCard
}

gameBoard.onmousedown = mouse_down;
gameBoard.onmousemove = mouse_move;
gameBoard.onmouseup = mouse_up;
gameBoard.onclick = mouse_click;
//gameBoard.onmouseout = mouse_out;


function newGame() {
    let deck = shuffleDeck(buildDeck());
    currentCardIndex = 0;

    yourDeck.style.backgroundImage = "url('/card-pngs/Back\ Red\ 2.png')";

    for (let i = 1; i <= 3; i++) {
        
    }

    return deck;
}

let deck = newGame();
