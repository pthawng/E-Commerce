-- AddForeignKey
ALTER TABLE "VerifyEmailToken" ADD CONSTRAINT "VerifyEmailToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
