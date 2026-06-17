-- AlterTable
ALTER TABLE "productos" ADD COLUMN     "en_oferta" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "precio_anterior" DOUBLE PRECISION;
