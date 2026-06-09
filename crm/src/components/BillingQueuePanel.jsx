import React, { useState, useEffect } from 'react';
import { FileDown, CheckCircle, AlertCircle, Clock, Edit2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_WMS_URL || 'http://localhost:3000';

export default function BillingQueuePanel() {
  const [billings, setBillings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pendiente');
  const [selectedBilling, setSelectedBilling] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [note, setNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Cargar datos de facturación
  useEffect(() => {
    loadBillings();
    loadStats();
  }, [filter]);

  const loadBillings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url =
        filter === 'todos'
          ? `${API_BASE_URL}/api/billing/pending`
          : `${API_BASE_URL}/api/billing/pending?status=${filter}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setBillings(data.data || []);
      }
    } catch (error) {
      console.error('Error cargando facturación:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/billing/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setStats(data);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const markAsInvoiced = async (billingId, documentNumber) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/api/billing/${billingId}/invoice`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            bsaleDocumentNumber: documentNumber,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        alert('✅ Pedido marcado como facturado');
        setSelectedBilling(null);
        loadBillings();
        loadStats();
      }
    } catch (error) {
      console.error('Error marcando como facturado:', error);
      alert('❌ Error al facturar');
    } finally {
      setActionLoading(false);
    }
  };

  const addNote = async (billingId) => {
    if (!note.trim()) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/billing/${billingId}/note`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ note }),
      });

      const data = await response.json();
      if (data.success) {
        alert('✅ Nota agregada');
        setNote('');
        loadBillings();
      }
    } catch (error) {
      console.error('Error agregando nota:', error);
      alert('❌ Error al agregar nota');
    } finally {
      setActionLoading(false);
    }
  };

  const exportCsv = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/api/billing/export/csv?status=${filter === 'todos' ? '' : filter}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `billing-${filter}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exportando:', error);
      alert('❌ Error al exportar');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'facturado':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pendiente':
        return <Clock className="w-4 h-4" />;
      case 'facturado':
        return <CheckCircle className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  if (loading && !billings.length) {
    return (
      <div className="p-8 text-center">
        <Clock className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-400" />
        <p>Cargando cola de facturación...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              📋 Pendiente por Facturar
            </h1>
            <p className="text-gray-600 mt-1">
              Cola de facturas para procesar en BSale (o manual)
            </p>
          </div>
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <FileDown className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.byStatus.pendiente || 0}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500 opacity-50" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Facturados</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.byStatus.facturado || 0}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Errores</p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.byStatus.error || 0}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-500 opacity-50" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Monto Pendiente</p>
                  <p className="text-2xl font-bold text-orange-600">
                    ${(stats.pendingTotal || 0).toLocaleString()}
                  </p>
                </div>
                <FileDown className="w-8 h-8 text-orange-500 opacity-50" />
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="flex gap-2 mb-6">
          {['pendiente', 'facturado', 'error', 'todos'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {billings.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>No hay pedidos en esta categoría</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">
                      Cliente
                    </th>
                    <th className="text-left px-4 py-3 font-semibold">
                      Producto
                    </th>
                    <th className="text-right px-4 py-3 font-semibold">
                      Cantidad
                    </th>
                    <th className="text-right px-4 py-3 font-semibold">Total</th>
                    <th className="text-center px-4 py-3 font-semibold">
                      Estado
                    </th>
                    <th className="text-center px-4 py-3 font-semibold">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {billings.map((billing) => (
                    <tr key={billing.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{billing.clientName}</p>
                          <p className="text-gray-600 text-xs">
                            {billing.clientPhone}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{billing.productName}</p>
                          <p className="text-gray-600 text-xs">
                            {billing.deliveryCity}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {billing.quantity} {billing.unitOfMeasure}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        ${billing.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            billing.status
                          )}`}
                        >
                          {getStatusIcon(billing.status)}
                          {billing.status.charAt(0).toUpperCase() +
                            billing.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedBilling(billing);
                            setShowModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center gap-1 mx-auto"
                        >
                          <Edit2 className="w-4 h-4" />
                          Detalles
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Detalle */}
      {showModal && selectedBilling && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center">
              <h2 className="text-xl font-bold">Detalle de Facturación</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setNote('');
                }}
                className="text-2xl font-light hover:opacity-80"
              >
                ✕
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-6">
              {/* Cliente */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">
                  📱 Información del Cliente
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Nombre</p>
                    <p className="font-medium">{selectedBilling.clientName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Teléfono</p>
                    <p className="font-medium">{selectedBilling.clientPhone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">
                      {selectedBilling.clientEmail || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">RUT</p>
                    <p className="font-medium">
                      {selectedBilling.clientRut || '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Producto */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">
                  🛒 Detalle del Producto
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Producto</p>
                    <p className="font-medium">{selectedBilling.productName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">SKU</p>
                    <p className="font-medium">
                      {selectedBilling.productSKU || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Cantidad</p>
                    <p className="font-medium">
                      {selectedBilling.quantity} {selectedBilling.unitOfMeasure}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Precio Unitario</p>
                    <p className="font-medium">
                      ${selectedBilling.unitPrice.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Subtotal</p>
                    <p className="font-medium">
                      ${selectedBilling.subtotal.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Entrega */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">
                  📍 Información de Entrega
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Dirección</p>
                    <p className="font-medium">
                      {selectedBilling.deliveryAddress}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ciudad</p>
                    <p className="font-medium">{selectedBilling.deliveryCity}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Zona</p>
                    <p className="font-medium">
                      {selectedBilling.deliveryZone || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tipo Despacho</p>
                    <p className="font-medium capitalize">
                      {selectedBilling.deliveryType}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Flete</p>
                    <p className="font-medium">
                      ${selectedBilling.deliveryFee.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pago y Total */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">
                  💳 Información de Pago
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                  <div>
                    <p className="text-sm text-gray-600">Método Pago</p>
                    <p className="font-medium">
                      {selectedBilling.paymentMethod}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total a Facturar</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ${selectedBilling.totalAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Acciones */}
              {selectedBilling.status === 'pendiente' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Documento BSale (opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: F-001234"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        markAsInvoiced(selectedBilling.id, note)
                      }
                      disabled={actionLoading}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition"
                    >
                      {actionLoading
                        ? 'Procesando...'
                        : '✅ Marcar como Facturado'}
                    </button>
                    <button
                      onClick={() => addNote(selectedBilling.id)}
                      disabled={actionLoading || !note}
                      className="flex-1 bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50 font-medium transition"
                    >
                      {actionLoading ? 'Guardando...' : '📝 Agregar Nota'}
                    </button>
                  </div>
                </div>
              )}

              {/* BSale Info */}
              {selectedBilling.bsaleDocumentId && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <p className="text-sm font-medium text-green-700 mb-2">
                    ✅ Facturado en BSale
                  </p>
                  <p className="text-sm">
                    Documento: {selectedBilling.bsaleDocumentNumber}
                  </p>
                  <p className="text-sm">
                    Fecha:{' '}
                    {new Date(
                      selectedBilling.bsaleInvoiceDate
                    ).toLocaleDateString()}
                  </p>
                </div>
              )}

              {/* Error Info */}
              {selectedBilling.errorMessage && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <p className="text-sm font-medium text-red-700 mb-1">
                    ⚠️ Error de Facturación
                  </p>
                  <p className="text-sm text-red-600">
                    {selectedBilling.errorMessage}
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    Intentos: {selectedBilling.errorCount}
                  </p>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="border-t p-4 bg-gray-50 flex justify-end">
              <button
                onClick={() => {
                  setShowModal(false);
                  setNote('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
