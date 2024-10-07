import { PrismaClient } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";
const prisma = new PrismaClient();

export const createDeck = async (req, res) => {
  const { deckName, cards, createdBy } = req.body;

  try {
    let test, learn;
    try {
      test = await getAIResponse(cards);
      learn = await getSpacedRepetitionFlashcards(cards);
    } catch (aiError) {
      console.warn("AI failed, falling back to manual function:", aiError);

      test = {
        questions: cards.map((card) => ({
          question: `What is the meaning of ${card.word}?`,
          options: generateOptions(card.meaning, cards),
          correctAnswer: card.meaning,
        })),
      };

      learn = cards.map((card) => ({
        word: card.word,
        meaning: card.meaning,
      }));
    }

    const newDeck = await prisma.deck.create({
      data: {
        deckName,
        cards,
        createdBy,
        test,
        learn,
      },
    });

    res
      .status(201)
      .json({ message: "Deck created successfully", deck: newDeck });
  } catch (error) {
    console.error("Error creating deck:", error);
    res.status(500).json({ error: "Error creating deck" });
  }
};

const generateOptions = (correctAnswer, cards) => {
  const otherOptions = cards
    .filter((card) => card.meaning !== correctAnswer)
    .map((card) => card.meaning);

  const options = shuffleArray([
    correctAnswer,
    ...getRandomItems(otherOptions, 3),
  ]);

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

export const getAIResponse = async (cards) => {
  const genAI = new GoogleGenerativeAI(process.env.API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const wordList = cards
    .map((card) => `${card.word}: ${card.meaning}`)
    .join(", ");

  const prompt = `
      Create a multiple-choice quiz from the following word-meaning pairs:
      ${wordList}.
      Prioritize difficult or rarely used words and ensure repetition for better memorization. Provide the result as a JSON object with the following structure:
      {
        "questions": [
          {
            "question": "What is the meaning of {word}?",
            "options": ["meaning1", "meaning2", "meaning3", "meaning4"],
            "correctAnswer": "{correctMeaning}"
          },
          {
            "question": "Which word means {meaning}?",
            "options": ["word1", "word2", "word3", "word4"],
            "correctAnswer": "{correctWord}"
          }
        ]
      }
      Make sure to balance word and meaning questions and repeat the tough ones.
    `;

  const result = await model.generateContent(prompt);

  try {
    let responseText = result.response.candidates[0].content.parts[0].text;

    responseText = responseText.replace(/```json|```/g, "").trim();

    const mcqQuiz = JSON.parse(responseText);

    return mcqQuiz;
  } catch (error) {
    console.error("Error parsing the AI response into JSON:", error);
    throw new Error("Failed to parse AI response into valid JSON");
  }
};

const cards = [
  {
    word: "prodigious",
    meaning: "remarkably or impressively great in extent, size, or degree",
  },
  { word: "obfuscate", meaning: "render obscure, unclear, or unintelligible" },
  { word: "gregarious", meaning: "fond of company; sociable" },
  { word: "laconic", meaning: "using very few words" },
  { word: "deleterious", meaning: "causing harm or damage" },
];

export const getSpacedRepetitionFlashcards = async (cards) => {
  const genAI = new GoogleGenerativeAI(process.env.API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    You are given the following word-meaning pairs:
    ${cards.map((card) => `${card.word}: ${card.meaning}`).join(", ")}.
    
    Based on general words difficulty, prioritize difficult words and repeat them more often. Return the flashcard list where hard words are repeated for better memorization. give json only , nothing else needed.
    Provide the output in the following JSON format:
    [
      {"word":"ikkai","meaning":"1"},
      {"word":"ni-kai","meaning":"2"},
      {"word":"sankai","meaning":"3"},
      {"word":"yonkai","meaning":"4"},
      {"word":"go-kai","meaning":"5"},
      {"word":"sankai","meaning":"3"} // repeated word
    ]
      make sure to repeat the tough ones.
  `;

  const result = await model.generateContent(prompt);

  try {
    let responseText = result.response.candidates[0].content.parts[0].text;

    responseText = responseText.replace(/```json|```|\/\/.*/g, "").trim();

    if (
      responseText[0] !== "[" &&
      responseText[responseText.length - 1] !== "]"
    ) {
      throw new Error("Invalid JSON format");
    }

    const flashcardsWithRepetition = JSON.parse(responseText);

    return flashcardsWithRepetition;
  } catch (error) {
    console.error("Error parsing AI response into JSON:", error);
    throw new Error("Failed to parse AI response into valid JSON");
  }
};
