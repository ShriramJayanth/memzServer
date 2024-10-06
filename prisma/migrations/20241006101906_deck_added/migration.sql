-- CreateTable
CREATE TABLE "Deck" (
    "id" SERIAL NOT NULL,
    "deckName" TEXT NOT NULL,
    "cards" JSONB NOT NULL,
    "test" JSONB NOT NULL,
    "learn" JSONB NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Deck_pkey" PRIMARY KEY ("id")
);
