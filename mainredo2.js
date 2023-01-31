const suits = ["Clubs", "Diamond", "Hearts", "Spades"];
const values = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13"];


let gameBoard;      // Entire game board including opponents
let pileContainer;  // Community piles
let yourDeck;       // Your main deck that you draw from
let yourNextCard;   // Your face up pile that you draw cards to
let yourPlayPile1;  // The piles that you can move cards around in
let yourPlayPile2;  //
let yourPlayPile3;  // 
let yourBlitzPile;  // The objective cards (if you empty it the game is over)
let activePiles;    // Array of piles that have one or more cards that can be moved
let draggingCard;   // The card that is currently being dragged by the user
let isDragging;     // True if a card is currently being dragged
let startMouseX;    // X value of mouse when clicked
let startMouseY;    // Y value of mouse when clicked
let startPile;      // The origin pile of the card currently being dragged
let pileCount;      // Number of piles in community board
let validPlacement = true;


const NUM_PLAY_PILES = 3; // TODO: Make this dependant on the number of players


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

/**
 * Returns the path to the given card image in a string
 * @param  {Card} card Card object containing a 'suit' and 'value
 * @return {String} cardImg String correspsonding to the given card img path
 */
function get_card_img(card) {
    let cardImg = `url('/card-pngs/${card.suit} ${card.value}.png')`

    return cardImg;
}

/**
 * Adds the given card to the specified pile
 * @param  {Card} card Card object containing a 'suit' and 'value
 * @param  {Pile} pile Pile object representing the face-up piles on
 * the gameboard. Contains a 'cards' array and a 'div' element.
 */
function add_card_to_pile(card, pile) {
    if (pile.cards.length == 0) {
        activePiles.push(pile);
    }
    pile.cards.push(card);
    pile.element.style.backgroundImage = get_card_img(card);
}

/**
 * Removes the top card from the given pile. Updates the array and
 * background image of the pile's div.
 * @param  {Pile} pile Pile object representing the face-up piles on
 * the gameboard. Contains a 'cards' array and a 'div' element.
 */
function remove_card_from_pile(pile) { // TODO: remove from active pile when empty
    let poppedCard = pile.cards.pop();
    let topCard = pile.cards[pile.cards.length - 1];

    if (pile.cards.length == 0) {
        pile.element.style.backgroundImage = null;
        remove_active_pile(pile);
    } else {
        if (!(pile.element.id == "your-deck")) {
            pile.element.style.backgroundImage = get_card_img(topCard);
        } 
    }
    
    return poppedCard;
}

// Removes the given pile from the array of active piles
function remove_active_pile(pile) {
    // Loop through activePiles and remove the pile that matches
    for(let i = 0; i < activePiles.length; i++){ 
        if (activePiles[i] === pile) { 
            activePiles.splice(i, 1); 
        }
    }
}

/* ---- Dragging Stuff ---- */

// Checks if the mouse is over a specified pile of cards
function is_mouse_over(x, y, pile) {
    let left = pile.element.getBoundingClientRect().left;
    let right = pile.element.getBoundingClientRect().right;
    let top = pile.element.getBoundingClientRect().top;
    let bottom = pile.element.getBoundingClientRect().bottom;

    if (left <= x && right >= x && top <= y && bottom >= y) {
        return true;
    }

    return false;
}

// The function run when the user clicks on the gameboard
let mouse_down = function(e) {
    e.preventDefault();

    startMouseX = parseInt(e.clientX);
    startMouseY = parseInt(e.clientY);

    for (let pile of activePiles) {
        if(is_mouse_over(startMouseX, startMouseY, pile)) {
            draggingCard.element.style.left =  `${pile.element.getBoundingClientRect().left}px`;
            draggingCard.element.style.top = `${pile.element.getBoundingClientRect().top}px`;
            let poppedCard = remove_card_from_pile(pile);
            draggingCard.element.style.backgroundImage = get_card_img(poppedCard);
            draggingCard.cards.push(poppedCard);
            gameBoard.appendChild(draggingCard.element);
            startPile = pile;
            isDragging = true;
        } else {
            //console.log("no");
        }
    }
}

