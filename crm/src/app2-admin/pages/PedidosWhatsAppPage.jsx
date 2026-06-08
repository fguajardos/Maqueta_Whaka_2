import React, { useState } from 'react';
import { CheckCircle, AlertCircle, Clock, TrendingDown, Eye, Download } from 'lucide-react';

/**
 * Dashboard: Pedidos llegados vía WhatsApp Bot
 * Muestra tabla con pedidos, validaciones y estado
 */

const PEDIDOS_MOCK = [
  {
    id: 'ORD-001A2B',
    cliente: 'Juan García',
    telefono: '+56 9 1234 5678',
    producto: 'Leche Entera',
    cantidad: '5 litros',
    despacho: 'Entrega',
    ciudad: 'Guaca',
    pago: 'Efectivo',
    subtotal: '$6.000',
    estado: 'confirmado',
    errores: [],
    timestamp: '09:15',
  },
  {
    id: 'ORD-002C3D',
    cliente: 'María López',
    telefono: '+56 9 5678 9012',
    producto: 'Yogurt Natural',
    cantidad: '10 unidades',
    despacho: 'Retiro',
    ciudad: '-',
    pago: 'Transferencia',
    subtotal: '$8.000',
    estado: 'confirmado',
    errores: [],
    timestamp: '09:22',
  },
  {
    id: 'ORD-003E4F',
    cliente: 'Carlos Ruiz',
    telefono: '+56 9 9012 3456',
    producto: 'Queso',
    cantidad: '3 kg',
    despacho: 'Entrega',
    ciudad: 'Santiago',
    pago: 'Cheque',
    subtotal: '$25.500',
    estado: 'error',
    errores: ['Dirección incompleta (faltó número)', 'Ciudad no se especificó correctamente'],
    timestamp: '09:35',
  },
  {
    id: 'ORD-004G5H',
    cliente: 'Roberto Soto',
    telefono: '+56 9 3456 7890',
    producto: 'Mantequilla',
    cantidad: '2 kg',
    despacho: 'Entrega',
    ciudad: 'Guaca',
    pago: 'Efectivo',
    subtotal: '$13.000',
    estado: 'confirmado',
    errores: [],
    timestamp: '09:48',
  },
];

export default function PedidosWhatsAppPage() {
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [detalleAbierto, setDetalleAbierto] = useState(null);

  const pedidosFiltrados = filtroEstado === 'todos'
    ? PEDIDOS_MOCK
    : PEDIDOS_MOCK.filter(p => p.estado === filtroEstado);

  const confirmados = PEDIDOS_MOCK.filter(p => p.estado === 'confirmado').length;
  const conErrores = PEDIDOS_MOCK.filter(p => p.estado === 'error').length;
  const tasaExito = ((confirmados / PEDIDOS_MOCK.length) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pedidos WhatsApp Bot</h1>
            <p className="text-gray-600 text-sm mt-1">Pedidos llegados vía bot de WhatsApp (sin entrada manual)</p>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Pedidos</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{PEDIDOS_MOCK.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Confirmados ✅</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{confirmados}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Con Errores ❌</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{conErrores}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Tasa de Éxito</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{tasaExito}%</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFiltroEstado('todos')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filtroEstado === 'todos'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Todos ({PEDIDOS_MOCK.length})
        </button>
        <button
          onClick={() => setFiltroEstado('confirmado')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filtroEstado === 'confirmado'
              ? 'bg-green-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Confirmados ✅ ({confirmados})
        </button>
        <button
          onClick={() => setFiltroEstado('error')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filtroEstado === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Con Errores ❌ ({conErrores})
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">ID Orden</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Despacho</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Pago</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pedidosFiltrados.map((pedido) => (
                <tr key={pedido.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono font-bold text-gray-900">{pedido.id}</span>
                    <p className="text-xs text-gray-500 mt-0.5">{pedido.timestamp}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="font-medium text-gray-900">{pedido.cliente}</p>
                    <p className="text-xs text-gray-500">{pedido.telefono}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">{pedido.producto}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-gray-900">{pedido.despacho}</p>
                      {pedido.despacho === 'Entrega' && <p className="text-xs text-gray-500">{pedido.ciudad}</p>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">{pedido.pago}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">{pedido.subtotal}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {pedido.estado === 'confirmado' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Confirmado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 font-medium text-sm">
                        <AlertCircle className="w-4 h-4" />
                        Error
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => setDetalleAbierto(detalleAbierto === pedido.id ? null : pedido.id)}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detalle */}
      {detalleAbierto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {(() => {
              const pedido = PEDIDOS_MOCK.find(p => p.id === detalleAbierto);
              return (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Detalles de Orden</h2>
                    <button onClick={() => setDetalleAbierto(null)} className="text-gray-500 hover:text-gray-700 text-xl">×</button>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Número de Orden</p>
                      <p className="font-mono font-bold text-lg mt-1">{pedido.id}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Estado</p>
                      <div className="mt-1">
                        {pedido.estado === 'confirmado' ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                            <CheckCircle className="w-4 h-4" />
                            Confirmado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 font-medium">
                            <AlertCircle className="w-4 h-4" />
                            Error
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6 mb-6">
                    <h3 className="font-bold text-gray-900 mb-4">Información del Cliente</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-600 text-sm">Nombre</p>
                        <p className="font-medium text-gray-900 mt-1">{pedido.cliente}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Teléfono</p>
                        <p className="font-medium text-gray-900 mt-1">{pedido.telefono}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6 mb-6">
                    <h3 className="font-bold text-gray-900 mb-4">Detalle del Pedido</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <p className="text-gray-600">Producto</p>
                        <p className="font-medium text-gray-900">{pedido.producto}</p>
                      </div>
                      <div className="flex justify-between">
                        <p className="text-gray-600">Cantidad</p>
                        <p className="font-medium text-gray-900">{pedido.cantidad}</p>
                      </div>
                      <div className="flex justify-between">
                        <p className="text-gray-600">Subtotal</p>
                        <p className="font-bold text-gray-900">{pedido.subtotal}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6 mb-6">
                    <h3 className="font-bold text-gray-900 mb-4">Despacho y Pago</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <p className="text-gray-600">Tipo de Despacho</p>
                        <p className="font-medium text-gray-900">{pedido.despacho}</p>
                      </div>
                      {pedido.despacho === 'Entrega' && (
                        <>
                          <div className="flex justify-between">
                            <p className="text-gray-600">Ciudad</p>
                            <p className="font-medium text-gray-900">{pedido.ciudad}</p>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between">
                        <p className="text-gray-600">Método de Pago</p>
                        <p className="font-medium text-gray-900">{pedido.pago}</p>
                      </div>
                    </div>
                  </div>

                  {pedido.errores.length > 0 && (
                    <div className="border-t pt-6 mb-6 bg-red-50 -mx-6 -mb-6 px-6 py-6">
                      <h3 className="font-bold text-red-900 mb-3 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Errores Encontrados
                      </h3>
                      <ul className="space-y-2">
                        {pedido.errores.map((error, i) => (
                          <li key={i} className="text-red-800 text-sm flex items-start gap-2">
                            <span className="text-red-600 font-bold mt-0.5">•</span>
                            {error}
                          </li>
                        ))}
                      </ul>
                      <p className="text-red-700 text-sm mt-4 font-medium">⚠️ Este pedido requiere validación manual antes de procesar</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                      Procesar Pedido
                    </button>
                    <button onClick={() => setDetalleAbierto(null)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium">
                      Cerrar
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
