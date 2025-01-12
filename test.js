//fonction qui fait des requetes asyncrones a l'API - fait fetch(), qui contacte l'API
async function callAPI(uri) {
    try {
        console.log("-- callAPI - Start --");
        console.log("uri = ", uri);

        //au lieux de await fetch(uri).
        //inclut automatiquement les données JSON dans response.data, contrairement à fetch où vous devez appeler explicitement .json()
        const response = await axios.get(uri);
        console.log("response = ", response);

        //La méthode axios.get renvoie directement un objet JavaScript, et les données de la réponse se trouvent dans response.data du coup pas besoin de "await = response.json()"
        const data = response.data;
        console.log("data = ", data);

        console.log("-- callAPI - end --");

        // renvoi des données
        return data;
    }
    catch (error) {
        console.error("C'EST N'IMPORTE QUOI LE CODE, Erreur dans le draw: ", error.message);
    }
}



// constante globale: l'URI du endpoint de demande de nouveau deck
const API_ENDPOINT_NEW_DECK = "https://deckofcardsapi.com/api/deck/new/";
//const API_ENDPOINT_NEW_DECK = "https://invalid-url.com/api/deck/new/";

//fonction de demande de nouveau deck
async function getNewDeck() {
    console.log(">> getNewDeck");

    return await callAPI(API_ENDPOINT_NEW_DECK);
}




// variable globale: l'id du deck utilisé, dans lequel on pioche
let idDeck = null;
let pileName = "discard";
//fonctions (syntaxe de fonction fléchée) qui renvoient des URI dynamiques de demande de mélange du deck et de pioche
const getApiEndpointShuffleDeck = () => `https://deckofcardsapi.com/api/deck/${idDeck}/shuffle/`;

//fonction de demande de mélange du deck
async function shuffleDeck() {
    console.log(">> shuffleDeck");

    return await callAPI(getApiEndpointShuffleDeck());
}





//fonctions (syntaxe de fonction fléchée) qui renvoient des URI dynamiques de demande de mélange du deck et de pioche
const getApiEndpointDrawCard = () => `https://deckofcardsapi.com/api/deck/${idDeck}/draw/?count=1`;

//fonction de demande de pioche dans le deck
async function drawCard() {
    console.log(">> drawCard");

    return await callAPI(getApiEndpointDrawCard());
}






// supprime les cartes de l'ancien deck du DOM
const cleanDomCardsFromPreviousDeck = () => 
    //récuperation des cartes (classe CSS "card")
    document.querySelectorAll(".card")
    //et pour chacune de ces cartes
    .forEach((card) => 
    //supression du DOM
    card.remove()
);



// constante globale: l'URI du endpoint de demande de nouveau deck
const API_ENDPOINT_BACK_CARD = "https://deckofcardsapi.com/static/img/back.png";

//Quantité de cartes dans le deck affiché a l'écran
let totalCards = 52;



//fonction de réinitialisation (demande de nouvea deck + demande de mélange de ce nouveau deck)
async function actionReset() {
    //vider dans le DOM les cartes de l'ancien deck
    cleanDomCardsFromPreviousDeck();
    
    //récupération d'un nouveau deck
    const newDeckResponse = await getNewDeck();
    
    //récuperation de l'id de ce nouveau deck dans les données recues et mise a jour de la variable globale
    idDeck = newDeckResponse.deck_id;
    
    //mélange du deck
    await shuffleDeck();
    
    //afficher le bouton DRAW lorsqu'on click sur RESET au cas ou il disparait 
    const drawButton = document.getElementById("action-draw");
    drawButton.style.display = "inline-block";
    //affiche le tas de cartes caché lorsqu'on appuis sur reset + reset de totalCards a sa valeur initiale.
    const backCards = document.getElementById("back-card");
    backCards.style.display = "block";
    totalCards = 52;
    createCardStack(totalCards);
}




//elements HTML utiles pour les evenement et pour la manipulation du DOM
const cardsContainer = document.getElementById("cards-container");
// ajoute une carte dans le DOM (dans la zone des cartes piochées) d'apres l'URI de son image
function addCardToDomByImgUri(imgUri) {
    //creation de l'élément HTML "img", de class CSS "card"' et avec pour attribut HTML "src" l'URI recue en argument
    const imgCardHtmlElement = document.createElement("img");
    imgCardHtmlElement.classList.add("card");
    imgCardHtmlElement.src = imgUri;
    
    //ajout de cette image dans la zone des cartes piochées (en derniere position, dernier enfant de cardsContainer)
    cardsContainer.append(imgCardHtmlElement);
}



const backCard = document.getElementById("back-card");