let mouse_move = function(e) {
    if (!isDragging) {
        return;
    } else {
        e.preventDefault();

        let curMouseX = parseInt(e.clientX);
        let curMouseY = parseInt(e.clientY);
        
        let dX = curMouseX - startMouseX;
        let dY = curMouseY - startMouseY;

        startMouseX = curMouseX;
        startMouseY = curMouseY;

        draggingCard.element.style.left = `${parseInt(draggingCard.element.style.left) + dX}px`;
        draggingCard.element.style.top = `${parseInt(draggingCard.element.style.top) + dY}px`;
    }
}

let mouse_up = function(e) {
    if (!isDragging) {
        return
    } else {
        e.preventDefault();
        
        if (validPlacement) {
            let newPile = document.createElement("div");
            newPile.id = `pile${pileCount}`;
            newPile.classList.add("your-cards");
            newPile.classList.add("community-cards");
            newPile.style.backgroundImage = draggingCard.element.style.backgroundImage;
            pileContainer.appendChild(newPile);
            pileCount++;
        } else {
            add_card_to_pile(draggingCard.cards[0], startPile)
        }

        gameBoard.removeChild(draggingCard.element);
        draggingCard.cards = [];
        isDragging = false;

    }

}

let mouse_out = function(e) { // Not sure what mouseout does
    if (!isDragging) {
        return
    } else {
        e.preventDefault();
    }
    isDragging = false;
}

let mouse_click = function(e) {
    let curMouseX = parseInt(e.clientX);
    let curMouseY = parseInt(e.clientY);

    if (is_mouse_over(curMouseX, curMouseY, yourDeck) && yourDeck.cards.length != 0) {
        add_card_to_pile(remove_card_from_pile(yourDeck), yourNextCard);
    }

    if (is_mouse_over(curMouseX, curMouseY, yourNextCard) && yourDeck.cards.length == 0) {
        yourDeck.cards = yourNextCard.cards.reverse();
        yourNextCard.cards = [];

        yourDeck.element.style.backgroundImage = "url('/card-pngs/Back\ Red\ 2.png')";
        yourNextCard.element.style.backgroundImage = null;

        remove_active_pile(yourNextCard);
    }
}

/* ---- Community Stuff ---- */



function new_game() {
    let deck = shuffleDeck(buildDeck());

    // Initialize game elements
    gameBoard = document.getElementById("game-container");
    pileContainer = document.getElementById("pile-container");
    yourDeck = {cards: deck, element: document.getElementById("your-deck")};
    yourNextCard = {cards: [], element: document.getElementById("your-next-card")};
    yourPlayPile1 = {cards: [], element: document.getElementById("your-play-pile-1")};
    yourPlayPile2 = {cards: [], element: document.getElementById("your-play-pile-2")};
    yourPlayPile3 = {cards: [], element: document.getElementById("your-play-pile-3")}; 
    yourBlitzPile = {cards: [], element: document.getElementById("your-blitz-pile")};

    pileCount = 0;

    // Set the image of your deck to the back of a playing card
    yourDeck.element.style.backgroundImage = "url('/card-pngs/Back\ Red\ 2.png')";

    // Deal out the initial game state
    activePiles = [];
    add_card_to_pile(remove_card_from_pile(yourDeck), yourPlayPile1);
    add_card_to_pile(remove_card_from_pile(yourDeck), yourPlayPile2);
    add_card_to_pile(remove_card_from_pile(yourDeck), yourPlayPile3);
    for (let i = 0; i < 10; i++) {
        add_card_to_pile(remove_card_from_pile(yourDeck), yourBlitzPile);
    }

    // Initialize dragging card
    draggingCard = {cards: [], element: document.createElement("div")}
    draggingCard.element.classList.add("your-cards");
    draggingCard.element.id = "dragging-card";
    isDragging = false;
}
new_game();


gameBoard.onmousedown = mouse_down;
gameBoard.onmousemove = mouse_move;
gameBoard.onmouseup = mouse_up;
gameBoard.onclick = mouse_click;
