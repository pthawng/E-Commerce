-- CreateTable
CREATE TABLE "_ProductMediaToProductVariant" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_ProductMediaToProductVariant_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ProductMediaToProductVariant_B_index" ON "_ProductMediaToProductVariant"("B");

-- AddForeignKey
ALTER TABLE "_ProductMediaToProductVariant" ADD CONSTRAINT "_ProductMediaToProductVariant_A_fkey" FOREIGN KEY ("A") REFERENCES "ProductMedia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductMediaToProductVariant" ADD CONSTRAINT "_ProductMediaToProductVariant_B_fkey" FOREIGN KEY ("B") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
