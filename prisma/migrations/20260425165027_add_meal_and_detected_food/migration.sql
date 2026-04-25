-- CreateTable
CREATE TABLE "Meal" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "mealType" TEXT NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,

    CONSTRAINT "Meal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetectedFood" (
    "id" TEXT NOT NULL,
    "mealId" TEXT NOT NULL,
    "foodKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "portionGrams" INTEGER NOT NULL,
    "confidence" INTEGER NOT NULL,
    "phase" TEXT NOT NULL,
    "percentEaten" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DetectedFood_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Meal_childId_loggedAt_idx" ON "Meal"("childId", "loggedAt");

-- CreateIndex
CREATE INDEX "DetectedFood_mealId_idx" ON "DetectedFood"("mealId");

-- AddForeignKey
ALTER TABLE "Meal" ADD CONSTRAINT "Meal_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetectedFood" ADD CONSTRAINT "DetectedFood_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
