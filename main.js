import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, push, child, onChildAdded, onChildChanged, onChildRemoved, onDisconnect, get, runTransaction } from "firebase/database";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";


/* ----- Firebase Stuff ----- */
const firebaseConfig = {
    apiKey: import.meta.env.VITE_API_KEY,
    authDomain: import.meta.env.VITE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_DATABASE_URL,
    projectId: import.meta.env.VITE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);


/* ----- Lobby Stuff ----- */
let lobbyID;
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get("lobby")) {
    lobbyID = urlParams.get("lobby");
} else {
    lobbyID = push(child(ref(db), 'lobbies/')).key;
    window.location.href = 'http://127.0.0.1:5173/?lobby=' + lobbyID;
}


/* ----- User Stuff----- */
let userID;
let userRef;
const auth = getAuth();

onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/firebase.User
        userID = user.uid;
        userRef = ref(db, `lobbies/${lobbyID}/users/${userID}`);

        set(userRef, {
            name: 'Player', 
            numobjcards: 0,
            stockpile: '',
            wastepile: '',
            workpile1: '',
            workpile2: '',
            workpile3: '',
            workpile4: '',
            workpile5: '',
            objpile: '',
        });

        onDisconnect(userRef).remove();
    } else {
        // User signed out

        // This doesn't work. Might need something server side to clear a lobby when the last user leaves
        // get(ref(db, `lobbies/${lobbyID}/users`)).then((snapshot) => {
        //     if (!snapshot.exists()) {
        //         set(ref(db, `lobbies/${lobbyID}`), null);
        //     }
        // });
    }
});

signInAnonymously(auth)
    .then(() => {
    // Signed in..
    })
    .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode, errorMessage);
});

// This is finicky, as every doc has stated. I guess it doesn't work if a user is in incognito?
// Will need a better solution in the future but for now this will work maybe 90% of the time.
// ----> Try firebase cloud functions. <----
//
// Clear the entire lobby node within firebase if the last user closes the page.
window.addEventListener("beforeunload", () => {
    get(ref(db, `lobbies/${lobbyID}/users`)).then((snapshot) => {
        if (Object.keys(snapshot.val()).length <= 1) {
            set(ref(db, `lobbies/${lobbyID}`), null);
        }
    });
});



/* ----- User Preferences ----- */
let nameForm = document.getElementById("name-form");
nameForm.addEventListener('submit', function(event) {
    event.preventDefault();
    nameField.blur();
});

let nameField = document.getElementById("name-field")
nameField.addEventListener('input', function(e) {
    e.preventDefault();
    set(ref(db, `lobbies/${lobbyID}/users/${userID}/name`), nameField.value);
});


/* ----- Supporting game functions ----- */

/**
 * Constructs an in order deck of cards into an array, 
 * with each card taking the form {value: value, suit: suit}
 * @returns {Array} deck
 */
function buildDeck() {
    let suits = ["Clubs", "Diamond", "Hearts", "Spades"];
    let values = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]; // Update this base on user preference
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
 * @param  {Card} card
 * @return {String} cardImg
 */
function get_card_img(card) {
    let cardImg = `url('/card-pngs/${card.suit} ${card.value}.png')`

    return cardImg;
}

/**
 * Updates the array and background image of the pile element.
 * Confirms that the pile is set to active.
 * @param  {Card} card
 * @param  {HTMLElement} pile
 */
function add_card_to_pile(card, pile) {
    if (pile.cards.length == 0) {
        pile.active = true;
    }
    pile.cards.push(card);
    pile.style.backgroundImage = get_card_img(card);

    let pileName = pile.classList[0];
    set(ref(db, `lobbies/${lobbyID}/users/${userID}/${pileName}`), card);
    if (pileName == 'objpile') {
        runTransaction(ref(db, `lobbies/${lobbyID}/users/${userID}/numobjcards`), (currentValue) => {
            return (currentValue || 0) + 1;
        });
    }

}

/**
 * Removes the top card from the given pile. Updates the array and
 * background image of the pile. Sets pile.active to false if there
 * are not more cards in the pile.
 * @param  {HTMLElement} pile 
 */
