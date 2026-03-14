/**
 * App — WhakaChile WMS (Warehouse Management System)
 * Hash-based router + view renderers.
 * Views: Dashboard, Stock, Pedidos, Despacho, Config, Audit
 */
const App = (() => {
    const $root = () => document.getElementById('app');
    let refreshInterval = null;

    /* ============================================
       STATE (in-memory, reactive-ish)
       ============================================ */
    const state = {
        pedidosFilter: null,
        despachoTab: 'todas',
        expandedRoutes: new Set(),
        trackingView: 'status', // 'status' | 'confirm' | 'discrepancy' | 'success'
        selectedFile: null,
    };

    // Human-readable action labels for the UI
    const ACTION_LABELS = {
        validate: { label: '✓ Validar', icon: '✓', cls: 'action-advance' },
        send_to_warehouse: { label: '📦 Enviar a Bodega', icon: '📦', cls: 'action-advance' },
        confirm_picking: { label: '✅ Confirmar Picking', icon: '✅', cls: 'action-advance' },
        generate_invoice: { label: '🧾 Facturar', icon: '🧾', cls: 'action-advance' },
        dispatch: { label: '🚚 Despachar', icon: '🚚', cls: 'action-advance' },
        deliver: { label: '📬 Entregar', icon: '📬', cls: 'action-advance' },
        report_incident: { label: '⚠️ Incidencia', icon: '⚠️', cls: 'action-incident' },
        resolve_incident: { label: '🔧 Resolver', icon: '🔧', cls: 'action-advance' },
    };

    /* ============================================
       ROUTER
       ============================================ */
    function init() {
        // Auto-auth: si el CRM pasa el token WMS por URL param, inyectarlo en sesión
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('token');
        const urlUser = urlParams.get('user');
        if (urlToken) {
            ApiClient.setToken(urlToken);
            if (urlUser) {
                try { ApiClient.setUser(JSON.parse(decodeURIComponent(urlUser))); } catch (_) {}
            }
        }
        window.addEventListener('hashchange', route);
        route();
    }

    function route() {
        clearAutoRefresh();
        const hash = window.location.hash || '#login';

        if (!ApiClient.isAuthenticated() && hash !== '#login' && !hash.startsWith('#tracking')) {
            window.location.hash = '#login';
            return;
        }

        if (ApiClient.isAuthenticated() && hash === '#login') {
            window.location.hash = '#dashboard';
            return;
        }

        switch (hash) {
            case '#login': renderLogin(); break;
            case '#dashboard': renderAppShell('dashboard'); break;
            case '#stock': renderAppShell('stock'); break;
            case '#pedidos': renderAppShell('pedidos'); break;
            case '#despacho': renderAppShell('despacho'); break;
            case '#config': renderAppShell('config'); break;
            case '#audit': renderAppShell('audit'); break;
            default:
                if (hash.startsWith('#tracking')) { renderTracking(); break; }
                renderAppShell('dashboard'); break;
        }
    }

    /* ============================================
       LOGIN VIEW
       ============================================ */
    function renderLogin() {
        $root().innerHTML = `
            <div class="login-container">
                <div class="login-card">
                    <div class="logo">
                        <h1>🐋 WhakaChile</h1>
                        <p>Sistema de Gestión de Bodega (WMS)</p>
                    </div>
                    <div id="login-error" class="login-error"></div>
                    <form id="login-form">
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" id="login-email" placeholder="admin@whakachile.cl" required autocomplete="email" />
                        </div>
                        <div class="form-group">
                            <label>Contraseña</label>
                            <input type="password" id="login-password" placeholder="••••••••" required autocomplete="current-password" />
                        </div>
                        <button type="submit" class="btn btn-primary" id="login-btn">
                            Iniciar Sesión
                        </button>
                    </form>
                    <p class="text-muted text-sm" style="text-align:center; margin-top: 16px;">
                        WMS WhakaChile v1.0
                    </p>
                </div>
            </div>`;

        document.getElementById('login-form').addEventListener('submit', handleLogin);
    }

    async function handleLogin(e) {
        e.preventDefault();
        const btn = document.getElementById('login-btn');
        const errorEl = document.getElementById('login-error');
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        btn.disabled = true;
        btn.textContent = 'Ingresando...';
        errorEl.classList.remove('visible');

        try {
            await ApiClient.login(email, password);
            window.location.hash = '#dashboard';
        } catch (err) {
            errorEl.textContent = err.message || 'Error al iniciar sesión';
            errorEl.classList.add('visible');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Iniciar Sesión';
        }
    }

    /* ============================================
       APP SHELL (sidebar + topbar + content)
       ============================================ */
    function renderAppShell(view) {
        const user = ApiClient.getUser();
        const initials = user ? user.nombre.split(' ').map(n => n[0]).join('').substring(0, 2) : '??';
        const rolePretty = user ? user.role.replace(/_/g, ' ') : '';
        const isEmbedded = window !== window.top || new URLSearchParams(window.location.search).get('embedded') === 'true';

        $root().innerHTML = `
            <div class="app-shell ${isEmbedded ? 'embedded-mode' : ''}">
                <aside class="sidebar">
                    <div class="sidebar-header">
                        <h2>🐋 WhakaChile</h2>
                        <div class="subtitle">WMS — Bodega</div>
                    </div>
                    <nav class="sidebar-nav">
                        <div class="nav-section">
                            <div class="nav-section-title">Principal</div>
                            <button class="nav-item ${view === 'dashboard' ? 'active' : ''}" onclick="location.hash='#dashboard'">
                                <span class="icon">📊</span> Dashboard
                            </button>
                        </div>
                        <div class="nav-section">
                            <div class="nav-section-title">Operaciones</div>
                            <button class="nav-item ${view === 'stock' ? 'active' : ''}" onclick="location.hash='#stock'">
                                <span class="icon">📦</span> Stock
                            </button>
                            <button class="nav-item ${view === 'pedidos' ? 'active' : ''}" onclick="location.hash='#pedidos'">
                                <span class="icon">🛒</span> Pedidos
                            </button>
                            <button class="nav-item ${view === 'despacho' ? 'active' : ''}" onclick="location.hash='#despacho'">
                                <span class="icon">🚚</span> Despacho
                            </button>
                        </div>
                        <div class="nav-section">
                            <div class="nav-section-title">Sistema</div>
                            <button class="nav-item ${view === 'config' ? 'active' : ''}" onclick="location.hash='#config'">
                                <span class="icon">🔧</span> Configuración
                            </button>
                            <button class="nav-item ${view === 'audit' ? 'active' : ''}" onclick="location.hash='#audit'">
                                <span class="icon">📋</span> Auditoría
                            </button>
                        </div>
                    </nav>
                    <div class="sidebar-footer">
                        <div class="user-info">
                            <div class="user-avatar">${initials}</div>
                            <div class="user-details">
                                <div class="user-name">${user?.nombre || 'Usuario'}</div>
                                <div class="user-role">${rolePretty}</div>
                            </div>
                        </div>
                        <button class="btn btn-ghost btn-sm" style="width:100%" onclick="ApiClient.logout()">
                            🚪 Cerrar Sesión
                        </button>
                    </div>
                </aside>
                <main class="main-content">
                    <div class="topbar">
                        <h1 class="topbar-title" id="page-title"></h1>
                        <div class="topbar-actions">
                            <div id="system-status-badge"></div>
                        </div>
                    </div>
                    <div class="content-area" id="content-area">
                        <div class="loading-spinner"><div class="spinner"></div> Cargando...</div>
                    </div>
                </main>
            </div>
            <div id="modal-root"></div>`;

        switch (view) {
            case 'dashboard': loadDashboard(); break;
            case 'stock': loadStock(); break;
            case 'pedidos': loadPedidos(); break;
            case 'despacho': loadDespacho(); break;
            case 'config': loadConfig(); break;
            case 'audit': loadAudit(); break;
        }

        loadSystemStatus();
    }

    /* ============================================
       DASHBOARD VIEW (WMS-focused KPIs)
       ============================================ */
    async function loadDashboard() {
        document.getElementById('page-title').textContent = 'Dashboard WMS';

        try {
            const [kpis, alerts, health] = await Promise.all([
                ApiClient.get('/api/dashboard/kpis').catch(() => null),
                ApiClient.get('/api/dashboard/alerts').catch(() => null),
                ApiClient.health().catch(() => null),
            ]);

            const content = document.getElementById('content-area');
            content.innerHTML = `
                <div class="fade-in">
                    ${renderKpis(kpis)}
                    <div class="grid-2">
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">⚠️ Alertas de Bodega</h3>
                            </div>
                            <div class="card-body">
                                ${renderAlerts(alerts)}
                            </div>
                        </div>
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">🔗 Estado del Sistema</h3>
                            </div>
                            <div class="card-body">
                                ${renderHealthDetails(health)}
                            </div>
                        </div>
                    </div>
                </div>`;

            refreshInterval = setInterval(() => loadDashboard(), 900000); // 15 minutos

        } catch (err) {
            showError('Error cargando dashboard', err.message);
        }
    }

    function renderKpis(data) {
        if (!data) return '';
        const cards = [
            { label: 'Pedidos Hoy', value: data.pedidosHoy?.value ?? 0, icon: '📦', change: data.pedidosHoy?.variacion },
            { label: 'Ventas del Mes', value: formatCurrency(data.ventasMes?.value ?? 0), icon: '💰', change: data.ventasMes?.variacion },
            { label: 'Clientes Activos', value: data.clientesActivos?.value ?? 0, icon: '👥', change: data.clientesActivos?.variacion },
            { label: 'OTV Promedio', value: formatCurrency(data.otvPromedio?.value ?? 0), icon: '📈', change: data.otvPromedio?.variacion },
        ];

        return `<div class="kpi-grid">${cards.map(c => `
            <div class="kpi-card">
                <div class="kpi-icon">${c.icon}</div>
                <div class="kpi-label">${c.label}</div>
                <div class="kpi-value">${c.value}</div>
                <div class="kpi-change ${c.change > 0 ? 'positive' : c.change < 0 ? 'negative' : 'neutral'}">
                    ${c.change > 0 ? '↑' : c.change < 0 ? '↓' : '→'} ${Math.abs(c.change || 0)}%
                </div>
            </div>`).join('')}</div>`;
    }

    function renderAlerts(data) {
        if (!data) return '<p class="text-muted">No se pudieron cargar las alertas</p>';
        const items = [
            { icon: '🚨', count: data.pedidosIncidencia ?? 0, label: 'Pedidos con incidencia', color: 'danger' },
            { icon: '❌', count: data.procesosFallidos ?? 0, label: 'Procesos fallidos', color: 'danger' },
            { icon: '📉', count: data.stockBajo ?? 0, label: 'Productos stock bajo', color: 'warning' },
            { icon: '💳', count: data.clientesDeuda ?? 0, label: 'Clientes con deuda', color: 'warning' },
        ];

        return `<div class="alerts-grid">${items.map(a => `
            <div class="alert-item">
                <div class="alert-icon">${a.icon}</div>
                <div>
                    <div class="alert-count text-${a.color}">${a.count}</div>
                    <div class="alert-label">${a.label}</div>
                </div>
            </div>`).join('')}</div>`;
    }

    function renderHealthDetails(data) {
        if (!data) return '<p class="text-muted">No se pudo conectar al health check</p>';

        const checks = data.checks || {};
        const items = [
            { name: 'Base de Datos', status: checks.database?.status || 'unknown' },
            { name: 'BSale API', status: checks.bsale?.circuitState || 'unknown' },
            { name: 'Shopify API', status: checks.shopify?.circuitState || 'unknown' },
            { name: 'SyncManager', status: checks.syncmanager?.circuitState || 'unknown' },
        ];

        return `
            <div class="system-grid">
                ${items.map(i => `
                    <div class="system-item">
                        <div class="dot ${i.status}"></div>
                        <div>
                            <div class="system-label">${i.name}</div>
                            <div class="system-status">${i.status}</div>
                        </div>
                    </div>`).join('')}
            </div>
            <p class="text-xs text-muted mt-md">Última actualización: ${data.timestamp ? new Date(data.timestamp).toLocaleTimeString('es-CL') : 'N/A'}</p>`;
    }

    /* ============================================
       STOCK VIEW (Inventario)
       ============================================ */
    async function loadStock() {
        document.getElementById('page-title').textContent = 'Stock — Inventario';

        try {
            const data = await ApiClient.get('/api/catalog/products?limit=50').catch(() => null);
            const content = document.getElementById('content-area');
            const products = data?.data || [];

            content.innerHTML = `
                <div class="fade-in">
                    <div class="filter-bar">
                        <input type="text" id="stock-search" placeholder="🔍 Buscar por nombre o SKU..." style="min-width:260px" />
                    </div>
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">📦 Inventario de Productos</h3>
                            <span class="badge badge-neutral">${products.length} productos</span>
                        </div>
                        <div class="card-body ${products.length > 0 ? 'no-padding' : ''}">
                            ${products.length === 0 ? renderEmptyState('📦', 'No hay productos en el catálogo', 'Los productos aparecerán aquí cuando se sincronicen desde Shopify.') : `
                            <div class="table-wrapper">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>SKU</th>
                                            <th>Producto</th>
                                            <th>Variantes</th>
                                            <th>Stock Total</th>
                                            <th>Reservado</th>
                                            <th>Disponible</th>
                                            <th>Nivel</th>
                                            <th>Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody id="stock-table-body">
                                        ${renderStockRows(products)}
                                    </tbody>
                                </table>
                            </div>`}
                        </div>
                    </div>
                </div>`;

            // Wire up search filter
            const searchInput = document.getElementById('stock-search');
            if (searchInput) {
                searchInput.addEventListener('input', () => {
                    const query = searchInput.value.toLowerCase();
                    const tbody = document.getElementById('stock-table-body');
                    if (tbody) {
                        const filtered = products.filter(p =>
                            (p.title || '').toLowerCase().includes(query) ||
                            (p.sku || '').toLowerCase().includes(query)
                        );
                        tbody.innerHTML = renderStockRows(filtered);
                    }
                });
            }

        } catch (err) {
            showError('Error cargando stock', err.message);
        }
    }

    function renderStockRows(products) {
        return products.map(p => {
            const totalStock = getTotalStock(p);
            const reserved = getTotalReserved(p);
            const available = Math.max(0, totalStock - reserved);
            const variantCount = p.variants?.length || 0;
            const level = getStockLevel(available);
            return `
                <tr>
                    <td class="font-mono text-sm">${p.sku || p.id || 'N/A'}</td>
                    <td>${escapeHtml(p.title || 'Sin nombre')}</td>
                    <td>${variantCount}</td>
                    <td><strong>${totalStock}</strong></td>
                    <td>${reserved > 0 ? `<span class="badge badge-warning">${reserved}</span>` : '<span class="text-muted">0</span>'}</td>
                    <td><strong>${available}</strong></td>
                    <td>${stockLevelBadge(level)}</td>
                    <td>${p.status === 'active' || p.status === 'ACTIVE'
                    ? '<span class="badge badge-success">Activo</span>'
                    : '<span class="badge badge-neutral">Inactivo</span>'}</td>
                </tr>`;
        }).join('');
    }

    function getTotalStock(product) {
        if (product.totalInventory !== undefined) return product.totalInventory;
        if (product.variants && Array.isArray(product.variants)) {
            return product.variants.reduce((sum, v) => sum + (v.inventoryQuantity || v.inventory_quantity || 0), 0);
        }
        return 0;
    }

    function getTotalReserved(product) {
        if (product.totalReserved !== undefined) return product.totalReserved;
        if (product.variants && Array.isArray(product.variants)) {
            return product.variants.reduce((sum, v) => sum + (v.reservedQuantity || 0), 0);
        }
        return 0;
    }

    function getStockLevel(qty) {
        if (qty <= 0) return 'out';
        if (qty <= 5) return 'low';
        if (qty <= 20) return 'medium';
        return 'ok';
    }

    function stockLevelBadge(level) {
        const map = {
            ok: { label: 'OK', cls: 'stock-ok' },
            medium: { label: 'Medio', cls: 'stock-medium' },
            low: { label: 'Bajo', cls: 'stock-low' },
            out: { label: 'Sin stock', cls: 'stock-out' },
        };
        const s = map[level] || map.ok;
        return `<span class="stock-level ${s.cls}">${s.label}</span>`;
    }

    /* ============================================
       PEDIDOS VIEW (Orders Pipeline)
       ============================================ */
    async function loadPedidos() {
        document.getElementById('page-title').textContent = 'Pedidos';

        try {
            const [ordersData, pipeline] = await Promise.all([
                ApiClient.get('/api/orders?limit=50').catch(() => null),
                ApiClient.get('/api/orders/pipeline').catch(() => null),
            ]);

            const content = document.getElementById('content-area');
            const orders = ordersData?.data || [];

            content.innerHTML = `
                <div class="fade-in">
                    ${renderPipeline(pipeline)}
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">🛒 Lista de Pedidos</h3>
                            <span class="badge badge-neutral">${ordersData?.total || orders.length} pedidos</span>
                        </div>
                        <div class="card-body ${orders.length > 0 ? 'no-padding' : ''}">
                            ${orders.length === 0 ? renderEmptyState('🛒', 'No hay pedidos registrados', 'Los pedidos aparecerán cuando se creen desde Shopify o manualmente.') : `
                            <div class="table-wrapper">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>ID Interno</th>
                                            <th>Shopify ID</th>
                                            <th>Estado</th>
                                            <th>Status</th>
                                            <th>Acciones Disp.</th>
                                            <th>Fecha</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${renderOrderRows(orders)}
                                    </tbody>
                                </table>
                            </div>`}
                        </div>
                    </div>
                </div>`;

            // Wire flow-node clicks for filtering
            document.querySelectorAll('.flow-node[data-state]').forEach(el => {
                el.addEventListener('click', () => {
                    const clickedState = el.dataset.state;
                    if (state.pedidosFilter === clickedState) {
                        state.pedidosFilter = null;
                    } else {
                        state.pedidosFilter = clickedState;
                    }
                    applyPedidosFilter(orders);
                    document.querySelectorAll('.flow-node').forEach(s => s.classList.remove('active'));
                    if (state.pedidosFilter) {
                        el.classList.add('active');
                    }
                });
            });

        } catch (err) {
            showError('Error cargando pedidos', err.message);
        }
    }

    function renderPipeline(pipeline) {
        if (!pipeline) return '';

        // Flow definition: state -> action -> next state
        const flowSteps = [
            { key: 'recibido', label: 'Recibido', icon: '📥' },
            { action: 'validate', label: 'Validar' },
            { key: 'validado', label: 'Validado', icon: '✅' },
            { action: 'send_to_warehouse', label: 'A Bodega' },
            { key: 'en_preparacion', label: 'Preparación', icon: '📦' },
            { action: 'confirm_picking', label: 'Picking' },
            { key: 'listo_bodega', label: 'Listo', icon: '🏠' },
            { action: 'generate_invoice', label: 'Facturar' },
            { key: 'facturado', label: 'Facturado', icon: '🧾' },
            { action: 'dispatch', label: 'Despachar' },
            { key: 'despachado', label: 'Despachado', icon: '🚚' },
            { action: 'deliver', label: 'Entregar' },
            { key: 'entregado', label: 'Entregado', icon: '🎉' },
        ];

        const incidenciaCount = pipeline['incidencia'] || 0;

        let html = `<div class="flow-diagram"><div class="flow-diagram-inner">`;
        flowSteps.forEach(step => {
            if (step.key) {
                const count = pipeline[step.key] || 0;
                const isActive = state.pedidosFilter === step.key;
                html += `<div class="flow-node ${isActive ? 'active' : ''}" data-state="${step.key}">
                    <div class="node-icon">${step.icon}</div>
                    <div class="node-count">${count}</div>
                    <div class="node-label">${step.label}</div>
                </div>`;
            } else {
                html += `<div class="flow-arrow">
                    <div class="arrow-label">${step.label}</div>
                    <div class="arrow-line"></div>
                </div>`;
            }
        });

        // Incidencia node (separate)
        if (incidenciaCount > 0) {
            html += `<div class="flow-arrow error-arrow">
                <div class="arrow-label">Incidencia</div>
                <div class="arrow-line"></div>
            </div>
            <div class="flow-node incidencia" data-state="incidencia">
                <div class="node-icon">🚨</div>
                <div class="node-count">${incidenciaCount}</div>
                <div class="node-label">Incidencia</div>
            </div>`;
        }

        html += `</div></div>`;
        return html;
    }

    function renderOrderRows(orders) {
        return orders.map(o => {
            const actions = (o.accionesDisponibles || []);
            const actionBtns = actions.length > 0
                ? `<div class="action-btn-group">${actions.map(a => {
                    const info = ACTION_LABELS[a] || { label: a, cls: '' };
                    return `<button class="action-btn ${info.cls}" onclick="event.stopPropagation(); App.executeOrderAction('${o.internalId}', '${a}')">${info.label}</button>`;
                }).join('')}</div>`
                : '<span class="text-muted">—</span>';

            return `
                <tr data-order-state="${o.estado}" style="cursor:pointer" onclick="App.showOrderDetail('${o.internalId}')">
                    <td class="font-mono text-sm">${truncateId(o.internalId)}</td>
                    <td class="font-mono text-sm">${o.shopifyId ? truncateId(o.shopifyId) : '—'}</td>
                    <td>${orderStateBadge(o.estado)}</td>
                    <td>${statusBadge(o.status)}</td>
                    <td onclick="event.stopPropagation()">${actionBtns}</td>
                    <td class="text-muted">${formatDate(o.fechaCreacion)}</td>
                </tr>`;
        }).join('');
    }

    function applyPedidosFilter(orders) {
        const rows = document.querySelectorAll('tr[data-order-state]');
        rows.forEach(row => {
            if (!state.pedidosFilter || row.dataset.orderState === state.pedidosFilter) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    function orderStateBadge(estado) {
        const map = {
            nuevo: { cls: 'badge-neutral', label: 'Nuevo' },
            validado: { cls: 'badge-info', label: 'Validado' },
            en_preparacion: { cls: 'badge-warning', label: 'En Preparación' },
            listo_bodega: { cls: 'badge-primary', label: 'Listo Bodega' },
            facturado: { cls: 'badge-info', label: 'Facturado' },
            despachado: { cls: 'badge-warning', label: 'Despachado' },
            entregado: { cls: 'badge-success', label: 'Entregado' },
            incidencia: { cls: 'badge-danger', label: 'Incidencia' },
            completado: { cls: 'badge-success', label: 'Completado' },
        };
        const s = map[estado] || { cls: 'badge-neutral', label: estado || 'Desconocido' };
        return `<span class="badge ${s.cls}">${s.label}</span>`;
    }

    /* ============================================
       DESPACHO VIEW (Dispatch Routes + Confirmation)
       ============================================ */
    async function loadDespacho() {
        document.getElementById('page-title').textContent = 'Despacho';

        try {
            const routes = await ApiClient.get('/api/logistics/routes').catch(() => []);
            const content = document.getElementById('content-area');
            const routeList = Array.isArray(routes) ? routes : [];

            // Count by status for tabs
            const counts = {
                todas: routeList.length,
                planificada: routeList.filter(r => r.estado === 'planificada').length,
                en_ruta: routeList.filter(r => r.estado === 'en_ruta').length,
                completada: routeList.filter(r => r.estado === 'completada' || r.status === 'completed').length,
            };

            content.innerHTML = `
                <div class="fade-in">
                    <div class="tab-bar">
                        <button class="tab-item ${state.despachoTab === 'todas' ? 'active' : ''}" data-tab="todas">
                            Todas <span class="tab-count">${counts.todas}</span>
                        </button>
                        <button class="tab-item ${state.despachoTab === 'planificada' ? 'active' : ''}" data-tab="planificada">
                            📋 Planificadas <span class="tab-count">${counts.planificada}</span>
                        </button>
                        <button class="tab-item ${state.despachoTab === 'en_ruta' ? 'active' : ''}" data-tab="en_ruta">
                            🚚 En Ruta <span class="tab-count">${counts.en_ruta}</span>
                        </button>
                        <button class="tab-item ${state.despachoTab === 'completada' ? 'active' : ''}" data-tab="completada">
                            ✅ Completadas <span class="tab-count">${counts.completada}</span>
                        </button>
                    </div>
                    <div id="despacho-routes">
                        ${routeList.length === 0
                    ? renderEmptyState('🚚', 'No hay rutas de despacho', 'Las rutas aparecerán cuando se asignen pedidos listos para despacho.')
                    : renderRouteCards(routeList)}
                    </div>
                </div>`;

            // Wire tabs
            document.querySelectorAll('.tab-item[data-tab]').forEach(tab => {
                tab.addEventListener('click', () => {
                    state.despachoTab = tab.dataset.tab;
                    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    filterRouteCards(routeList);
                });
            });

            // Wire expand/collapse on route headers
            document.querySelectorAll('.route-card-header[data-route-id]').forEach(header => {
                header.addEventListener('click', () => {
                    const routeId = header.dataset.routeId;
                    const body = document.getElementById(`route-body-${routeId}`);
                    if (!body) return;

                    if (state.expandedRoutes.has(routeId)) {
                        state.expandedRoutes.delete(routeId);
                        body.classList.remove('expanded');
                        body.classList.add('collapsed');
                    } else {
                        state.expandedRoutes.add(routeId);
                        body.classList.remove('collapsed');
                        body.classList.add('expanded');
                    }
                });
            });

        } catch (err) {
            showError('Error cargando despacho', err.message);
        }
    }

    function renderRouteCards(routes) {
        return `<div class="route-cards">
            ${routes.map(r => {
            const log = Array.isArray(r.stepsLog) ? r.stepsLog : [];
            const firstStep = log[0] || {};
            const pedidosIds = firstStep.pedidos || [];
            const isExpanded = state.expandedRoutes.has(r.id);

            return `
                <div class="route-card" data-route-estado="${r.estado}" data-route-status="${r.status}">
                    <div class="route-card-header" data-route-id="${r.id}">
                        <div class="route-card-info">
                            <div class="route-card-id">🚚 ${r.internalId || truncateId(r.id)}</div>
                            ${routeStatusBadge(r.estado, r.status)}
                        </div>
                        <div class="route-card-meta">
                            <span>📅 ${firstStep.fecha || formatDate(r.fechaCreacion)}</span>
                            <span>📍 ${firstStep.zona || '—'}</span>
                            <span>📦 ${pedidosIds.length} pedidos</span>
                            <span style="font-size:1.1rem">${isExpanded ? '▲' : '▼'}</span>
                        </div>
                    </div>
                    <div class="route-card-body ${isExpanded ? 'expanded' : 'collapsed'}" id="route-body-${r.id}">
                        ${pedidosIds.length === 0
                    ? '<div style="padding: 16px 24px;" class="text-muted">No hay pedidos asignados a esta ruta.</div>'
                    : pedidosIds.map(pedidoId => `
                                <div class="route-order-item">
                                    <div class="route-order-info">
                                        <span class="order-id">${pedidoId}</span>
                                    </div>
                                    <div>
                                        <button class="btn btn-success btn-sm" onclick="event.stopPropagation(); App.showDispatchConfirmModal('${r.id}', '${pedidoId}')">
                                            ✅ Confirmar Entrega
                                        </button>
                                    </div>
                                </div>`).join('')}
                    </div>
                </div>`;
        }).join('')}
        </div>`;
    }

    function filterRouteCards(routes) {
        const cards = document.querySelectorAll('.route-card[data-route-estado]');
        cards.forEach(card => {
            const estado = card.dataset.routeEstado;
            const status = card.dataset.routeStatus;
            const tab = state.despachoTab;

            if (tab === 'todas') {
                card.style.display = '';
            } else if (tab === 'completada') {
                card.style.display = (estado === 'completada' || status === 'completed') ? '' : 'none';
            } else {
                card.style.display = (estado === tab) ? '' : 'none';
            }
        });
    }

    function routeStatusBadge(estado, status) {
        if (status === 'completed' || estado === 'completada') {
            return '<span class="badge badge-success">Completada</span>';
        }
        if (estado === 'en_ruta') {
            return '<span class="badge badge-warning">En Ruta</span>';
        }
        if (estado === 'planificada') {
            return '<span class="badge badge-info">Planificada</span>';
        }
        return `<span class="badge badge-neutral">${estado || status || 'Desconocido'}</span>`;
    }

    /* ============================================
       DISPATCH CONFIRMATION MODAL
       ============================================ */
    function showDispatchConfirmModal(routeId, orderId) {
        const modalRoot = document.getElementById('modal-root');
        if (!modalRoot) return;

        modalRoot.innerHTML = `
            <div class="modal-overlay" id="dispatch-modal-overlay">
                <div class="modal-card">
                    <div class="modal-header">
                        <h3>✅ Confirmar Entrega</h3>
                        <button class="modal-close" id="modal-close-btn">✕</button>
                    </div>
                    <div class="modal-body">
                        <div class="confirm-summary">
                            <div class="summary-row">
                                <span class="label">Ruta</span>
                                <span class="value font-mono">${truncateId(routeId)}</span>
                            </div>
                            <div class="summary-row">
                                <span class="label">Pedido</span>
                                <span class="value font-mono">${orderId}</span>
                            </div>
                        </div>
                        <div class="confirm-field">
                            <label>Nombre del Receptor *</label>
                            <input type="text" id="confirm-receptor" placeholder="Nombre de quien recibe" required />
                            <div class="field-hint">Obligatorio — nombre de la persona que recibe el pedido</div>
                        </div>
                        <div class="confirm-field">
                            <label>Notas (opcional)</label>
                            <textarea id="confirm-notas" rows="3" placeholder="Observaciones de la entrega..."></textarea>
                        </div>
                        <div id="confirm-error" class="login-error"></div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-ghost btn-sm" id="modal-cancel-btn">Cancelar</button>
                        <button class="btn btn-success btn-sm" id="modal-confirm-btn">
                            ✅ Confirmar Entrega
                        </button>
                    </div>
                </div>
            </div>`;

        // Wire modal events
        const closeModal = () => { modalRoot.innerHTML = ''; };

        document.getElementById('modal-close-btn').addEventListener('click', closeModal);
        document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);

        // Close on overlay click (outside the card)
        document.getElementById('dispatch-modal-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'dispatch-modal-overlay') closeModal();
        });

        // Close on Escape key
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        // Confirm action
        document.getElementById('modal-confirm-btn').addEventListener('click', async () => {
            const receptor = document.getElementById('confirm-receptor').value.trim();
            const notas = document.getElementById('confirm-notas').value.trim();
            const errorEl = document.getElementById('confirm-error');
            const confirmBtn = document.getElementById('modal-confirm-btn');

            if (!receptor) {
                errorEl.textContent = 'El nombre del receptor es obligatorio.';
                errorEl.classList.add('visible');
                return;
            }

            confirmBtn.disabled = true;
            confirmBtn.textContent = 'Confirmando...';
            errorEl.classList.remove('visible');

            try {
                await ApiClient.post(`/api/logistics/routes/${routeId}/orders/${orderId}/deliver`, {
                    receptorNombre: receptor,
                    notas: notas || undefined,
                });

                closeModal();
                // Reload despacho to reflect the change
                loadDespacho();
            } catch (err) {
                errorEl.textContent = err.message || 'Error al confirmar la entrega';
                errorEl.classList.add('visible');
                confirmBtn.disabled = false;
                confirmBtn.textContent = '✅ Confirmar Entrega';
            }
        });

        // Auto-focus on receptor input
        setTimeout(() => {
            const input = document.getElementById('confirm-receptor');
            if (input) input.focus();
        }, 100);
    }

    /* ============================================
       CONFIG VIEW
       ============================================ */
    async function loadConfig() {
        document.getElementById('page-title').textContent = 'Configuración';

        try {
            const [rules, integrations] = await Promise.all([
                ApiClient.get('/api/config/business-rules').catch(() => []),
                ApiClient.get('/api/config/integrations').catch(() => null),
            ]);

            const content = document.getElementById('content-area');
            content.innerHTML = `
                <div class="fade-in">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">📏 Reglas de Negocio</h3>
                            <span class="badge badge-neutral">${Array.isArray(rules) ? rules.length : 0} reglas</span>
                        </div>
                        <div class="card-body">
                            ${renderRules(rules)}
                        </div>
                    </div>
                    ${integrations ? `
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">🔗 Estado de Integraciones</h3>
                        </div>
                        <div class="card-body">
                            ${renderIntegrations(integrations)}
                        </div>
                    </div>` : ''}
                </div>`;
        } catch (err) {
            showError('Error cargando configuración', err.message);
        }
    }

    function renderRules(rules) {
        if (!Array.isArray(rules) || rules.length === 0) {
            return renderEmptyState('📏', 'No hay reglas configuradas', '');
        }

        return `<div class="rules-list">${rules.map(r => `
            <div class="rule-item">
                <div class="rule-info">
                    <div class="rule-key">${r.ruleKey}</div>
                    <div class="rule-desc">${r.description}</div>
                </div>
                <div class="rule-value">${formatRuleValue(r.ruleValue)}</div>
            </div>`).join('')}</div>`;
    }

    function renderIntegrations(data) {
        if (!data) return '<p class="text-muted">No disponible</p>';

        const items = Object.entries(data).map(([key, val]) => {
            const status = typeof val === 'object' ? (val.circuitState || val.status || 'unknown') : String(val);
            return { name: key, status };
        });

        return `<div class="system-grid">${items.map(i => `
            <div class="system-item">
                <div class="dot ${i.status}"></div>
                <div>
                    <div class="system-label">${i.name}</div>
                    <div class="system-status">${i.status}</div>
                </div>
            </div>`).join('')}</div>`;
    }

    /* ============================================
       AUDIT VIEW
       ============================================ */
    async function loadAudit() {
        document.getElementById('page-title').textContent = 'Auditoría';

        try {
            const data = await ApiClient.get('/api/audit').catch(() => null);
            const content = document.getElementById('content-area');

            if (!data || !data.data || data.data.length === 0) {
                content.innerHTML = `
                    <div class="fade-in">
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">📋 Log de Auditoría</h3>
                            </div>
                            <div class="card-body">
                                ${renderEmptyState('📋', 'No hay registros de auditoría aún.', '')}
                            </div>
                        </div>
                    </div>`;
                return;
            }

            content.innerHTML = `
                <div class="fade-in">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">📋 Log de Auditoría</h3>
                            <span class="badge badge-neutral">${data.total ?? data.data.length} registros</span>
                        </div>
                        <div class="card-body no-padding">
                            <div class="table-wrapper">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Timestamp</th>
                                            <th>Acción</th>
                                            <th>Actor</th>
                                            <th>Entidad</th>
                                            <th>Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${data.data.map(a => `
                                            <tr>
                                                <td class="text-muted">${formatDate(a.timestamp)}</td>
                                                <td><span class="badge badge-info">${a.action}</span></td>
                                                <td>${a.actor}</td>
                                                <td class="font-mono text-sm">${a.entityType}/${truncateId(a.entityId)}</td>
                                                <td>${statusBadge(a.status)}</td>
                                            </tr>`).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>`;
        } catch (err) {
            showError('Error cargando auditoría', err.message);
        }
    }

    /* ============================================
       SYSTEM STATUS (topbar)
       ============================================ */
    async function loadSystemStatus() {
        const badge = document.getElementById('system-status-badge');
        if (!badge) return;

        try {
            const health = await ApiClient.health();
            const cls = health.status === 'healthy' ? 'healthy' : 'degraded';
            badge.innerHTML = `
                <div class="status-badge ${cls}">
                    <div class="status-dot"></div>
                    ${health.status === 'healthy' ? 'Sistema OK' : 'Degradado'}
                </div>`;
        } catch {
            badge.innerHTML = `
                <div class="status-badge offline">
                    <div class="status-dot"></div>
                    Offline
                </div>`;
        }
    }

    /* ============================================
       HELPERS
       ============================================ */
    function clearAutoRefresh() {
        if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
        }
    }

    function showError(title, message) {
        const content = document.getElementById('content-area');
        if (content) {
            content.innerHTML = `
                <div class="card">
                    <div class="card-body">
                        <p class="text-danger">${title}</p>
                        <p class="text-muted text-sm mt-md">${message}</p>
                    </div>
                </div>`;
        }
    }

    function renderEmptyState(icon, title, subtitle) {
        return `
            <div class="empty-state">
                <div class="icon">${icon}</div>
                <p>${title}</p>
                ${subtitle ? `<p class="text-sm text-muted mt-md">${subtitle}</p>` : ''}
            </div>`;
    }

    function formatCurrency(value) {
        return '$' + (value || 0).toLocaleString('es-CL');
    }

    function formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-CL') + ' ' + d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    }

    function truncateId(id) {
        if (!id) return 'N/A';
        return id.length > 16 ? id.substring(0, 12) + '...' : id;
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function statusBadge(status) {
        const map = {
            pending: { cls: 'badge-neutral', label: 'Pendiente' },
            in_progress: { cls: 'badge-info', label: 'En Progreso' },
            completed: { cls: 'badge-success', label: 'Completado' },
            failed: { cls: 'badge-danger', label: 'Fallido' },
            compensating: { cls: 'badge-warning', label: 'Compensando' },
            success: { cls: 'badge-success', label: 'Éxito' },
            error: { cls: 'badge-danger', label: 'Error' },
        };
        const s = map[status] || { cls: 'badge-neutral', label: status || 'Desconocido' };
        return `<span class="badge ${s.cls}">${s.label}</span>`;
    }

    function formatRuleValue(val) {
        if (!val) return 'N/A';
        if (typeof val === 'object') {
            if (val.value !== undefined) return String(val.value);
            if (val.hora !== undefined) return val.hora;
            if (val.zonas) return `${val.zonas.length} zonas`;
            if (val.opciones) return `${val.opciones.length} opciones`;
            return JSON.stringify(val).substring(0, 30);
        }
        return String(val);
    }

    // Public API (exposed for onclick handlers in rendered HTML)
    return {
        init,
        showDispatchConfirmModal,
        executeOrderAction,
        showOrderDetail,
        generateTrackingLink,
        _setTrackingView,
    };

    /* ============================================
       EXECUTE ORDER ACTION (Advance State)
       ============================================ */
    async function executeOrderAction(orderId, action) {
        const info = ACTION_LABELS[action] || { label: action };
        if (!confirm(`¿Ejecutar "${info.label}" en pedido ${orderId}?`)) return;

        try {
            await ApiClient.post(`/api/orders/${orderId}/advance`, { action, data: {} });
            loadPedidos(); // Refresh view
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    }

    /* ============================================
       ORDER DETAIL MODAL (Timeline + Evidence)
       ============================================ */
    async function showOrderDetail(orderId) {
        const modalRoot = document.getElementById('modal-root');
        if (!modalRoot) return;

        modalRoot.innerHTML = `<div class="modal-overlay"><div class="modal-card"><div class="modal-body"><div class="loading-spinner"><div class="spinner"></div> Cargando...</div></div></div></div>`;

        try {
            const [order, evidence] = await Promise.all([
                ApiClient.get(`/api/orders/${orderId}`),
                ApiClient.get(`/api/orders/${orderId}/evidence`).catch(() => []),
            ]);

            const stepsLog = Array.isArray(order.stepsLog) ? order.stepsLog : [];
            const actions = order.accionesDisponibles || [];

            modalRoot.innerHTML = `
                <div class="modal-overlay" id="detail-modal-overlay">
                    <div class="modal-card" style="width:560px">
                        <div class="modal-header">
                            <h3>📋 Pedido ${truncateId(order.internalId)}</h3>
                            <button class="modal-close" id="detail-close-btn">✕</button>
                        </div>
                        <div class="modal-body">
                            <div class="confirm-summary">
                                <div class="summary-row">
                                    <span class="label">Estado</span>
                                    <span class="value">${orderStateBadge(order.estado)}</span>
                                </div>
                                <div class="summary-row">
                                    <span class="label">Status</span>
                                    <span class="value">${statusBadge(order.status)}</span>
                                </div>
                                <div class="summary-row">
                                    <span class="label">Fecha</span>
                                    <span class="value">${formatDate(order.fechaCreacion)}</span>
                                </div>
                                ${order.shopifyId ? `<div class="summary-row"><span class="label">Shopify</span><span class="value font-mono">${truncateId(order.shopifyId)}</span></div>` : ''}
                            </div>

                            ${actions.length > 0 ? `
                            <div style="margin-bottom: var(--space-md)">
                                <div style="font-size:0.75rem; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; color:var(--color-text-muted); margin-bottom:var(--space-xs)">Acciones Disponibles</div>
                                <div class="action-btn-group">
                                    ${actions.map(a => {
                const info = ACTION_LABELS[a] || { label: a, cls: '' };
                return `<button class="action-btn ${info.cls}" onclick="App.executeOrderAction('${order.internalId}', '${a}')">${info.label}</button>`;
            }).join('')}
                                </div>
                            </div>` : ''}

                            <div style="margin-bottom: var(--space-md)">
                                <div style="font-size:0.75rem; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; color:var(--color-text-muted); margin-bottom:var(--space-sm)">Timeline</div>
                                <div class="timeline">
                                    ${stepsLog.filter(s => s.step !== 'tracking_token_generated').map((s, i) => {
                const label = s.action ? (ACTION_LABELS[s.action]?.label || s.action) : (s.step || 'Creado');
                const isCurrent = i === stepsLog.filter(x => x.step !== 'tracking_token_generated').length - 1;
                const isError = s.step === 'discrepancy_reported';
                return `<div class="timeline-item ${isCurrent ? 'current' : ''} ${isError ? 'error' : ''}">
                                            <div class="timeline-dot"></div>
                                            <div class="timeline-content">
                                                <div class="timeline-action">${label}${s.from && s.to ? ` (${s.from} → ${s.to})` : ''}</div>
                                                <div class="timeline-time">${s.timestamp ? formatDate(s.timestamp) : ''}</div>
                                            </div>
                                        </div>`;
            }).join('')}
                                </div>
                            </div>

                            ${evidence.length > 0 ? `
                            <div>
                                <div style="font-size:0.75rem; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; color:var(--color-text-muted); margin-bottom:var(--space-sm)">Evidencia</div>
                                <div class="evidence-list">
                                    ${evidence.map(e => `
                                        <div class="evidence-item ${e.type === 'reception_confirmed' ? 'reception' : 'discrepancy'}">
                                            ${e.filePath ? `<img class="evidence-thumb" src="${e.filePath}" alt="evidencia" />` : ''}
                                            <div class="evidence-info">
                                                <div class="evidence-type">${e.type === 'reception_confirmed' ? '✅ Recepción confirmada' : '⚠️ Discrepancia reportada'}</div>
                                                <div class="evidence-meta">${e.receptorNombre || ''} ${e.discrepancyType || ''} — ${formatDate(e.timestamp)}</div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>` : ''}
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-ghost btn-sm" id="detail-gen-link-btn">🔗 Generar Link Tracking</button>
                            <button class="btn btn-ghost btn-sm" id="detail-done-btn">Cerrar</button>
                        </div>
                    </div>
                </div>`;

            const closeModal = () => { modalRoot.innerHTML = ''; };
            document.getElementById('detail-close-btn').addEventListener('click', closeModal);
            document.getElementById('detail-done-btn').addEventListener('click', closeModal);
            document.getElementById('detail-modal-overlay').addEventListener('click', e => {
                if (e.target.id === 'detail-modal-overlay') closeModal();
            });

            document.getElementById('detail-gen-link-btn').addEventListener('click', () => {
                generateTrackingLink(order.internalId);
            });

        } catch (err) {
            modalRoot.innerHTML = '';
            alert(`Error cargando detalle: ${err.message}`);
        }
    }

    /* ============================================
       GENERATE TRACKING LINK
       ============================================ */
    async function generateTrackingLink(orderId) {
        try {
            const result = await ApiClient.post(`/api/orders/${orderId}/evidence-token`, {});
            const crmOrigin = new URLSearchParams(window.location.search).get('crm_url') || 'http://localhost:5173';
            const fullUrl = `${crmOrigin}${result.url}`;
            prompt('Link de tracking para el cliente (copiar):', fullUrl);
        } catch (err) {
            alert(`Error generando link: ${err.message}`);
        }
    }

    /* ============================================
       TRACKING PORTAL (Public — No Auth)
       ============================================ */
    async function renderTracking() {
        const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
        const token = params.get('token');

        if (!token) {
            $root().innerHTML = `<div class="tracking-container"><div class="tracking-card"><div class="tracking-body">${renderEmptyState('🔗', 'Link inválido', 'Por favor use el link proporcionado por WhakaChile.')}</div></div></div>`;
            return;
        }

        $root().innerHTML = `<div class="tracking-container"><div class="tracking-card"><div class="tracking-body"><div class="loading-spinner"><div class="spinner"></div> Cargando...</div></div></div></div>`;

        try {
            const data = await ApiClient.publicGet(`/api/evidence/${token}`);
            state.trackingView = 'status';
            renderTrackingContent(data, token);
        } catch (err) {
            $root().innerHTML = `<div class="tracking-container"><div class="tracking-card"><div class="tracking-body">${renderEmptyState('❌', 'Token inválido o expirado', err.message)}</div></div></div>`;
        }
    }

    function renderTrackingContent(data, token) {
        const stateOrder = ['recibido', 'validado', 'en_preparacion', 'listo_bodega', 'facturado', 'despachado', 'entregado'];
        const stateLabels = { recibido: 'Recibido', validado: 'Validado', en_preparacion: 'En Preparación', listo_bodega: 'Listo', facturado: 'Facturado', despachado: 'Despachado', entregado: 'Entregado' };
        const currentIdx = stateOrder.indexOf(data.estado);
        const isDelivered = data.estado === 'entregado';
        const hasConfirmed = data.evidence.some(e => e.type === 'reception_confirmed');

        const stepIndicator = stateOrder.map((s, i) => {
            let cls = '';
            if (i < currentIdx) cls = 'completed';
            else if (i === currentIdx) cls = 'current';
            return `<div class="tracking-step ${cls}"><div class="step-line"></div><div class="step-dot"></div><div class="step-name">${stateLabels[s]}</div></div>`;
        }).join('');

        const view = state.trackingView;

        let formHtml = '';
        if (view === 'confirm') {
            formHtml = `<div class="tracking-form">
                <div class="form-title">✅ Confirmar Recepción</div>
                <div class="confirm-field"><label>Nombre del Receptor *</label><input type="text" id="track-receptor" placeholder="Su nombre" required /></div>
                <div class="confirm-field"><label>Foto de evidencia (opcional)</label>
                    <div class="upload-zone" id="track-upload-zone"><div class="upload-icon">📷</div><div class="upload-text">Toque para tomar foto o seleccionar imagen</div><div class="upload-hint">JPG, PNG, WebP — Max 10MB</div><input type="file" id="track-file-input" accept="image/*" capture="environment" /></div>
                    <div id="track-preview"></div>
                </div>
                <div class="confirm-field"><label>Notas (opcional)</label><textarea id="track-notas" rows="2" placeholder="Observaciones..."></textarea></div>
                <div id="track-error" class="login-error"></div>
                <div class="tracking-actions">
                    <button class="btn btn-ghost" onclick="App._setTrackingView('status', '${token}')">← Volver</button>
                    <button class="btn btn-success" id="track-confirm-btn">✅ Confirmar</button>
                </div>
            </div>`;
        } else if (view === 'discrepancy') {
            formHtml = `<div class="tracking-form">
                <div class="form-title">⚠️ Reportar Discrepancia</div>
                <div class="confirm-field"><label>Tipo de Problema *</label><select id="track-disc-type"><option value="">Seleccionar...</option><option value="producto_danado">Producto dañado</option><option value="producto_faltante">Producto faltante</option><option value="producto_incorrecto">Producto incorrecto</option><option value="cantidad_incorrecta">Cantidad incorrecta</option><option value="otro">Otro</option></select></div>
                <div class="confirm-field"><label>Descripción *</label><textarea id="track-disc-desc" rows="3" placeholder="Describa el problema..." required></textarea></div>
                <div class="confirm-field"><label>Foto (opcional)</label>
                    <div class="upload-zone" id="track-upload-zone"><div class="upload-icon">📷</div><div class="upload-text">Toque para tomar foto</div><input type="file" id="track-file-input" accept="image/*" capture="environment" /></div>
                    <div id="track-preview"></div>
                </div>
                <div id="track-error" class="login-error"></div>
                <div class="tracking-actions">
                    <button class="btn btn-ghost" onclick="App._setTrackingView('status', '${token}')">← Volver</button>
                    <button class="btn btn-danger" id="track-disc-btn">⚠️ Enviar Reporte</button>
                </div>
            </div>`;
        } else if (view === 'success') {
            formHtml = `<div class="tracking-success"><div class="success-icon">✅</div><div class="success-title">¡Enviado exitosamente!</div><div class="success-msg">Gracias. WhakaChile ha recibido su información.</div></div>`;
        }

        $root().innerHTML = `
            <div class="tracking-container">
                <div class="tracking-card">
                    <div class="tracking-header">
                        <h1>🐋 WhakaChile</h1>
                        <div class="tracking-order-id">Pedido: ${data.internalId}</div>
                    </div>
                    <div class="tracking-body">
                        <div class="tracking-status-bar">
                            <span class="current-status">${orderStateBadge(data.estado)}</span>
                            <span class="text-muted text-sm">${isDelivered ? 'Entregado' : 'En proceso'}</span>
                        </div>
                        <div class="tracking-step-indicator">${stepIndicator}</div>
                        ${view === 'status' ? `
                            ${data.evidence.length > 0 ? `
                            <div style="margin-bottom:var(--space-md)">
                                <div style="font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:var(--color-text-muted);margin-bottom:var(--space-xs)">Historial</div>
                                <div class="evidence-list">${data.evidence.map(e => `
                                    <div class="evidence-item ${e.type === 'reception_confirmed' ? 'reception' : 'discrepancy'}">
                                        <div class="evidence-info">
                                            <div class="evidence-type">${e.type === 'reception_confirmed' ? '✅ Recepción confirmada' : '⚠️ Discrepancia'}</div>
                                            <div class="evidence-meta">${e.receptorNombre || e.discrepancyType || ''} — ${formatDate(e.timestamp)}</div>
                                        </div>
                                    </div>`).join('')}</div>
                            </div>` : ''}
                            ${!hasConfirmed ? `<div class="tracking-actions">
                                <button class="btn btn-success" onclick="App._setTrackingView('confirm', '${token}')">✅ Confirmar Recepción</button>
                                <button class="btn btn-warning" onclick="App._setTrackingView('discrepancy', '${token}')">⚠️ Reportar Problema</button>
                            </div>` : ''}
                        ` : formHtml}
                    </div>
                    <div style="text-align:center; padding: var(--space-md); font-size:0.7rem; color:var(--color-text-muted)">WMS WhakaChile v1.0</div>
                </div>
            </div>`;

        // Wire upload and submit events
        wireTrackingEvents(token, data, view);
    }

    function wireTrackingEvents(token, data, view) {
        const fileInput = document.getElementById('track-file-input');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                state.selectedFile = file || null;
                const preview = document.getElementById('track-preview');
                const zone = document.getElementById('track-upload-zone');
                if (file && preview && zone) {
                    zone.classList.add('has-file');
                    const url = URL.createObjectURL(file);
                    preview.innerHTML = `<div class="upload-preview"><img src="${url}" alt="preview" /><div class="file-info"><div class="file-name">${file.name}</div><div class="file-size">${(file.size / 1024).toFixed(0)} KB</div></div><button class="remove-file" onclick="document.getElementById('track-file-input').value=''; document.getElementById('track-preview').innerHTML=''; document.getElementById('track-upload-zone').classList.remove('has-file');">✕</button></div>`;
                }
            });
        }

        if (view === 'confirm') {
            const btn = document.getElementById('track-confirm-btn');
            if (btn) btn.addEventListener('click', async () => {
                const receptor = document.getElementById('track-receptor')?.value.trim();
                const notas = document.getElementById('track-notas')?.value.trim();
                const errorEl = document.getElementById('track-error');

                if (!receptor) { errorEl.textContent = 'El nombre es obligatorio'; errorEl.classList.add('visible'); return; }

                btn.disabled = true; btn.textContent = 'Enviando...';
                try {
                    const formData = new FormData();
                    formData.append('receptorNombre', receptor);
                    if (notas) formData.append('notas', notas);
                    if (state.selectedFile) formData.append('photo', state.selectedFile);
                    await ApiClient.publicPost(`/api/evidence/${token}/confirm`, formData);
                    state.trackingView = 'success';
                    state.selectedFile = null;
                    const refreshed = await ApiClient.publicGet(`/api/evidence/${token}`);
                    renderTrackingContent(refreshed, token);
                } catch (err) {
                    errorEl.textContent = err.message; errorEl.classList.add('visible');
                    btn.disabled = false; btn.textContent = '✅ Confirmar';
                }
            });
        }

        if (view === 'discrepancy') {
            const btn = document.getElementById('track-disc-btn');
            if (btn) btn.addEventListener('click', async () => {
                const type = document.getElementById('track-disc-type')?.value;
                const desc = document.getElementById('track-disc-desc')?.value.trim();
                const errorEl = document.getElementById('track-error');

                if (!type || !desc) { errorEl.textContent = 'Tipo y descripción son obligatorios'; errorEl.classList.add('visible'); return; }

                btn.disabled = true; btn.textContent = 'Enviando...';
                try {
                    const formData = new FormData();
                    formData.append('type', type);
                    formData.append('description', desc);
                    if (state.selectedFile) formData.append('photo', state.selectedFile);
                    await ApiClient.publicPost(`/api/evidence/${token}/discrepancy`, formData);
                    state.trackingView = 'success';
                    state.selectedFile = null;
                    const refreshed = await ApiClient.publicGet(`/api/evidence/${token}`);
                    renderTrackingContent(refreshed, token);
                } catch (err) {
                    errorEl.textContent = err.message; errorEl.classList.add('visible');
                    btn.disabled = false; btn.textContent = '⚠️ Enviar Reporte';
                }
            });
        }
    }

    function _setTrackingView(view, token) {
        state.trackingView = view;
        state.selectedFile = null;
        ApiClient.publicGet(`/api/evidence/${token}`).then(data => renderTrackingContent(data, token));
    }
})();

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', App.init);
