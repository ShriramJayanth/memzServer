import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const createDeck = async (req, res) => {
  const { deckName, cards, createdBy } = req.body;

  try {
    const test = {
      questions: cards.map(card => ({
        question: `What is the meaning of ${card.word}?`,
        options: generateOptions(card.meaning, cards),
        correctAnswer: card.meaning
      })),
    };

    const learn = cards.map(card => ({
      word: card.word,
      meaning: card.meaning
    }));

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


const generateOptions = (correctAnswer, cards) => {

  const otherOptions = cards
    .filter(card => card.meaning !== correctAnswer)
    .map(card => card.meaning);


  const options = shuffleArray([correctAnswer, ...getRandomItems(otherOptions, 3)]);
  
  return options;
};

const shuffleArray = (array) => {
  return array.sort(() => Math.random() - 0.5);
};


const getRandomItems = (array, numItems) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, numItems);
};


export const getAllDecks = async (req, res) => {
    try {
      const decks = await prisma.deck.findMany();
  
      res.status(200).json(decks);
    } catch (error) {
      console.error("Error fetching decks:", error);
      res.status(500).json({ error: "Error fetching decks" });
    }
  };

  export const getUserDecks = async (req, res) => {
    const { username } = req.body;
  
    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }
  
    try {
      const userDecks = await prisma.deck.findMany({
        where: {
          createdBy: username,
        },
        select: {
          id: true, 
          deckName: true, 
          cards: true,
          createdBy: true, 
        },
      });
  
      if (userDecks.length === 0) {
        return res.status(404).json({ message: "No decks found for this user" });
      }
  
      return res.status(200).json(userDecks);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Something went wrong" });
    }
  };

 
export const getDeckById = async (req, res) => {
    try {
      const { deckId } = req.body;
  
      if (!deckId) {
        return res.status(400).json({ error: "deckId is required" });
      }
  
      
      const deck = await prisma.deck.findUnique({
        where: {
          id: deckId,
        },
      });
  
      
      if (!deck) {
        return res.status(404).json({ error: "Deck not found" });
      }
  
      
      return res.status(200).json(deck);
    } catch (error) {
      console.error("Error fetching deck:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };