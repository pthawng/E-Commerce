/*
  Warnings:

  - A unique constraint covering the columns `[token]` on the table `VerifyEmailToken` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "VerifyEmailToken_token_key" ON "VerifyEmailToken"("token");
