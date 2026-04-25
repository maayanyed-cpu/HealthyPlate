-- AlterTable
ALTER TABLE "Child" ADD COLUMN     "allergies" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "dietStyle" TEXT,
ADD COLUMN     "habits" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "intolerances" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "notes" TEXT;

-- CreateTable
CREATE TABLE "Food" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "category" TEXT NOT NULL,

    CONSTRAINT "Food_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TasteRating" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "rating" TEXT NOT NULL,
    "ratedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TasteRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TasteRating_childId_idx" ON "TasteRating"("childId");

-- CreateIndex
CREATE UNIQUE INDEX "TasteRating_childId_foodId_key" ON "TasteRating"("childId", "foodId");

-- AddForeignKey
ALTER TABLE "TasteRating" ADD CONSTRAINT "TasteRating_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TasteRating" ADD CONSTRAINT "TasteRating_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
