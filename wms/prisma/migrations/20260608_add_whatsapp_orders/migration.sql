-- CreateTable
CREATE TABLE "whatsapp_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "client_phone" TEXT NOT NULL,
    "client_name" TEXT NOT NULL,
    "client_id" TEXT,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit_of_measure" TEXT NOT NULL,
    "unit_price" DOUBLE PRECISION,
    "subtotal" DOUBLE PRECISION,
    "delivery_type" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "reference" TEXT,
    "payment_method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'confirmado',
    "validation_errors" JSONB NOT NULL DEFAULT '[]',
    "order_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3)
);

-- CreateTable
CREATE TABLE "whatsapp_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "client_phone" TEXT NOT NULL,
    "current_step" TEXT NOT NULL,
    "orderData" JSONB NOT NULL DEFAULT '{}',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE INDEX "whatsapp_orders_client_phone_idx" ON "whatsapp_orders"("client_phone");

-- CreateIndex
CREATE INDEX "whatsapp_orders_status_idx" ON "whatsapp_orders"("status");

-- CreateIndex
CREATE INDEX "whatsapp_orders_order_id_idx" ON "whatsapp_orders"("order_id");

-- CreateIndex
CREATE INDEX "whatsapp_orders_created_at_idx" ON "whatsapp_orders"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_sessions_client_phone_key" ON "whatsapp_sessions"("client_phone");

-- CreateIndex
CREATE INDEX "whatsapp_sessions_client_phone_idx" ON "whatsapp_sessions"("client_phone");

-- CreateIndex
CREATE INDEX "whatsapp_sessions_last_activity_at_idx" ON "whatsapp_sessions"("last_activity_at");
