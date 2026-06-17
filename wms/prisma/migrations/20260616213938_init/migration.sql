-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'ejecutivo_comercial', 'operario_bodega', 'repartidor');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('lead', 'cliente', 'producto', 'pedido', 'factura');

-- CreateEnum
CREATE TYPE "ProcessType" AS ENUM ('onboarding_lead', 'pedido_completo', 'facturacion', 'despacho', 'sincronizacion_stock');

-- CreateEnum
CREATE TYPE "ProcessStatus" AS ENUM ('pending', 'in_progress', 'completed', 'failed', 'compensating');

-- CreateEnum
CREATE TYPE "WebhookSource" AS ENUM ('shopify', 'bsale', 'syncmanager');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ejecutivo_comercial',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "id_mappings" (
    "id" TEXT NOT NULL,
    "entity_type" "EntityType" NOT NULL,
    "internal_id" TEXT NOT NULL,
    "syncmanager_id" TEXT,
    "shopify_id" TEXT,
    "bsale_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "id_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "process_states" (
    "id" TEXT NOT NULL,
    "process_type" "ProcessType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "current_step" TEXT NOT NULL,
    "status" "ProcessStatus" NOT NULL DEFAULT 'pending',
    "steps_log" JSONB NOT NULL DEFAULT '[]',
    "error_details" JSONB,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "process_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_rules" (
    "id" TEXT NOT NULL,
    "rule_key" TEXT NOT NULL,
    "rule_value" JSONB NOT NULL,
    "description" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "source_system" TEXT NOT NULL,
    "request_payload" JSONB,
    "response_summary" JSONB,
    "status" TEXT NOT NULL DEFAULT 'success',

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "source" "WebhookSource" NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processed_at" TIMESTAMP(3),
    "error" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_orders" (
    "id" TEXT NOT NULL,
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
    "validation_errors" TEXT NOT NULL DEFAULT '[]',
    "order_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "whatsapp_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_sessions" (
    "id" TEXT NOT NULL,
    "client_phone" TEXT NOT NULL,
    "current_step" TEXT NOT NULL,
    "orderData" TEXT NOT NULL DEFAULT '{}',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_queue" (
    "id" TEXT NOT NULL,
    "whatsapp_order_id" TEXT NOT NULL,
    "client_phone" TEXT NOT NULL,
    "client_name" TEXT NOT NULL,
    "client_rut" TEXT,
    "client_email" TEXT,
    "delivery_address" TEXT NOT NULL,
    "delivery_city" TEXT NOT NULL,
    "delivery_zone" TEXT,
    "product_name" TEXT NOT NULL,
    "product_sku" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit_of_measure" TEXT NOT NULL,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "delivery_type" TEXT NOT NULL,
    "delivery_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payment_method" TEXT NOT NULL,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendiente',
    "bsale_document_id" TEXT,
    "bsale_document_number" TEXT,
    "bsale_invoice_date" TIMESTAMP(3),
    "error_message" TEXT,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "last_error_at" TIMESTAMP(3),
    "admin_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "facturado_at" TIMESTAMP(3),

    CONSTRAINT "billing_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "razon_social" TEXT NOT NULL,
    "tipo_negocio" TEXT NOT NULL,
    "tipo_cliente" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "contact_name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pendiente',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejected_by" TEXT,
    "rejected_at" TIMESTAMP(3),
    "client_id" TEXT,
    "admin_notes" TEXT,
    "form_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "precio_base" DOUBLE PRECISION NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'CLP',
    "stock_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "bsale_id" TEXT,
    "shopify_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "producto_formatos" (
    "id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "formato" TEXT NOT NULL,
    "unidad_medida" TEXT NOT NULL,
    "precio" DOUBLE PRECISION NOT NULL,
    "stock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cantidad_base" DOUBLE PRECISION NOT NULL,
    "min_stock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "producto_formatos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "razon_social" TEXT NOT NULL,
    "tipo_cliente" TEXT NOT NULL,
    "tipo_negocio" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "contact_name" TEXT,
    "lead_id" TEXT,
    "condicion_pago" TEXT,
    "lista_precios_id" TEXT,
    "limite_credito" DOUBLE PRECISION,
    "pedido_minimo" DOUBLE PRECISION,
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "bloqueado_razon" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "recipient_email" TEXT NOT NULL,
    "recipient_phone" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
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

-- CreateIndex
CREATE INDEX "billing_queue_client_phone_idx" ON "billing_queue"("client_phone");

-- CreateIndex
CREATE INDEX "billing_queue_status_idx" ON "billing_queue"("status");

-- CreateIndex
CREATE INDEX "billing_queue_created_at_idx" ON "billing_queue"("created_at");

-- CreateIndex
CREATE INDEX "billing_queue_bsale_document_id_idx" ON "billing_queue"("bsale_document_id");

-- CreateIndex
CREATE UNIQUE INDEX "leads_rut_key" ON "leads"("rut");

-- CreateIndex
CREATE INDEX "leads_rut_idx" ON "leads"("rut");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");

-- CreateIndex
CREATE INDEX "leads_created_at_idx" ON "leads"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "productos_sku_key" ON "productos"("sku");

-- CreateIndex
CREATE INDEX "productos_sku_idx" ON "productos"("sku");

-- CreateIndex
CREATE INDEX "productos_activo_idx" ON "productos"("activo");

-- CreateIndex
CREATE INDEX "producto_formatos_producto_id_idx" ON "producto_formatos"("producto_id");

-- CreateIndex
CREATE INDEX "producto_formatos_stock_idx" ON "producto_formatos"("stock");

-- CreateIndex
CREATE UNIQUE INDEX "producto_formatos_producto_id_formato_key" ON "producto_formatos"("producto_id", "formato");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_rut_key" ON "clientes"("rut");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_lead_id_key" ON "clientes"("lead_id");

-- CreateIndex
CREATE INDEX "clientes_rut_idx" ON "clientes"("rut");

-- CreateIndex
CREATE INDEX "clientes_estado_idx" ON "clientes"("estado");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_entity_type_entity_id_idx" ON "notifications"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "notifications_read_idx" ON "notifications"("read");

-- CreateIndex
CREATE INDEX "notifications_recipient_email_idx" ON "notifications"("recipient_email");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- AddForeignKey
ALTER TABLE "producto_formatos" ADD CONSTRAINT "producto_formatos_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
