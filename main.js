// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, push, child, onChildAdded, onChildChanged } from "firebase/database";


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Insert firebaseConfig here:


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);


// Values used for constructing a deck of cards
const suits = ["Clubs", "Diamond", "Hearts", "Spades"];
const values = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];


let gameContainer;  // Entire game board including opponents
let lakeContainer;  // Community piles
let yourStockPile;       // Your main deck that you draw from
let yourWastePile;   // Your face up pile that you draw cards to
let yourWorkPiles;
let yourWorkPile1;  // The piles that you can move cards around in
let yourWorkPile2;  //
let yourWorkPile3;
let yourWorkPile4;
let yourWorkPile5;  // 
let yourObjectivePile;  // The objective cards (if you empty it the game is over)
let draggingCard;   // The card that is currently being dragged by the user

let isDragging;     // True if a card is currently being dragged
let startMouseX;    // X value of mouse when clicked
let startMouseY;    // Y value of mouse when clicked
let startPile;      // The origin pile of the card currently being dragged
let pileCount;      // Number of piles in community board
let validPlacement; // True if the user is dragging a card over a pile where it is allowed to be dropped


const NUM_BLITZ_CARDS = 10;
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
        if (!(pile.id == "your-stock-pile")) {
            pile.style.backgroundImage = get_card_img(topCard);
        } 
    }
    
    return poppedCard;
}


/* ---- Dragging Stuff ---- */

function is_valid_placement(pile) {

    if (pile.classList.contains("community-cards")) {
        if (pile.cards[pile.cards.length-1].suit == draggingCard.cards[0].suit && pile.cards[pile.cards.length-1].value == draggingCard.cards[0].value - 1) {
            return true;
        }    
    } else if (pile.classList.contains("work-piles")) {
        if (pile.cards[pile.cards.length-1].suit == draggingCard.cards[0].suit && pile.cards[pile.cards.length-1].value - 1 == draggingCard.cards[0].value) {
            return true;
        }    
    } else {
        return false;
    }
}

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
        gameContainer.appendChild(draggingCard);
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

function update_lake(card, id) {
    console.log(card);
    if (card.value == 1) {
        let newPile = document.createElement("div");
        newPile.classList.add("your-cards");
        newPile.classList.add("community-cards");
        newPile.id = id;
        newPile.style.backgroundImage = get_card_img(card);
        newPile.cards = [card];
        lakeContainer.appendChild(newPile);
    } else {
        let pile = document.getElementById(id);
        pile.style.backgroundImage = get_card_img(card);
    }
}


let mouse_up = function(e) {
    if (!isDragging) {
        return
    } else {
        e.preventDefault();

        let curMouseX = parseInt(e.clientX);
        let curMouseY = parseInt(e.clientY);
        let targetElements = document.elementsFromPoint(curMouseX, curMouseY);

        if (targetElements.includes(lakeContainer)) {
            if (draggingCard.cards[0].value == 1) { // If card is an Ace
                let newPileId = push(child(ref(db), 'lake')).key;
                set(ref(db, `lake/${newPileId}`), {
                    card: draggingCard.cards[0]
                });
            } else if (is_valid_placement(targetElements[1])) {
                console.log(targetElements[1]);
                let id = targetElements[1].id;
                set(ref(db, `lake/${id}`), {
                    card: draggingCard.cards[0]
                });
            } else {
                console.log("NOPE");
                add_card_to_pile(draggingCard.cards[0], startPile)
            }
        } else if (targetElements.includes(yourWorkPiles)) {
            console.log(targetElements[1]);
            if (targetElements[1].cards.length == 0) {
                console.log("ZERO");
                add_card_to_pile(draggingCard.cards[0], targetElements[1])
            } else if (is_valid_placement(targetElements[1])) {
                console.log("VALID");
                add_card_to_pile(draggingCard.cards[0], targetElements[1])
            } else {
                console.log("NOPE");
                add_card_to_pile(draggingCard.cards[0], startPile)
            }
        } else {
            console.log("NOPE");
            add_card_to_pile(draggingCard.cards[0], startPile)
        }
        
        gameContainer.removeChild(draggingCard);
        draggingCard.cards = [];
        isDragging = false;

    }
}

let draw_card = function(e) {
    e.preventDefault();

    if (yourStockPile.cards.length != 0) {
        add_card_to_pile(remove_card_from_pile(yourStockPile), yourWastePile);
        yourWastePile.classList.add("draw-animation");
        
    } else if (yourStockPile.cards.length == 0) {
        yourStockPile.cards = yourWastePile.cards.reverse();
        yourWastePile.cards = [];

        yourStockPile.style.backgroundImage = "url('/card-pngs/Back\ Red\ 2.png')";
        yourWastePile.style.backgroundImage = null;

        yourWastePile.active = false;

        yourStockPile.classList.add("reset-deck");
    }
}

let reset_animation = function(e) {
    yourWastePile.classList.remove("draw-animation");
    yourStockPile.classList.remove("reset-deck");
}

let reset_deck = function(e) {
    console.log("hi");
    if (yourStockPile.cards.length == 0) {
        yourStockPile.cards = yourWastePile.cards.reverse();
        yourWastePile.cards = [];

        yourStockPile.style.backgroundImage = "url('/card-pngs/Back\ Red\ 2.png')";
        yourWastePile.style.backgroundImage = null;

        yourWastePile.active = false;
    }
}

/* ---- Community Stuff ---- */
let mouse_over = function(e) {
    //e.preventDefault();
    validPlacement = true;
    console.log(e.target);
}

let mouse_leave = function(e) {
    //e.preventDefault();
    validPlacement = false;
    console.log(validPlacement);
}


function new_game() {
    let deck = shuffleDeck(buildDeck());

    // Initialize game elements
    gameContainer = document.getElementById("game-container");
    lakeContainer = document.getElementById("lake-container");
    yourStockPile = document.getElementById("your-stock-pile");
    yourWastePile = document.getElementById("your-waste-pile");
    yourWorkPiles = document.getElementById("your-work-piles");
    yourWorkPile1 = document.getElementById("your-work-pile-1");
    yourWorkPile2 = document.getElementById("your-work-pile-2");
    yourWorkPile3 = document.getElementById("your-work-pile-3");
    yourWorkPile4 = document.getElementById("your-work-pile-4"); 
    yourWorkPile5 = document.getElementById("your-work-pile-5"); 
    yourObjectivePile = document.getElementById("your-objective-pile");

    // Initialize each piles cards array
    yourStockPile.cards = deck;
    for (let pile of [yourWastePile, yourWorkPile1, yourWorkPile2, yourWorkPile3, yourWorkPile4, yourWorkPile5, yourObjectivePile]) {
        pile.cards = []
    }

    // Set .active = true for the piles with movable cards 
    for (let pile of [yourWorkPile1, yourWorkPile2, yourWorkPile3, yourWorkPile4, yourWorkPile5, yourObjectivePile]) {
        pile.active = true;
    }
    yourWastePile.active = false;

    // Deal out the initial game state
    add_card_to_pile(remove_card_from_pile(yourStockPile), yourWorkPile1);
    add_card_to_pile(remove_card_from_pile(yourStockPile), yourWorkPile2);
    add_card_to_pile(remove_card_from_pile(yourStockPile), yourWorkPile3);
    add_card_to_pile(remove_card_from_pile(yourStockPile), yourWorkPile4);
    add_card_to_pile(remove_card_from_pile(yourStockPile), yourWorkPile5);
    for (let i = 0; i < NUM_BLITZ_CARDS; i++) {
        add_card_to_pile(remove_card_from_pile(yourStockPile), yourObjectivePile);
    }

    yourStockPile.style.backgroundImage = "url('/card-pngs/Back\ Red\ 2.png')";

    // Initialize dragging card
    draggingCard = document.createElement("div");
    draggingCard.cards = [];
    draggingCard.classList.add("your-cards");
    draggingCard.id = "dragging-card";
    draggingCard.draggable = true;
    isDragging = false;

    // When db updates
    set(ref(db), null);
    let lakeRef = ref(db, 'lake/');
    onChildAdded(lakeRef, (snapshot) => {
        if (snapshot.exists()) {
            update_lake(snapshot.val().card, snapshot.key);
        }
    });
    onChildChanged(lakeRef, (snapshot) => {
        if (snapshot.exists()) {
            update_lake(snapshot.val().card, snapshot.key);
        }
    });
}
new_game();

yourStockPile.onclick = draw_card;
yourStockPile.onmouseup = reset_animation;

yourWastePile.onmousedown = mouse_down
yourWorkPile1.onmousedown = mouse_down;
yourWorkPile2.onmousedown = mouse_down;
yourWorkPile3.onmousedown = mouse_down;
yourWorkPile4.onmousedown = mouse_down;
yourWorkPile5.onmousedown = mouse_down;
yourObjectivePile.onmousedown = mouse_down;

gameContainer.onmousemove = mouse_move;
gameContainer.onmouseup = mouse_up;
