import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Controller function to create a deck and set test and learn JSON
export const createDeck = async (req, res) => {
  const { deckName, cards, createdBy } = req.body;

  try {
    // Create a test JSON dynamically based on the cards provided
    const test = {
      questions: cards.map(card => ({
        question: `What is the meaning of ${card.word}?`,
        options: generateOptions(card.meaning, cards), // Generate options from the same deck
        correctAnswer: card.meaning
      })),
    };

    // Create a learn JSON based on the cards provided
    const learn = cards.map(card => ({
      word: card.word,
      meaning: card.meaning
    }));

    // Push the deck to the database
    const newDeck = await prisma.deck.create({
      data: {
        deckName,
        cards,
        createdBy,
        test,
        learn,
      },
    });

    res.status(201).json({ message: "Deck created successfully", deck: newDeck });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creating deck" });
  }
};

// Helper function to generate options from the same deck
const generateOptions = (correctAnswer, cards) => {
  // Get meanings of all cards except the current correct answer
  const otherOptions = cards
    .filter(card => card.meaning !== correctAnswer)
    .map(card => card.meaning);

  // Select 3 random options from otherOptions and add the correct answer
  const options = shuffleArray([correctAnswer, ...getRandomItems(otherOptions, 3)]);
  
  return options;
};

// Helper function to shuffle options array
const shuffleArray = (array) => {
  return array.sort(() => Math.random() - 0.5);
};

// Helper function to select random items from an array
const getRandomItems = (array, numItems) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, numItems);
};


// Controller to get all decks
export const getAllDecks = async (req, res) => {
    try {
      // Fetch all decks from the database
      const decks = await prisma.deck.findMany();
  
      // Return the list of decks in the response
      res.status(200).json(decks);
    } catch (error) {
      console.error("Error fetching decks:", error);
      res.status(500).json({ error: "Error fetching decks" });
    }
  };

  export const getUserDecks = async (req, res) => {
    const { username } = req.body; // Extract username from the request body
  
    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }
  
    try {
      // Fetch all decks where the 'createdBy' matches the provided username
      const userDecks = await prisma.deck.findMany({
        where: {
          createdBy: username, // Filter decks by the 'createdBy' field
        },
        select: {
          id: true, // Include deck id
          deckName: true, // Include deck name
          cards: true, // Include cards (if necessary)
          createdBy: true, // Include creator name
        },
      });
  
      if (userDecks.length === 0) {
        return res.status(404).json({ message: "No decks found for this user" });
      }
  
      return res.status(200).json(userDecks); // Return the list of decks
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Something went wrong" });
    }
  };

  // Controller to get a specific deck by its ID
export const getDeckById = async (req, res) => {
    try {
      const { deckId } = req.body;
  
      if (!deckId) {
        return res.status(400).json({ error: "deckId is required" });
      }
  
      // Find the deck by its ID
      const deck = await prisma.deck.findUnique({
        where: {
          id: deckId,
        },
      });
  
      // If no deck is found, return a 404 error
      if (!deck) {
        return res.status(404).json({ error: "Deck not found" });
      }
  
      // Return the deck details
      return res.status(200).json(deck);
    } catch (error) {
      console.error("Error fetching deck:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };