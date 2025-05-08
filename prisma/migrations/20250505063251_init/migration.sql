-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('CONTAINER', 'SALVAGEABLE');

-- CreateTable
CREATE TABLE "source_items" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "type" "ItemType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "source_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "result_items" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "result_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drop_records" (
    "sourceItemId" INTEGER NOT NULL,
    "resultItemId" INTEGER NOT NULL,
    "totalQuantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drop_records_pkey" PRIMARY KEY ("sourceItemId","resultItemId")
);

-- CreateIndex
CREATE UNIQUE INDEX "source_items_name_key" ON "source_items"("name");

-- CreateIndex
CREATE UNIQUE INDEX "result_items_name_key" ON "result_items"("name");

-- AddForeignKey
ALTER TABLE "drop_records" ADD CONSTRAINT "drop_records_sourceItemId_fkey" FOREIGN KEY ("sourceItemId") REFERENCES "source_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drop_records" ADD CONSTRAINT "drop_records_resultItemId_fkey" FOREIGN KEY ("resultItemId") REFERENCES "result_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
