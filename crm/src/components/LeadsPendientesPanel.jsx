import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Eye, MessageSquare, Loader, Filter, Download, RefreshCw } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_WMS_URL || 'http://localhost:3000';

export default function LeadsPendientesPanel() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState(null); // 'approve', 'reject'
  const [rejectionReason, setRejectionReason] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);
  const [filter, setFilter] = useState('pendiente');
  const [stats, setStats] = useState({ pendiente: 0, aprobado: 0, rechazado: 0 });
  const [searchQuery, setSearchQuery] = useState('');

  // Cargar leads
  const cargarLeads = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/admin/leads/pendientes`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error('Error cargando leads');

      const data = await res.json();

      if (data.success && data.leads) {
        setLeads(data.leads);
        // Calcular estadísticas
        const statsObj = {
          pendiente: data.leads.filter(l => l.status === 'pendiente').length,
          aprobado: data.leads.filter(l => l.status === 'aprobado').length,
          rechazado: data.leads.filter(l => l.status === 'rechazado').length,
        };
        setStats(statsObj);
      }
    } catch (error) {
      console.error('[LeadsPanel] Error:', error);
      alert('Error cargando leads');
    } finally {
      setLoading(false);
    }
  }, []);

  // Aprobar lead
  const aprobarLead = useCallback(async () => {
    if (!selectedLead) return;

    setLoadingAction(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/admin/leads/${selectedLead.id}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'admin-user', // Mock - en producción viene del context
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert(`✅ Lead aprobado: ${selectedLead.razonSocial}`);
        setShowModal(false);
        setSelectedLead(null);
        setAction(null);
        cargarLeads();
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('[LeadsPanel] Error:', error);
      alert('Error aprobando lead');
    } finally {
      setLoadingAction(false);
    }
  }, [selectedLead, cargarLeads]);

  // Rechazar lead
  const rechazarLead = useCallback(async () => {
    if (!selectedLead) return;

    setLoadingAction(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/admin/leads/${selectedLead.id}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'admin-user',
          reason: rejectionReason,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert(`❌ Lead rechazado: ${selectedLead.razonSocial}`);
        setShowModal(false);
        setSelectedLead(null);
        setAction(null);
        setRejectionReason('');
        cargarLeads();
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('[LeadsPanel] Error:', error);
      alert('Error rechazando lead');
    } finally {
      setLoadingAction(false);
    }
  }, [selectedLead, rejectionReason, cargarLeads]);

  // Agregar nota
  const agregarNota = useCallback(async (nota) => {
    if (!selectedLead) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/admin/leads/${selectedLead.id}/note`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ note: nota }),
      });

      const data = await res.json();

      if (data.success) {
        setSelectedLead(data.lead);
        cargarLeads();
      }
    } catch (error) {
      console.error('[LeadsPanel] Error:', error);
    }
  }, [selectedLead, cargarLeads]);

  // Filtrar leads
  const leadsFiltrados = leads
    .filter(l => filter === 'todos' || l.status === filter)
    .filter(l =>
      l.rut.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.razonSocial.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Cargar leads al montar
  useEffect(() => {
    cargarLeads();
  }, [cargarLeads]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">📋 Gestión de Leads</h2>
          <button
            onClick={cargarLeads}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 font-medium">En Espera</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.pendiente}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 font-medium">Aprobados</p>
            <p className="text-3xl font-bold text-green-600">{stats.aprobado}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 font-medium">Rechazados</p>
            <p className="text-3xl font-bold text-red-600">{stats.rechazado}</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Todos los leads</option>
            <option value="pendiente">Solo pendientes</option>
            <option value="aprobado">Solo aprobados</option>
            <option value="rechazado">Solo rechazados</option>
          </select>
        </div>

        <input
          type="text"
          placeholder="Buscar por RUT o razón social..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tabla */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : leadsFiltrados.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-lg">No hay leads para mostrar</p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                  RUT
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                  Razón Social
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                  Tipo Negocio
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {leadsFiltrados.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50 border-b border-gray-200 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900 font-mono">{lead.rut}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{lead.razonSocial}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{lead.tipoNegocio}</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        lead.status === 'pendiente'
                          ? 'bg-yellow-100 text-yellow-800'
                          : lead.status === 'aprobado'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {lead.status === 'pendiente' && '⏳ Pendiente'}
                      {lead.status === 'aprobado' && '✅ Aprobado'}
                      {lead.status === 'rechazado' && '❌ Rechazado'}
                      {lead.status === 'cliente_creado' && '👤 Cliente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(lead.createdAt).toLocaleDateString('es-CL')}
                  </td>
                  <td className="px-6 py-4 text-sm flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedLead(lead);
                        setShowModal(true);
                      }}
                      className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                      title="Ver detalles"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {lead.status === 'pendiente' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedLead(lead);
                            setAction('approve');
                            setShowModal(true);
                          }}
                          className="p-2 hover:bg-green-100 rounded-lg transition-colors text-green-600"
                          title="Aprobar"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedLead(lead);
                            setAction('reject');
                            setShowModal(true);
                          }}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                          title="Rechazar"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">
                {action === 'approve' ? '✅ Aprobar Lead' : action === 'reject' ? '❌ Rechazar Lead' : '📋 Detalles del Lead'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedLead(null);
                  setAction(null);
                  setRejectionReason('');
                }}
                className="text-white hover:text-blue-100 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Información básica */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 font-medium">RUT</p>
                  <p className="text-lg font-mono font-bold text-gray-900">{selectedLead.rut}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Razón Social</p>
                  <p className="text-lg font-bold text-gray-900">{selectedLead.razonSocial}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Tipo Negocio</p>
                  <p className="text-lg text-gray-900">{selectedLead.tipoNegocio}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Tipo Cliente</p>
                  <p className="text-lg text-gray-900">{selectedLead.tipoCliente}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Contacto</p>
                  <p className="text-lg text-gray-900">{selectedLead.contactName || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Teléfono</p>
                  <p className="text-lg text-gray-900">{selectedLead.phone || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Email</p>
                  <p className="text-lg text-gray-900 break-all">{selectedLead.email || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Fecha Creación</p>
                  <p className="text-lg text-gray-900">
                    {new Date(selectedLead.createdAt).toLocaleDateString('es-CL')}
                  </p>
                </div>
              </div>

              {/* Notas actuales */}
              {selectedLead.adminNotes && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600 font-medium mb-2">📝 Notas Admin</p>
                  <p className="text-gray-900">{selectedLead.adminNotes}</p>
                </div>
              )}

              {/* Acciones */}
              {action === 'approve' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
                  <p className="text-green-900 font-medium">¿Estás seguro de que quieres aprobar este lead?</p>
                  <p className="text-sm text-green-800">
                    Al aprobar: se creará un cliente en el sistema y se enviará una notificación con el catálogo.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={aprobarLead}
                      disabled={loadingAction}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      {loadingAction ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      {loadingAction ? 'Aprobando...' : 'Sí, aprobar'}
                    </button>
                    <button
                      onClick={() => {
                        setShowModal(false);
                        setAction(null);
                      }}
                      className="flex-1 px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {action === 'reject' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-4">
                  <p className="text-red-900 font-medium">¿Estás seguro de que quieres rechazar este lead?</p>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Motivo del rechazo (opcional)..."
                    className="w-full px-4 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                    rows="3"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={rechazarLead}
                      disabled={loadingAction}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      {loadingAction ? <Loader className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      {loadingAction ? 'Rechazando...' : 'Sí, rechazar'}
                    </button>
                    <button
                      onClick={() => {
                        setShowModal(false);
                        setAction(null);
                        setRejectionReason('');
                      }}
                      className="flex-1 px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