// Creation de l'affichage du deck a lecran.
function createCardStack(count) {
    // Nettoie les cartes précédentes
    backCard.innerHTML = "";
    
    // Crée des images pour chaque carte
    for (let i = 0; i < count; i++) {
        const imgBackCard = document.createElement("img");
        imgBackCard.classList.add("back-card-img");
        imgBackCard.src = API_ENDPOINT_BACK_CARD;
        
    // Ajoute un décalage pour créer l'effet de pile
    imgBackCard.style.position = "absolute";
    imgBackCard.style.top = `${i * 0.7}px`; // Décalage vertical
    imgBackCard.style.left = `${i * 0.7}px`; // Décalage horizontal

    backCard.appendChild(imgBackCard);
    }

    // Si aucune carte ne reste, cacher le tas
    if (count === 0) {
        backCard.style.display = "none";
    } else {
        backCard.style.display = "block";
    }
}
// Nombre initial de cartes dans le tas
function removeCardFromStack() {
    if (totalCards > 0) {
        totalCards--; // Diminue le compteur
        createCardStack(totalCards); // Réaffiche le tas avec le nouveau nombre
    }
}


async function discardCard(cardCode) {
    const uri = `https://deckofcardsapi.com/api/deck/${idDeck}/pile/${pileName}/add/?cards=${cardCode}`;
     
    return await callAPI(uri);
}

const cardOffsets = {
    HEARTS: 0,
    CLUBS: 0,
    SPADES: 0,
    DIAMONDS: 0,
};
//fonction qui demande a piocher une carte, pui qui fait l'appel pour l'integrer dans le DOM
async function actionDraw() {
    const drawButton = document.getElementById("action-draw");
    
    // Désactiver le bouton pendant la requête
    drawButton.disabled = true;
    
    //Réactivé dans le bloc finally pour garantir que le bouton est remis dans son état initial, même en cas d'erreur.
    try {
        // Effectuer la requête pour piocher une carte
        const drawCardResponse = await drawCard();

        // Modifier le nombre de cartes restantes dans le deck
        const remainingCards = drawCardResponse.remaining;
        if (remainingCards === 0) {
            // Cacher le bouton DRAW si remaining est 0
            drawButton.style.display = "none";
        }

        // Récupération de la carte piochée
        const card = drawCardResponse.cards[0];
        const imgCardUri = card.image; // URI de l'image de la carte
        const suit = card.suit.toLowerCase(); // Exemple : "hearts", "clubs", "spades", "diamonds"

        // Vérifier si le div pour la couleur existe déjà
        let suitDiv = document.getElementById(`${suit}div`);
        if (!suitDiv) {
            // Si le conteneur n'existe pas, le créer
            suitDiv = document.createElement("div");
            suitDiv.id = `${suit}div`; // Exemple : "heartdiv"
            suitDiv.classList.add("suit-div");

            // Ajouter le conteneur dans #topcards
            const topCards = document.getElementById("topcards");
            topCards.appendChild(suitDiv);
        }

        // Créer l'image de la carte
        const suitHtmlElement = document.createElement("img");
        suitHtmlElement.classList.add("card");
        suitHtmlElement.src = imgCardUri;
        suitHtmlElement.style.position = "absolute"; // Position absolue pour empiler les cartes
        suitHtmlElement.style.top = `${cardOffsets[card.suit]}px`; // Décalage vertical dynamique

        // Ajouter la carte dans le conteneur
        suitDiv.appendChild(suitHtmlElement);

        // Ajouter la carte à la pile de défausse via l'API
        await discardCard(card.code);

        // Augmenter le décalage pour la prochaine carte de ce type
        cardOffsets[card.suit] += 30; // Incrément dynamique

        // Supprimer une carte de la pile (tas)
        removeCardFromStack();
    } catch (error) {
        console.error("Erreur lors de la pioche de la carte :", error.message);
    } finally {
        // Réactiver le bouton une fois la requête terminée
        drawButton.disabled = false;
    }
}





//appel d'initialisation au lancement de l'application
actionReset();
createCardStack(totalCards);
//elements HTML utilses pour les evenements et pour la manipulation du DOM
const actionResetButton = document.getElementById("action-reset");
const actionDrawButton = document.getElementById("action-draw");

// ecoutes devenement sur les bouton d'action
actionResetButton.addEventListener("click", actionReset);

actionDrawButton.addEventListener("click", actionDraw);


//https://deckofcardsapi.com/api/deck/<<deck_id>>/pile/<<pile_name>>/add/?cards=AH,2H,3H,4H,5H,6H,7H,8H,9H,0H,JH,QH,KH
