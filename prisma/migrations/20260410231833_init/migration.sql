-- CreateTable
CREATE TABLE "Sheep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "earTag" TEXT NOT NULL,
    "name" TEXT,
    "sex" TEXT NOT NULL,
    "birthDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "lineage" TEXT,
    "motherId" TEXT,
    "fatherId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Sheep_motherId_fkey" FOREIGN KEY ("motherId") REFERENCES "Sheep" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Sheep_fatherId_fkey" FOREIGN KEY ("fatherId") REFERENCES "Sheep" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "sheepId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Photo_sheepId_fkey" FOREIGN KEY ("sheepId") REFERENCES "Sheep" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WeightRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weight" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "sheepId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WeightRecord_sheepId_fkey" FOREIGN KEY ("sheepId") REFERENCES "Sheep" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Litter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matingDate" DATETIME,
    "lambingDate" DATETIME,
    "bornCount" INTEGER NOT NULL,
    "weanedCount" INTEGER,
    "motherId" TEXT NOT NULL,
    "fatherId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Litter_motherId_fkey" FOREIGN KEY ("motherId") REFERENCES "Sheep" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Litter_fatherId_fkey" FOREIGN KEY ("fatherId") REFERENCES "Sheep" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HealthRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "medication" TEXT,
    "withdrawalDays" INTEGER,
    "cost" REAL,
    "attachmentUrl" TEXT,
    "sheepId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HealthRecord_sheepId_fkey" FOREIGN KEY ("sheepId") REFERENCES "Sheep" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "description" TEXT,
    "sheepId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_sheepId_fkey" FOREIGN KEY ("sheepId") REFERENCES "Sheep" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Sheep_earTag_key" ON "Sheep"("earTag");
