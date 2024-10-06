import express from "express";
import { createDeck,getAllDecks,getUserDecks,getDeckById } from "../controllers/card.js";

const router=express.Router();

router.post("/createdeck",createDeck);
router.get("/getdecks",getAllDecks);
router.post("/getuserdecks",getUserDecks);
router.post("/getdeckbyid",getDeckById);

export default router;
