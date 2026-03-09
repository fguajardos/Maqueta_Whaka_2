/**
 * Transformer SyncManager: mapea datos entre formato interno WHK y SyncManager.
 */

export class SyncManagerTransformer {
    /**
     * SyncManager Lead → WHK Lead interno
     */
    static leadToInternalFormat(smLead: any): any {
        return {
            syncmanagerId: smLead.id,
            nombre: smLead.name || smLead.nombre,
            telefono: smLead.phone || smLead.telefono,
            email: smLead.email,
            tipoNegocio: smLead.business_type || smLead.tipo_negocio,
            razonSocial: smLead.company || smLead.razon_social,
            rut: smLead.rut || smLead.tax_id,
            direccion: smLead.address || smLead.direccion,
            comuna: smLead.city || smLead.comuna,
            region: smLead.province || smLead.region,
            estado: smLead.status || 'nuevo',
            fechaRegistro: smLead.created_at,
        };
    }

    /**
     * WHK Aprobación → SyncManager update (al aprobar un lead)
     */
    static approvalToExternalFormat(approval: any): any {
        return {
            status: 'aprobado',
            commercial_conditions: {
                price_list_id: approval.listaPreciosId,
                payment_condition: approval.condicionPago,
                credit_limit: approval.limiteCredito,
                minimum_order: approval.pedidoMinimo,
            },
        };
    }

    /**
     * WHK Rechazo → SyncManager update
     */
    static rejectionToExternalFormat(motivo: string): any {
        return {
            status: 'rechazado',
            rejection_reason: motivo,
        };
    }
}
