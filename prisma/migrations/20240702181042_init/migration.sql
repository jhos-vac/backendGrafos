-- CreateTable
CREATE TABLE "Calification" (
    "id" SERIAL NOT NULL,
    "nameStudent" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "studentLevel" TEXT NOT NULL,
    "calification" TEXT NOT NULL,
    "graphId" TEXT NOT NULL,

    CONSTRAINT "Calification_pkey" PRIMARY KEY ("id")
);