function remove_card_from_pile(pile) {
    let poppedCard = pile.cards.pop();
    let topCard = pile.cards[pile.cards.length - 1];
    let pileName = pile.classList[0];

    if (pile.cards.length == 0) {
        pile.style.backgroundImage = null;
        pile.active = false;
        set(ref(db, `lobbies/${lobbyID}/users/${userID}/${pileName}`), '');
    } else {
        if (!(pile.id == "your-stock-pile")) {
            pile.style.backgroundImage = get_card_img(topCard);
            set(ref(db, `lobbies/${lobbyID}/users/${userID}/${pileName}`), topCard);
        } 
    }

    if (pileName == 'objpile') {
        runTransaction(ref(db, `lobbies/${lobbyID}/users/${userID}/numobjcards`), (currentValue) => {
            return (currentValue || 0) - 1;
        });
    }
    
    return poppedCard;
}


/* ---- Dragging Functions ---- */

/**
 * Checks of the given pile is a valid spot to place the card currently being dragged.
 * @param {HTMLElement} pile 
 * @returns {boolean}
 */
function is_valid_placement(pile) { // Make two separate methods
    // The dragged card is over the "lake"...
    if (pile.classList.contains("community-cards")) {
        // The card is over a valid pile
        if (pile.cards[pile.cards.length-1].suit == draggingCard.cards[0].suit && pile.cards[pile.cards.length-1].value == draggingCard.cards[0].value - 1) {
            return true;
        }
    // The card is over the "work pikes"...
    } else if (pile.classList.contains("work-piles")) {
        // The card is over a valid pile
        if (pile.cards[pile.cards.length-1].suit == draggingCard.cards[0].suit && pile.cards[pile.cards.length-1].value - 1 == draggingCard.cards[0].value) {
            return true;
        }    
    } else {
        return false;
    }
}

/** 
 * Runs when the user clicks on a pile that this function is applied to:
 *  - waste pile
 *  - active work piles
 *  - objective pile
 */
let grab_card = function(e) {
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

/** 
 * Runs when the user drags a card.
 * Updates the position of the card being dragged relative to the users cursor.
 */
let drag_card = function(e) {
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

/** 
 * Runs when the user lets go of a card
 * Adds the card to the selected pile if it is valid, otherwise returns the card to it's
 * origin pile.
 */
let place_card = function(e) { // Highlight pile when user is hovering over it
    if (!isDragging) {
        return
    } else {
        e.preventDefault();

        let curMouseX = parseInt(e.clientX);
        let curMouseY = parseInt(e.clientY);
        let targetElements = document.elementsFromPoint(curMouseX, curMouseY);

        // Seperate the lake and work piles
        if (targetElements.includes(lakeContainer)) {
            if (draggingCard.cards[0].value == 1) { // If card is an Ace
                let newPileId = push(child(ref(db), `lobbies/${lobbyID}/lake`)).key;
                set(ref(db, `lobbies/${lobbyID}/lake/${newPileId}`), { // Pull out the db path
                    card: draggingCard.cards[0]
                });
            } else if (is_valid_placement(targetElements[1])) {
                console.log(targetElements[1]);
                let id = targetElements[1].id;
                set(ref(db, `lobbies/${lobbyID}/lake/${id}`), {
                    card: draggingCard.cards[0]
                });
            } else {
                console.log("NOPE");
                add_card_to_pile(draggingCard.cards[0], startPile)
            }
        } else if (targetElements.includes(yourWorkPiles)) {
            if (targetElements[1].classList.contains("work-piles") && targetElements[1].cards.length == 0) {
                console.log(targetElements[1]);
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


/* ---- Stock Pile Functions ---- */

let draw_card = function(e) {
    e.preventDefault();

    if (yourStockPile.cards.length != 0) {
        let poppedCard = remove_card_from_pile(yourStockPile);
        add_card_to_pile(poppedCard, yourWastePile);
        yourWastePile.classList.add("draw-animation");

        set(ref(db, `lobbies/${lobbyID}/users/${userID}/wastepile`), poppedCard);
    } else if (yourStockPile.cards.length == 0) {
        yourStockPile.cards = yourWastePile.cards.reverse();
        yourWastePile.cards = [];

        yourStockPile.style.backgroundImage = "url('/card-pngs/Back\ Red\ 2.png')";
        yourWastePile.style.backgroundImage = null;
        set(ref(db, `lobbies/${lobbyID}/users/${userID}/wastepile`), '');
        set(ref(db, `lobbies/${lobbyID}/users/${userID}/stockpile`), 'facedown');

        yourWastePile.active = false;

        yourStockPile.classList.add("reset-deck");
    }
}

let reset_animation = function() { // Comment
    yourWastePile.classList.remove("draw-animation");
    yourStockPile.classList.remove("reset-deck");
}

/* ----- Initialize the game ----- */

// Game elements
let gameContainer = document.getElementById("game-container");   // Where all the game elements are contained
let lakeContainer = document.getElementById("lake-container");   // Community piles - each player can stack cards onto them
let yourStockPile = document.getElementById("your-stock-pile");  // Your main deck that you draw from
let yourWastePile = document.getElementById("your-waste-pile");  // Your face up pile that you draw cards to
let yourWorkPiles = document.getElementById("your-work-piles");  // The piles that you can move cards around in
let yourWorkPile1 = document.getElementById("your-work-pile-1");
let yourWorkPile2 = document.getElementById("your-work-pile-2");
let yourWorkPile3 = document.getElementById("your-work-pile-3");
let yourWorkPile4 = document.getElementById("your-work-pile-4"); 
let yourWorkPile5 = document.getElementById("your-work-pile-5"); 
let yourObjectivePile = document.getElementById("your-objective-pile"); // The objective cards (if you empty it the game is over)

yourStockPile.onclick = draw_card;
yourStockPile.onmouseup = reset_animation;

yourWastePile.onmousedown = grab_card;
yourWorkPile1.onmousedown = grab_card;
yourWorkPile2.onmousedown = grab_card;
yourWorkPile3.onmousedown = grab_card;
yourWorkPile4.onmousedown = grab_card;
yourWorkPile5.onmousedown = grab_card;
yourObjectivePile.onmousedown = grab_card;

gameContainer.onmousemove = drag_card;
gameContainer.onmouseup = place_card;

// Initialize dragging card
let draggingCard = document.createElement("div"); // The card that is currently being dragged by the user
draggingCard.cards = [];
draggingCard.classList.add("your-cards");
draggingCard.id = "dragging-card";

let isDragging = false; // True if a card is currently being dragged
let startMouseX;        // X value of mouse when initially clicked
let startMouseY;        // Y value of mouse when initially clicked
let startPile;          // The origin pile of the card currently being dragged

// Game variables
const NUM_BLITZ_CARDS = 10;
const NUM_WORK_PILES = 3; // TODO: Make this dependant on the number of players


/* ----- Lake Listeners ----- */

let lakeRef = ref(db, `lobbies/${lobbyID}/lake/`);
onChildAdded(lakeRef, (snapshot) => {
    if (snapshot.exists()) {
        let card = snapshot.val().card;
        let id = snapshot.key;
        let newPile = document.createElement("div");
        newPile.classList.add("your-cards");
        newPile.classList.add("community-cards");
        newPile.id = id;
        newPile.style.backgroundImage = get_card_img(card);
        newPile.cards = [card];
        lakeContainer.appendChild(newPile);
    }
});

onChildChanged(lakeRef, (snapshot) => {
    if (snapshot.exists()) {
        let card = snapshot.val().card;
        let id = snapshot.key;
        let pile = document.getElementById(id);
        pile.cards.push(card);
        pile.style.backgroundImage = get_card_img(card);
    }
});

onChildRemoved(lakeRef, (snapshot) => {
    if (snapshot.exists()) {
        lakeContainer.removeChild(document.getElementById(snapshot.key));
    }
});


/* ----- Opponent Listeners ----- */

function build_opp_tableau() {
    let oppHTML = 
        `<div class="opp-tableau tableau">
            <div class="stockpile opp-cards"></div>
            <div class="wastepile opp-cards"></div>
            <div class="opp-work-piles work-piles">
                <div class="workpile1 opp-cards"></div>
                <div class="workpile2 opp-cards"></div>
                <div class="workpile3 opp-cards"></div>
                <div class="workpile4 opp-cards"></div>
                <div class="workpile5 opp-cards"></div>
            </div>
            <div class="objpile opp-cards"></div>
        </div>
        <div class="flex">
            <p class="name"></p>
            <p class="numobjcards"></p>
        </div>`;
    return oppHTML;
}

let usersRef = ref(db, `lobbies/${lobbyID}/users/`);
let oppLeft = document.getElementById("opponent-container-left");
let oppRight = document.getElementById("opponent-container-right");
let numOpps = 0;
onChildAdded(usersRef, (snapshot) => {
    if (snapshot.exists()) {
        let id = snapshot.key;
        if (id != userID) {
            let opp = document.createElement("div");
            opp.classList.add("opponent");
            opp.id = id;
            opp.innerHTML = build_opp_tableau();

            if (numOpps % 2 == 0) {
                opp.classList.add("opponent-left");
                oppLeft.appendChild(opp);
            } else {
                opp.classList.add("opponent-right");
                oppRight.appendChild(opp);
            }
            numOpps++;

            snapshot.forEach((childSnapshot) => {
                if (childSnapshot.key == "name" || childSnapshot.key == "numobjcards") {
                    let updatedOpp = document.querySelector(`#${id} .${childSnapshot.key}`);
                    updatedOpp.innerHTML = childSnapshot.val();
                } else {
                    let updatedOpp = document.querySelector(`#${id} .${childSnapshot.key}`); 
                    updatedOpp.style.backgroundImage = get_card_img(childSnapshot.val());
                }
            });

            let oppStockPile = document.querySelector(`#${id} .stockpile`);
            oppStockPile.style.backgroundImage = "url('/card-pngs/Back\ Red\ 2.png')";
        }
    }
});

onChildChanged(usersRef, (snapshot) => {
    if (snapshot.exists()) {
        let id = snapshot.key;
        if (id != userID) {
            snapshot.forEach((childSnapshot) => {
                if (childSnapshot.key == "name" || childSnapshot.key == "numobjcards") {
                    let updatedOpp = document.querySelector(`#${id} .${childSnapshot.key}`);
                    updatedOpp.innerHTML = childSnapshot.val();
                } else {
                    console.log(childSnapshot.key);

                    // Problem with null values when there aren't any cards in a pile
                    let updatedOpp = document.querySelector(`#${id} .${childSnapshot.key}`);
                    
                    if (childSnapshot.val() == '') {
                        updatedOpp.style.backgroundImage = null;
                    } else if (childSnapshot.val() == 'facedown') {
                        updatedOpp.style.backgroundImage = "url('/card-pngs/Back\ Red\ 2.png')";
                    } else {
                        updatedOpp.style.backgroundImage = get_card_img(childSnapshot.val());
                    }
                }
            });
        }
    }
});

onChildRemoved(usersRef, (snapshot) => {
    if (snapshot.exists()) {
        let id = snapshot.key;
        if (id != userID) {
            let opp = document.getElementById(snapshot.key);
            if (opp.classList.contains("opponent-left")) {
                oppLeft.removeChild(document.getElementById(snapshot.key));
            } else {
                oppRight.removeChild(document.getElementById(snapshot.key));
            }
            numOpps--;
        }   
    }
});


/* ----- Buttons ----- */

let dealCards = document.getElementById("deal-cards");
dealCards.addEventListener("click", () => {
    let deck = shuffleDeck(buildDeck());

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
    yourWastePile.style.backgroundImage = null;

    // Deal out the initial game state
    add_card_to_pile(remove_card_from_pile(yourStockPile), yourWorkPile1);
    add_card_to_pile(remove_card_from_pile(yourStockPile), yourWorkPile2);
    add_card_to_pile(remove_card_from_pile(yourStockPile), yourWorkPile3);
    add_card_to_pile(remove_card_from_pile(yourStockPile), yourWorkPile4);
    add_card_to_pile(remove_card_from_pile(yourStockPile), yourWorkPile5);

    set(ref(db, `lobbies/${lobbyID}/users/${userID}/numobjcards`), 0);
    for (let i = 0; i < NUM_BLITZ_CARDS; i++) {
        let poppedCard = remove_card_from_pile(yourStockPile);
        add_card_to_pile(poppedCard, yourObjectivePile);
    }

    yourStockPile.style.backgroundImage = "url('/card-pngs/Back\ Red\ 2.png')";
    set(ref(db, `lobbies/${lobbyID}/users/${userID}/stockpile`), 'facedown');
});

let clearLake = document.getElementById("clear-lake");
clearLake.addEventListener("click", () => {
    set(ref(db, `lobbies/${lobbyID}/lake/`), null);
});

let invite = document.getElementById("invite");
invite.addEventListener("click", () => {
    navigator.clipboard.writeText('http://127.0.0.1:5173/?lobby=' + lobbyID);
});
