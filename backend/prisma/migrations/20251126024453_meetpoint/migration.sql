-- AlterTable
ALTER TABLE "events" ADD COLUMN     "address" TEXT NOT NULL DEFAULT 'Łódź, Poland';

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "avatar" SET DEFAULT 'resources/avatars/default.jpg';
