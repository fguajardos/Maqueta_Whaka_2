-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ejecutivo_comercial',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "id_mappings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entity_type" TEXT NOT NULL,
    "internal_id" TEXT NOT NULL,
    "syncmanager_id" TEXT,
    "shopify_id" TEXT,
    "bsale_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "process_states" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "process_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "current_step" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "steps_log" JSONB NOT NULL DEFAULT [],
    "error_details" JSONB,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" DATETIME
);

-- CreateTable
CREATE TABLE "business_rules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rule_key" TEXT NOT NULL,
    "rule_value" JSONB NOT NULL,
    "description" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "updated_by" TEXT,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "source_system" TEXT NOT NULL,
    "request_payload" JSONB,
    "response_summary" JSONB,
    "status" TEXT NOT NULL DEFAULT 'success'
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processed_at" DATETIME,
    "error" TEXT,
    "received_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "whatsapp_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "client_phone" TEXT NOT NULL,
    "client_name" TEXT NOT NULL,
    "client_id" TEXT,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit_of_measure" TEXT NOT NULL,
    "unit_price" REAL,
    "subtotal" REAL,
    "delivery_type" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "reference" TEXT,
    "payment_method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'confirmado',
    "validation_errors" JSONB NOT NULL DEFAULT [],
    "order_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" DATETIME
);

-- CreateTable
CREATE TABLE "whatsapp_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "client_phone" TEXT NOT NULL,
    "current_step" TEXT NOT NULL,
    "orderData" JSONB NOT NULL DEFAULT {},
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity_at" DATETIME NOT NULL,
    "expires_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "id_mappings_syncmanager_id_idx" ON "id_mappings"("syncmanager_id");

-- CreateIndex
CREATE INDEX "id_mappings_shopify_id_idx" ON "id_mappings"("shopify_id");

-- CreateIndex
CREATE INDEX "id_mappings_bsale_id_idx" ON "id_mappings"("bsale_id");

-- CreateIndex
CREATE UNIQUE INDEX "id_mappings_entity_type_internal_id_key" ON "id_mappings"("entity_type", "internal_id");

-- CreateIndex
CREATE INDEX "process_states_process_type_status_idx" ON "process_states"("process_type", "status");

-- CreateIndex
CREATE INDEX "process_states_entity_id_idx" ON "process_states"("entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "business_rules_rule_key_key" ON "business_rules"("rule_key");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "webhook_events_source_event_type_idx" ON "webhook_events"("source", "event_type");

-- CreateIndex
CREATE INDEX "webhook_events_processed_idx" ON "webhook_events"("processed");

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
