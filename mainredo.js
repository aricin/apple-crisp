// Values used for constructing a deck of cards
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
let draggingCard;   // The card that is currently being dragged by the user

let isDragging;     // True if a card is currently being dragged
let startMouseX;    // X value of mouse when clicked
let startMouseY;    // Y value of mouse when clicked
let startPile;      // The origin pile of the card currently being dragged
let pileCount;      // Number of piles in community board
let validPlacement; // True if the user is dragging a card over a pile where it is allowed to be dropped


const NUM_BLITZ_CARDS = 30;
const NUM_PLAY_PILES = 3; // TODO: Make this dependant on the number of players

/**
 * Constructs an in order deck of cards into an array, 
 * with each card taking the form {value: value, suit: suit}
 * @returns {Array} deck
 */
function buildDeck() {
    let deck = [];

    for (let suit of suits) {
        for (let value of values) {
            deck.push({value: value, suit: suit});
        }
    }

    return deck;
}

/**
 * Uses Fisher-Yates shuffle to fairly randomize a deck.
 * @returns {Array} deck
 */
function shuffleDeck(deck) {
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
 * @param  {Pile} pile
 */
function add_card_to_pile(card, pile) {
    if (pile.cards.length == 0) {
        pile.active = true;
    }
    pile.cards.push(card);
    pile.style.backgroundImage = get_card_img(card);
}

/**
 * Removes the top card from the given pile. Updates the array and
 * background image of the pile's div.
 * @param  {Pile} pile Pile object representing the face-up piles on
 * the gameboard. Contains a 'cards' array and a 'div' element.
 */
function remove_card_from_pile(pile) {
    let poppedCard = pile.cards.pop();
    let topCard = pile.cards[pile.cards.length - 1];

    if (pile.cards.length == 0) {
        pile.style.backgroundImage = null;
        pile.active = false;
    } else {
        if (!(pile.id == "your-deck")) {
            pile.style.backgroundImage = get_card_img(topCard);
        } 
    }
    
    return poppedCard;
}

function is_mouse_over(element) {

}


/* ---- Dragging Stuff ---- */


// The function run when the user clicks on the gameboard
let mouse_down = function(e) {
    e.preventDefault();

    // If pile contains a movable card
    if (e.target.active) {
        startMouseX = parseInt(e.clientX);
        startMouseY = parseInt(e.clientY);
    
        draggingCard.style.left =  `${e.target.getBoundingClientRect().left}px`;
        draggingCard.style.top = `${e.target.getBoundingClientRect().top}px`;
        let poppedCard = remove_card_from_pile(e.target);
        draggingCard.style.backgroundImage = get_card_img(poppedCard);
        draggingCard.cards.push(poppedCard);
        gameBoard.appendChild(draggingCard);
        startPile = e.target;
        isDragging = true;
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

        draggingCard.style.left = `${parseInt(draggingCard.style.left) + dX}px`;
        draggingCard.style.top = `${parseInt(draggingCard.style.top) + dY}px`;
    }
}

let mouse_up = function(e) {
    if (!isDragging) {
        return
    } else {
        e.preventDefault();
        
        if (validPlacement) {
            let newPile = document.createElement("div");
            //newPile.id = `pile${pileCount}`;
            newPile.classList.add("your-cards");
            newPile.classList.add("community-cards");
            newPile.style.backgroundImage = draggingCard.style.backgroundImage;
            pileContainer.appendChild(newPile);
            pileCount++;
        } else {
            add_card_to_pile(draggingCard.cards[0], startPile)
        }

        gameBoard.removeChild(draggingCard);
        draggingCard.cards = [];
        isDragging = false;

    }
}

let draw_card = function(e) {
    e.preventDefault();

    if (yourDeck.cards.length != 0) {
        add_card_to_pile(remove_card_from_pile(yourDeck), yourNextCard);
    } else if (yourDeck.cards.length == 0) {
        yourDeck.cards = yourNextCard.cards.reverse();
        yourNextCard.cards = [];

        yourDeck.style.backgroundImage = "url('/card-pngs/Back\ Red\ 2.png')";
        yourNextCard.style.backgroundImage = null;

        yourNextCard.active = false;
    }
}

let reset_deck = function(e) {
    console.log("hi");
    if (yourDeck.cards.length == 0) {
        yourDeck.cards = yourNextCard.cards.reverse();
        yourNextCard.cards = [];

        yourDeck.style.backgroundImage = "url('/card-pngs/Back\ Red\ 2.png')";
        yourNextCard.style.backgroundImage = null;

        yourNextCard.active = false;
    }
}

/* ---- Community Stuff ---- */
let mouse_over = function(e) {
    e.preventDefault();
    validPlacement = true;
    console.log("hi");
}

let mouse_leave = function(e) {
    e.preventDefault();
    validPlacement = false;
    //console.log(validPlacement);
}


function new_game() {
    let deck = shuffleDeck(buildDeck());

    // Initialize game elements
    gameBoard = document.getElementById("game-container");
    pileContainer = document.getElementById("pile-container");
    yourDeck = document.getElementById("your-deck");
    yourNextCard = document.getElementById("your-next-card");
    yourPlayPile1 = document.getElementById("your-play-pile-1");
    yourPlayPile2 = document.getElementById("your-play-pile-2");
    yourPlayPile3 = document.getElementById("your-play-pile-3"); 
    yourBlitzPile = document.getElementById("your-blitz-pile");

    // Initialize each piles cards array
    yourDeck.cards = deck;
    for (let pile of [yourNextCard, yourPlayPile1, yourPlayPile2, yourPlayPile3, yourBlitzPile]) {
        pile.cards = []
    }

    // Set .active = true for the piles with movable cards 
    for (let pile of [yourPlayPile1, yourPlayPile2, yourPlayPile3, yourBlitzPile]) {
        pile.active = true;
    }
    yourNextCard.active = false;

    // Deal out the initial game state
    add_card_to_pile(remove_card_from_pile(yourDeck), yourPlayPile1);
    add_card_to_pile(remove_card_from_pile(yourDeck), yourPlayPile2);
    add_card_to_pile(remove_card_from_pile(yourDeck), yourPlayPile3);
    for (let i = 0; i < NUM_BLITZ_CARDS; i++) {
        add_card_to_pile(remove_card_from_pile(yourDeck), yourBlitzPile);
    }

    yourDeck.style.backgroundImage = "url('/card-pngs/Back\ Red\ 2.png')";

    // Initialize dragging card
    draggingCard = document.createElement("div");
    draggingCard.cards = [];
    draggingCard.classList.add("your-cards");
    draggingCard.id = "dragging-card";
    draggingCard.draggable = true;
    isDragging = false;
}
new_game();

yourDeck.onclick = draw_card;
//yourDeck.onclick = reset_deck;


yourNextCard.onmousedown = mouse_down
yourPlayPile1.onmousedown = mouse_down;
yourPlayPile2.onmousedown = mouse_down;
yourPlayPile3.onmousedown = mouse_down;
yourBlitzPile.onmousedown = mouse_down;

gameBoard.onmousemove = mouse_move;
gameBoard.onmouseup = mouse_up;

pileContainer.onmouseover = mouse_over;
pileContainer.onmouseleave = mouse_leave;

