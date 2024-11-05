/*
  Warnings:

  - A unique constraint covering the columns `[user_id,task_id]` on the table `Progress` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Progress" ADD COLUMN     "completed_at" DATE;

-- CreateIndex
CREATE INDEX "Progress_user_id_completed_at_idx" ON "Progress"("user_id", "completed_at");

-- CreateIndex
CREATE INDEX "Progress_task_id_idx" ON "Progress"("task_id");

-- CreateIndex
CREATE UNIQUE INDEX "Progress_user_id_task_id_key" ON "Progress"("user_id", "task_id");
