import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Phone, MoreVertical, Smile, Send, ArrowLeft, Leaf, User, ChevronRight, CheckCheck, Clock, Zap, ChevronDown, FileText, BarChart3 } from 'lucide-react';
import { PRODUCTOS, CATEGORIAS, CLIENTES, formatCLP } from '../data/mockData';
import BotPedidosWhatsApp from './BotPedidosWhatsApp';
import BillingQueuePanel from '../../components/BillingQueuePanel';

/* ================================================================
   FLOW ENGINE — State machine driving both Etapa 0 and Etapa 1
   ================================================================ */

const ETAPA0_STEPS = {
    inicio: {
        botMessages: ['¡Bienvenido a WhakaChile! 🌿 Somos proveedores de açaí orgánico y productos funcionales para cafeterías, restaurantes y tiendas saludables.\n\nPara ayudarte rápidamente, ¿qué necesitas?'],
        options: [
            { label: 'ℹ️ Información comercial del producto', next: 'info_comercial' },
            { label: '📋 Ver catálogo y crear cuenta', next: 'catalogo' },
            { label: '👤 Contactar ejecutivo comercial', next: 'escalar' },
        ],
    },
    info_comercial: {
        botMessages: ['¡Con gusto! ¿Qué información necesitas sobre nuestros productos?'],
        options: [
            { label: '💰 Precios mayoristas y escalas', next: 'info_precios' },
            { label: '🚛 Costo de despacho según zona', next: 'info_despacho' },
            { label: '🍦 ¿Requiere máquina soft?', next: 'info_maquina' },
            { label: '✅ ¿Viene listo para servir?', next: 'info_listo' },
            { label: '🥤 Información nutricional', next: 'info_nutricional' },
            { label: '📦 Formatos disponibles', next: 'info_formatos' },
            { label: '💡 Sugerencias de uso', next: 'info_uso' },
        ],
    },
    info_precios: {
        botMessages: ['📊 *Precios Mayoristas WhakaChile*\n\n• Pulpa Açaí 500ml: $3.200/u\n• Pulpa Açaí 1.5L: $8.900/u\n• Açaí 5L Food Service: $26.500/u\n• Açaí Zero 1L: $7.400/u\n• Paletas Mix caja x12: $18.000\n• Paletas Coco caja x12: $19.500\n\n📉 *Escalas por volumen:*\n10-24 unidades: 5% desc.\n25-49 unidades: 10% desc.\n50+ unidades: 15% desc.\n\n¿Necesitas más información?'],
        options: [
            { label: '📋 Ver catálogo y crear cuenta', next: 'catalogo' },
            { label: '🔙 Volver al menú', next: 'inicio' },
        ],
    },
    info_despacho: {
        botMessages: ['🚛 *Despacho WhakaChile*\n\n✅ Zonas activas: Providencia, Ñuñoa, Las Condes, Vitacura, La Reina, La Florida, San Miguel\n\n• Despacho sin costo en pedidos sobre $50.000\n• Pedidos menores: $5.000 de despacho\n• Horario: Lunes a Viernes 9:00 - 18:00\n• Sábado: 10:00 - 14:00\n\n¿Algo más?'],
        options: [
            { label: '📋 Ver catálogo y crear cuenta', next: 'catalogo' },
            { label: '🔙 Volver al menú', next: 'inicio' },
        ],
    },
    info_maquina: {
        botMessages: ['🍦 *¿Requiere máquina soft?*\n\n• Formato 5L Food Service: ✅ Sí, requiere máquina soft-serve\n• Todos los demás formatos: ❌ No requieren máquina\n\nLos formatos 500ml y 1.5L se preparan con licuadora convencional.'],
        options: [
            { label: '📋 Ver catálogo y crear cuenta', next: 'catalogo' },
            { label: '🔙 Volver al menú', next: 'inicio' },
        ],
    },
    info_listo: {
        botMessages: ['✅ *¿Viene listo para servir?*\n\n• Paletas Açaí Mix y Coco: ✅ Listas para vitrina, no requieren preparación\n• Pulpa y base: ❌ Requieren preparación (licuar con frutas)\n\nLas paletas vienen en packaging individual listo para exhibición.'],
        options: [
            { label: '📋 Ver catálogo y crear cuenta', next: 'catalogo' },
            { label: '🔙 Volver al menú', next: 'inicio' },
        ],
    },
    info_nutricional: {
        botMessages: ['🥤 *Información Nutricional (por 100ml de pulpa)*\n\n• Calorías: 70 kcal\n• Grasas: 5g\n• Carbohidratos: 4g\n• Fibra: 3g\n• Azúcar añadida: 0g\n\n*Açaí Zero:* 45 kcal, 0g azúcar, endulzado con stevia natural.\n\nIngredientes: 100% pulpa de açaí brasileño orgánico certificado.'],
        options: [
            { label: '📋 Ver catálogo y crear cuenta', next: 'catalogo' },
            { label: '🔙 Volver al menú', next: 'inicio' },
        ],
    },
    info_formatos: {
        botMessages: ['📦 *Formatos Disponibles*\n\n🟣 Pulpa de Açaí Orgánico:\n  • 500ml (individual)\n  • 1.5L (familiar/cafetería)\n  • 5L (Food Service profesional)\n  • Pack x10 de 500ml (mayorista)\n\n🔵 Açaí Zero Sin Azúcar:\n  • 1L\n\n🟡 Paletas para Vitrina:\n  • Açaí Mix (caja x12)\n  • Açaí Coco (caja x12)\n\n🟢 Complementarios:\n  • Base Smoothie Bowl 1kg'],
        options: [
            { label: '📋 Ver catálogo y crear cuenta', next: 'catalogo' },
            { label: '🔙 Volver al menú', next: 'inicio' },
        ],
    },
    info_uso: {
        botMessages: ['💡 *Sugerencias de Uso*\n\n🥣 *Smoothie Bowl:* Licuar pulpa congelada con plátano + base smoothie. Servir con granola, frutas frescas y miel.\n\n🥤 *Smoothie:* Licuar con leche vegetal y frutas. Ideal para formato grab & go.\n\n🍦 *Soft Serve:* Usar formato 5L en máquina profesional. Textura cremosa directa.\n\n🍫 *Paletas:* Exhibir en freezer vitrina a -18°C. Venta directa sin preparación.\n\nTodos nuestros productos son veganos y sin gluten.'],
        options: [
            { label: '📋 Ver catálogo y crear cuenta', next: 'catalogo' },
            { label: '🔙 Volver al menú', next: 'inicio' },
        ],
    },
    catalogo: {
        botMessages: ['¡Aquí encontrarás nuestro portafolio principal! 🌿\n\n¿Qué categoría te interesa conocer?'],
        options: [
            { label: '🟣 Pulpa de Açaí Orgánico', next: 'cat_pulpa' },
            { label: '🔵 Açaí Zero Sin Azúcar', next: 'cat_zero' },
            { label: '🟡 Paletas para Vitrina', next: 'cat_paletas' },
            { label: '📋 Ver todos los productos', next: 'cat_todos' },
        ],
    },
    cat_pulpa: {
        botMessages: ['🟣 *Pulpa de Açaí Orgánico*'],
        showProducts: ['PRD-001', 'PRD-002', 'PRD-003', 'PRD-007'],
        options: [
            { label: '✨ Crear cuenta para comprar', next: 'clasificacion' },
            { label: '🔙 Volver a categorías', next: 'catalogo' },
        ],
    },
    cat_zero: {
        botMessages: ['🔵 *Açaí Zero Sin Azúcar*'],
        showProducts: ['PRD-004'],
        options: [
            { label: '✨ Crear cuenta para comprar', next: 'clasificacion' },
            { label: '🔙 Volver a categorías', next: 'catalogo' },
        ],
    },
    cat_paletas: {
        botMessages: ['🟡 *Paletas Listas para Vitrina*'],
        showProducts: ['PRD-005', 'PRD-008'],
        options: [
            { label: '✨ Crear cuenta para comprar', next: 'clasificacion' },
            { label: '🔙 Volver a categorías', next: 'catalogo' },
        ],
    },
    cat_todos: {
        botMessages: ['📋 *Catálogo Completo WhakaChile*'],
        showProducts: PRODUCTOS.map(p => p.id),
        options: [
            { label: '✨ Crear cuenta para comprar', next: 'clasificacion' },
            { label: '🔙 Volver al menú', next: 'inicio' },
        ],
    },
    clasificacion: {
        botMessages: ['¡Perfecto! Para crear tu cuenta necesito conocer tu negocio. 🏪\n\n¿Qué tipo de local tienes?'],
        options: [
            { label: '☕ Cafetería', next: 'confirm_tipo', data: 'Cafetería' },
            { label: '🍽️ Restaurante', next: 'confirm_tipo', data: 'Restaurante' },
            { label: '🌙 Dark Kitchen', next: 'confirm_tipo', data: 'Dark Kitchen' },
            { label: '🏪 Tienda Saludable', next: 'confirm_tipo', data: 'Tienda Saludable' },
            { label: '📦 Distribuidor', next: 'confirm_tipo', data: 'Distribuidor' },
            { label: '🚀 Emprendimiento Nuevo', next: 'confirm_tipo', data: 'Emprendimiento' },
            { label: '🔨 Instalando mi Local', next: 'confirm_tipo', data: 'Instalación' },
            { label: '📝 Otro', next: 'confirm_tipo', data: 'Otro' },
        ],
    },
    confirm_tipo: {
        botMessages: ['¡Excelente! Registrando como: {tipoNegocio} ✅\n\nAhora necesito tus datos comerciales.'],
        next: 'reg_razon',
    },
    reg_razon: {
        botMessages: ['📝 ¿Cuál es tu razón social o nombre legal?'],
        input: true,
        next: 'reg_rut',
        field: 'razonSocial',
        mockResponse: 'Café Origen SpA',
    },
    reg_rut: {
        botMessages: ['Registrado: {razonSocial} ✅\n\n📋 ¿Cuál es tu RUT de empresa o persona natural?\n(formato xx.xxx.xxx-x)'],
        input: true,
        next: 'reg_nombre',
        field: 'rut',
        mockResponse: '76.200.300-1',
    },
    reg_nombre: {
        botMessages: ['RUT registrado ✅\n\n👤 ¿Cuál es tu nombre completo como responsable de la cuenta?'],
        input: true,
        next: 'reg_telefono',
        field: 'nombreContacto',
        mockResponse: 'Rodrigo Fuentes',
    },
    reg_telefono: {
        botMessages: ['Perfecto, {nombreContacto} 👋\n\n📱 ¿Cuál es tu número de teléfono de contacto?\n(Sugerencia: +56 9 1111 2222)'],
        input: true,
        next: 'reg_email',
        field: 'telefono',
        mockResponse: '+56 9 1111 2222',
    },
    reg_email: {
        botMessages: ['Teléfono registrado ✅\n\n📧 ¿Cuál es tu correo electrónico?'],
        input: true,
        next: 'reg_confirm',
        field: 'email',
        mockResponse: 'rfuentes@cafeorigen.cl',
    },
    reg_confirm: {
        botMessages: ['📋 *Resumen de tus datos:*\n\n• Tipo: {tipoNegocio}\n• Razón Social: {razonSocial}\n• RUT: {rut}\n• Contacto: {nombreContacto}\n• Teléfono: {telefono}\n• Email: {email}\n\n¿Todo correcto?'],
        options: [
            { label: '✅ Confirmar datos', next: 'reg_direccion' },
            { label: '✏️ Corregir algo', next: 'clasificacion' },
        ],
    },
    reg_direccion: {
        botMessages: ['¡Casi listo! 🚛\n\nNecesito tu dirección de despacho para validar cobertura.\n\n📍 ¿Cuál es la dirección exacta de tu local?\n(calle, número, depto si aplica)'],
        input: true,
        next: 'reg_comuna',
        field: 'direccion',
        mockResponse: 'Av. Bicentenario 3800',
    },
    reg_comuna: {
        botMessages: ['📍 ¿En qué comuna está ubicado?'],
        input: true,
        next: 'reg_region',
        field: 'comuna',
        mockResponse: 'Vitacura',
    },
    reg_region: {
        botMessages: ['📍 ¿En qué región?'],
        options: [
            { label: 'Región Metropolitana', next: 'cobertura_ok', data: 'Región Metropolitana' },
            { label: 'Valparaíso', next: 'cobertura_fuera', data: 'Valparaíso' },
            { label: 'O\'Higgins', next: 'cobertura_fuera', data: 'O\'Higgins' },
            { label: 'Otra región', next: 'cobertura_fuera', data: 'Otra' },
        ],
    },
    cobertura_ok: {
        botMessages: ['✅ ¡Esta dirección está dentro de nuestra zona de cobertura activa!\n\nTu solicitud fue enviada con éxito. Nuestro equipo comercial revisará tu información y te notificaremos en un máximo de 24 horas hábiles. ⏳'],
        next: 'aprobacion_demo',
    },
    cobertura_fuera: {
        botMessages: ['⚠️ Esa dirección no está en nuestra cobertura actual.\n\nUn ejecutivo te contactará para evaluar tu caso personalmente.'],
        options: [
            { label: '👤 Contactar ejecutivo', next: 'escalar' },
            { label: '🔙 Volver al menú', next: 'inicio' },
        ],
    },
    aprobacion_demo: {
        botMessages: ['🎉 *¡Tu cuenta comercial WhakaChile está ACTIVA!*\n\nYa puedes realizar tu primer pedido. ¿Quieres hacerlo ahora?'],
        options: [
            { label: '🛒 Sí, hacer pedido', next: 'etapa1_catalogo' },
            { label: '📋 Ver catálogo primero', next: 'catalogo' },
        ],
        isSpecial: 'aprobacion',
    },
    escalar: {
        botMessages: ['Entendido! 🤝\n\nEstoy conectándote con un ejecutivo comercial. En un momento alguien te atenderá personalmente.\n\nMientras, puedes dejarnos tu consulta.'],
        isSpecial: 'escalamiento',
        input: true,
        next: 'escalar_confirm',
    },
    escalar_confirm: {
        botMessages: ['Consulta registrada ✅\n\nNuestro equipo te responderá a la brevedad. ¡Gracias por tu interés en WhakaChile! 🌿'],
        options: [
            { label: '🔙 Volver al menú', next: 'inicio' },
        ],
    },
};

const ETAPA1_STEPS = {
    inicio: {
        botMessages: ['¡Hola Carlos! 👋\n\nBienvenido de vuelta, *Green Bowl Providencia*.\n\n¿Qué necesitas hoy?'],
        options: [
            { label: '🛒 Hacer un pedido', next: 'validaciones' },
            { label: '📦 Estado de mis pedidos', next: 'estado_pedidos' },
            { label: 'ℹ️ Información de productos', next: 'info_productos' },
            { label: '👤 Contactar ejecutivo', next: 'escalar' },
        ],
    },
    validaciones: {
        botMessages: ['Verificando tu cuenta... ⏳'],
        autoNext: 'validaciones_ok',
        delay: 2000,
    },
    validaciones_ok: {
        botMessages: ['✅ *Validaciones completadas:*\n\n• Estado comercial: Activo ✅\n• Deuda vencida: $0 ✅\n• Zona logística: Providencia — activa ✅\n• Horario operativo: Dentro del horario ✅\n• Condición de pago: Crédito 30 días ✅\n• Mínimo de pedido: $15.000 CLP\n\n¡Todo en orden! Aquí está nuestro catálogo disponible para hoy. 🛒\n\n¿Qué categoría te interesa?'],
        options: [
            { label: '🟣 Pulpa de Açaí — 3 formatos', next: 'e1_cat_pulpa' },
            { label: '🔵 Açaí Zero Sin Azúcar', next: 'e1_cat_zero' },
            { label: '🟠 Formato Food Service — 5L', next: 'e1_cat_food' },
            { label: '🟡 Paletas para Vitrina', next: 'e1_cat_paletas' },
        ],
    },
    e1_cat_pulpa: {
        botMessages: ['🟣 *Pulpa de Açaí Orgánico* — Disponible hoy:'],
        showProducts: ['PRD-001', 'PRD-002', 'PRD-007'],
        transactional: true,
        options: [
            { label: '👀 Ver otra categoría', next: 'validaciones_ok' },
            { label: '📋 Ver resumen y confirmar', next: 'resumen' },
        ],
    },
    e1_cat_zero: {
        botMessages: ['🔵 *Açaí Zero Sin Azúcar* — Disponible hoy:'],
        showProducts: ['PRD-004'],
        transactional: true,
        options: [
            { label: '👀 Ver otra categoría', next: 'validaciones_ok' },
            { label: '📋 Ver resumen y confirmar', next: 'resumen' },
        ],
    },
    e1_cat_food: {
        botMessages: ['🟠 *Food Service* — Solo formato profesional:'],
        showProducts: ['PRD-003'],
        transactional: true,
        options: [
            { label: '👀 Ver otra categoría', next: 'validaciones_ok' },
            { label: '📋 Ver resumen y confirmar', next: 'resumen' },
        ],
    },
    e1_cat_paletas: {
        botMessages: ['🟡 *Paletas Listas para Vitrina:*'],
        showProducts: ['PRD-005', 'PRD-008'],
        transactional: true,
        options: [
            { label: '👀 Ver otra categoría', next: 'validaciones_ok' },
            { label: '📋 Ver resumen y confirmar', next: 'resumen' },
        ],
    },
    resumen: {
        botMessages: ['RESUMEN_PEDIDO'],
        isSpecial: 'resumen',
        options: [
            { label: '✅ Confirmar pedido', next: 'confirmacion' },
            { label: '✏️ Modificar', next: 'validaciones_ok' },
            { label: '❌ Cancelar pedido', next: 'cancelar' },
        ],
    },
    confirmacion: {
        botMessages: ['🎉 *¡Pedido confirmado!*\n\nTu orden *#WHK-000945* está siendo procesada.\n\nTe notificaremos cuando esté en camino.\n\n¡Gracias, Carlos! 🌿'],
        isSpecial: 'confirmacion',
        options: [
            { label: '🔙 Volver al menú', next: 'inicio' },
        ],
    },
    cancelar: {
        botMessages: ['Pedido cancelado. Si necesitas algo más, estoy aquí para ayudarte. 😊'],
        options: [
            { label: '🔙 Volver al menú', next: 'inicio' },
        ],
    },
    estado_pedidos: {
        botMessages: ['📦 *Tus pedidos recientes:*\n\n• #WHK-000945 — $274.890 — ✅ Entregado\n• #WHK-000949 — $94.200 — 🔵 Recibido\n\n¿Necesitas más detalle de alguno?'],
        options: [
            { label: '🔙 Volver al menú', next: 'inicio' },
        ],
    },
    info_productos: {
        botMessages: ['¿Qué información necesitas? 📋'],
        options: [
            { label: '💰 Precios mayoristas', next: 'info_precios' },
            { label: '🚛 Costo de despacho', next: 'info_despacho' },
            { label: '📦 Formatos disponibles', next: 'info_formatos' },
            { label: '🔙 Volver al menú', next: 'inicio' },
        ],
    },
    info_precios: {
        botMessages: ['📊 *Precios especiales Green Bowl (Lista Cafetería):*\n\n• Pulpa 500ml: $3.200/u\n• Pulpa 1.5L: $8.900/u\n• Açaí 5L Food Service: $26.500/u\n• Paletas Mix x12: $18.000\n• Paletas Coco x12: $19.500\n\nDescuento por volumen vigente según tu acuerdo comercial.'],
        options: [
            { label: '🛒 Hacer un pedido', next: 'validaciones' },
            { label: '🔙 Volver al menú', next: 'inicio' },
        ],
    },
    info_despacho: {
        botMessages: ['🚛 *Despacho para Green Bowl (Providencia):*\n\n• Zona: Activa ✅\n• Despacho sin costo (pedidos sobre $50.000)\n• Horario: Lun-Vie 9-18h\n• Tiempo estimado: Día hábil siguiente'],
        options: [
            { label: '🛒 Hacer un pedido', next: 'validaciones' },
            { label: '🔙 Volver al menú', next: 'inicio' },
        ],
    },
    info_formatos: {
        botMessages: ['📦 *Formatos Disponibles Hoy:*\n\n• 500ml individual — Stock: 120u\n• 1.5L familiar — Stock: 85u\n• 5L Food Service — Stock: 42u\n• Açaí Zero 1L — Stock: 67u\n• Paletas Mix x12 — Stock: 34 cajas\n• Paletas Coco x12 — Stock: 22 cajas'],
        options: [
            { label: '🛒 Hacer un pedido', next: 'validaciones' },
            { label: '🔙 Volver al menú', next: 'inicio' },
        ],
    },
    escalar: {
        botMessages: ['Entendido! 🤝 Conectándote con un ejecutivo comercial...\n\nMientras, puedes dejarnos tu consulta.'],
        isSpecial: 'escalamiento',
        input: true,
        next: 'escalar_confirm',
    },
    escalar_confirm: {
        botMessages: ['Consulta registrada ✅ Te responderemos a la brevedad. ¡Gracias Carlos! 🌿'],
        options: [
            { label: '🔙 Volver al menú', next: 'inicio' },
        ],
    },
};


/* ================================================================
   MAIN COMPONENT
   ================================================================ */

export default function WhatsAppApp() {
    const [modoApp, setModoApp] = useState('menu'); // 'menu' | 'chat' | 'bot' | 'billing'
    const [session, setSession] = useState('lead'); // 'lead' | 'cliente'
    const [wmsExpanded, setWmsExpanded] = useState(false); // Menú desplegable WMS
    const [messages, setMessages] = useState([]);
    const [currentStep, setCurrentStep] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [userData, setUserData] = useState({});
    const [cart, setCart] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isEscalado, setIsEscalado] = useState(false);
    const [flowStarted, setFlowStarted] = useState(false);
    const chatEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = useCallback(() => {
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, []);

    const getSteps = useCallback(() => session === 'lead' ? ETAPA0_STEPS : ETAPA1_STEPS, [session]);

    const replaceVars = useCallback((text) => {
        return text.replace(/\{(\w+)\}/g, (_, key) => userData[key] || `[${key}]`);
    }, [userData]);

    const addBotMessages = useCallback(async (step, steps) => {
        setIsTyping(true);
        scrollToBottom();

        for (const msg of step.botMessages) {
            await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));
            const processedMsg = replaceVars(msg);

            if (msg === 'RESUMEN_PEDIDO') {
                setMessages(prev => [...prev, { type: 'order-summary', cart: [...cart], time: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) }]);
            } else {
                setMessages(prev => [...prev, { type: 'bot', text: processedMsg, time: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) }]);
            }
            scrollToBottom();
        }

        if (step.showProducts) {
            await new Promise(r => setTimeout(r, 500));
            const prods = step.showProducts.map(id => PRODUCTOS.find(p => p.id === id)).filter(Boolean);
            setMessages(prev => [...prev, { type: 'products', products: prods, transactional: step.transactional, time: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) }]);
            scrollToBottom();
        }

        if (step.isSpecial === 'escalamiento') {
            setIsEscalado(true);
        }

        if (step.isSpecial === 'aprobacion') {
            setMessages(prev => [...prev, { type: 'system', text: '🎉 Cuenta activada ' + new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) }]);
        }

        if (step.isSpecial === 'confirmacion') {
            setMessages(prev => [...prev, { type: 'order-confirmed', time: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) }]);
            scrollToBottom();
        }

        setIsTyping(false);
        scrollToBottom();

        if (step.autoNext) {
            await new Promise(r => setTimeout(r, step.delay || 1500));
            const nextStep = steps[step.autoNext];
            if (nextStep) {
                setCurrentStep(step.autoNext);
                addBotMessages(nextStep, steps);
            }
        }
    }, [replaceVars, scrollToBottom, cart]);

    const handleOptionClick = useCallback((option) => {
        setMessages(prev => [...prev, { type: 'user', text: option.label.replace(/^[^\s]+\s/, ''), time: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) }]);

        if (option.data) {
            setUserData(prev => ({ ...prev, tipoNegocio: option.data }));
        }

        const steps = getSteps();
        const nextStep = steps[option.next];
        if (nextStep) {
            setCurrentStep(option.next);
            addBotMessages(nextStep, steps);
        }
    }, [getSteps, addBotMessages]);

    const handleSend = useCallback(() => {
        const text = inputText.trim();
        if (!text) return;

        setMessages(prev => [...prev, { type: 'user', text, time: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) }]);
        setInputText('');

        if (!flowStarted) {
            setFlowStarted(true);
            const steps = getSteps();
            const firstStep = steps['inicio'];
            setCurrentStep('inicio');
            addBotMessages(firstStep, steps);
            return;
        }

        const steps = getSteps();
        const step = steps[currentStep];
        if (step?.input && step?.next) {
            if (step.field) {
                setUserData(prev => ({ ...prev, [step.field]: text }));
            }
            const nextStep = steps[step.next];
            if (nextStep) {
                setCurrentStep(step.next);
                addBotMessages(nextStep, steps);
            }
        }
    }, [inputText, flowStarted, currentStep, getSteps, addBotMessages]);

    const handleAddToCart = useCallback((product, qty = 1) => {
        setCart(prev => {
            const existing = prev.find(i => i.productoId === product.id);
            if (existing) {
                return prev.map(i => i.productoId === product.id ? { ...i, cantidad: i.cantidad + qty, subtotal: (i.cantidad + qty) * i.precioUnit } : i);
            }
            return [...prev, { productoId: product.id, nombre: product.nombre, formato: product.formato, cantidad: qty, precioUnit: product.precioUnitario, subtotal: qty * product.precioUnitario }];
        });
        setMessages(prev => [...prev, { type: 'bot', text: `✅ Agregado: *${product.nombre}* x${qty} — ${formatCLP(qty * product.precioUnitario)}\n\n¿Agregas algo más o confirmamos?`, time: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) }]);
        scrollToBottom();
    }, [scrollToBottom]);

    const resetFlow = useCallback(() => {
        setMessages([]);
        setCurrentStep(null);
        setUserData({});
        setCart([]);
        setIsEscalado(false);
        setFlowStarted(false);
        setIsTyping(false);
        setInputText('');
    }, []);

    useEffect(() => {
        resetFlow();
    }, [session, resetFlow]);

    const steps = getSteps();
    const step = currentStep ? steps[currentStep] : null;

    // Mostrar menu de selección
    if (modoApp === 'menu') {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#111827] p-4">
                <div style={{ width: '100%', maxWidth: '550px' }}>
                    <div className="text-center mb-10">
                        <div style={{ width: '80px', height: '80px', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: 'rgba(45, 125, 70, 0.2)' }}>
                            <Leaf style={{ width: '40px', height: '40px', color: '#2D7D46' }} />
                        </div>
                        <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>WhakaChile</h1>
                        <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '16px' }}>CRM + WMS Integrado</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                        {/* Sección CRM */}
                        <div>
                            <p style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                                📱 CRM — Gestión de Clientes
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <button
                                    onClick={() => setModoApp('chat')}
                                    style={{
                                        width: '100%',
                                        padding: '16px',
                                        background: 'linear-gradient(to right, #2D7D46, #1A6B5A)',
                                        borderRadius: '8px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => e.target.style.transform = 'scale(1.02)'}
                                    onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                                        <div style={{ flex: 1 }}>
                                            <h2 style={{ color: 'white', fontWeight: 'bold', fontSize: '16px', margin: '0 0 4px 0' }}>💬 Chat Tradicional</h2>
                                            <p style={{ color: '#A7F3D0', fontSize: '12px', margin: 0 }}>Flujo de onboarding y compra digital</p>
                                        </div>
                                        <ChevronRight style={{ color: 'rgba(255, 255, 255, 0.6)', flexShrink: 0, marginTop: '2px', width: '18px', height: '18px' }} />
                                    </div>
                                </button>

                                <button
                                    onClick={() => setModoApp('bot')}
                                    style={{
                                        width: '100%',
                                        padding: '16px',
                                        background: 'linear-gradient(to right, #2563eb, #1d4ed8)',
                                        borderRadius: '8px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => e.target.style.transform = 'scale(1.02)'}
                                    onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                                        <div style={{ flex: 1 }}>
                                            <h2 style={{ color: 'white', fontWeight: 'bold', fontSize: '16px', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Zap style={{ width: '18px', height: '18px', flexShrink: 0 }} />
                                                Bot de Pedidos
                                            </h2>
                                            <p style={{ color: '#bfdbfe', fontSize: '12px', margin: 0 }}>Pedidos estructurados sin errores</p>
                                        </div>
                                        <ChevronRight style={{ color: 'rgba(255, 255, 255, 0.6)', flexShrink: 0, marginTop: '2px', width: '18px', height: '18px' }} />
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Sección WMS (Desplegable) */}
                        <div>
                            <p style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                                🏭 WMS — Gestión de Pedidos
                            </p>
                            <button
                                onClick={() => setWmsExpanded(!wmsExpanded)}
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    background: wmsExpanded ? 'linear-gradient(to right, #d97706, #92400e)' : 'linear-gradient(to right, #d97706, #b45309)',
                                    borderRadius: wmsExpanded ? '8px 8px 0 0' : '8px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => !wmsExpanded && (e.target.style.transform = 'scale(1.02)')}
                                onMouseLeave={e => !wmsExpanded && (e.target.style.transform = 'scale(1)')}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                                    <h2 style={{ color: 'white', fontWeight: 'bold', fontSize: '16px', margin: 0, flex: 1 }}>
                                        ⚙️ Administración de Pedidos
                                    </h2>
                                    <ChevronDown
                                        style={{
                                            color: 'rgba(255, 255, 255, 0.8)',
                                            flexShrink: 0,
                                            width: '20px',
                                            height: '20px',
                                            transform: wmsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                            transition: 'transform 0.3s'
                                        }}
                                    />
                                </div>
                            </button>

                            {wmsExpanded && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                    <button
                                        onClick={() => setModoApp('billing')}
                                        style={{
                                            width: '100%',
                                            padding: '14px 16px',
                                            background: 'rgba(217, 119, 6, 0.5)',
                                            borderBottom: '1px solid rgba(217, 119, 6, 0.3)',
                                            border: 'none',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => e.target.style.background = 'rgba(217, 119, 6, 0.7)'}
                                        onMouseLeave={e => e.target.style.background = 'rgba(217, 119, 6, 0.5)'}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <FileText style={{ color: '#fbbf24', width: '18px', height: '18px', flexShrink: 0 }} />
                                            <div style={{ flex: 1 }}>
                                                <p style={{ color: '#fcd34d', fontWeight: '600', fontSize: '14px', margin: '0 0 2px 0' }}>Pendiente por Facturar</p>
                                                <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', margin: 0 }}>Cola de facturación (sin BSale)</p>
                                            </div>
                                            <ChevronRight style={{ color: 'rgba(255, 255, 255, 0.5)', flexShrink: 0, width: '16px', height: '16px' }} />
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => alert('Dashboard de Pedidos (Próximamente)')}
                                        style={{
                                            width: '100%',
                                            padding: '14px 16px',
                                            background: 'rgba(217, 119, 6, 0.5)',
                                            borderBottom: '1px solid rgba(217, 119, 6, 0.3)',
                                            border: 'none',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            transition: 'all 0.2s',
                                            opacity: '0.6'
                                        }}
                                        onMouseEnter={e => e.target.style.background = 'rgba(217, 119, 6, 0.7)'}
                                        onMouseLeave={e => e.target.style.background = 'rgba(217, 119, 6, 0.5)'}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <BarChart3 style={{ color: '#fbbf24', width: '18px', height: '18px', flexShrink: 0 }} />
                                            <div style={{ flex: 1 }}>
                                                <p style={{ color: '#fcd34d', fontWeight: '600', fontSize: '14px', margin: '0 0 2px 0' }}>Dashboard de Pedidos</p>
                                                <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', margin: 0 }}>Estadísticas y reportes</p>
                                            </div>
                                            <ChevronRight style={{ color: 'rgba(255, 255, 255, 0.5)', flexShrink: 0, width: '16px', height: '16px' }} />
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setWmsExpanded(false)}
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            background: 'rgba(217, 119, 6, 0.3)',
                                            borderRadius: '0 0 8px 8px',
                                            border: 'none',
                                            cursor: 'pointer',
                                            textAlign: 'center',
                                            color: 'rgba(255, 255, 255, 0.7)',
                                            fontSize: '12px',
                                            fontWeight: '500',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => e.target.style.background = 'rgba(217, 119, 6, 0.5)'}
                                        onMouseLeave={e => e.target.style.background = 'rgba(217, 119, 6, 0.3)'}
                                    >
                                        Contraer menú
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <Link to="/" style={{ width: '100%', padding: '12px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s', display: 'block' }}
                        onMouseEnter={e => e.style.color = 'white'}
                        onMouseLeave={e => e.style.color = 'rgba(255, 255, 255, 0.6)'}
                    >
                        ← Volver al inicio
                    </Link>

                    <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <p style={{ color: 'rgba(255, 255, 255, 0.25)', fontSize: '12px', textAlign: 'center', margin: '0 0 8px 0' }}>
                            Sistema integrado de CRM + WMS
                        </p>
                        <p style={{ color: 'rgba(255, 255, 255, 0.15)', fontSize: '10px', textAlign: 'center', margin: 0 }}>
                            Bot de Pedidos | Chat Comercial | Cola de Facturación
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Mostrar Panel de Facturación
    if (modoApp === 'billing') {
        return (
            <div className="h-screen flex flex-col">
                <div className="h-12 bg-gradient-to-r from-amber-600 to-amber-700 flex items-center px-4">
                    <button
                        onClick={() => setModoApp('menu')}
                        className="text-white hover:text-amber-100 transition-colors flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm">Volver al menú</span>
                    </button>
                </div>
                <BillingQueuePanel />
            </div>
        );
    }

    // Mostrar Bot de Pedidos
    if (modoApp === 'bot') {
        return (
            <div className="h-screen flex flex-col">
                <div className="h-12 bg-gradient-to-r from-blue-600 to-blue-700 flex items-center px-4">
                    <button
                        onClick={() => setModoApp('menu')}
                        className="text-white hover:text-blue-100 transition-colors flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm">Volver al menú</span>
                    </button>
                </div>
                <BotPedidosWhatsApp />
            </div>
        );
    }

    // Mostrar Chat Tradicional
    return (
        <div className="h-screen flex bg-[#111827] overflow-hidden">
            {/* Sidebar */}
            <div className="w-[280px] bg-[#111827] border-r border-white/10 flex flex-col shrink-0 max-md:hidden">
                <div className="p-5 border-b border-white/10">
                    <Link to="/" className="flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity">
                        <ArrowLeft className="w-4 h-4 text-white/60" />
                        <span className="text-xs text-white/60">Volver al inicio</span>
                    </Link>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-[#2D7D46]/30 flex items-center justify-center">
                            <Leaf className="w-5 h-5 text-[#A7F3D0]" />
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-sm">WhakaChile</h2>
                            <p className="text-white/50 text-xs">Simulador WhatsApp</p>
                        </div>
                    </div>
                </div>

                <div className="p-5">
                    <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-3">Sesión de Demo</p>
                    <button
                        onClick={() => setSession('lead')}
                        className={`w-full text-left p-3 rounded-lg mb-2 transition-all cursor-pointer ${session === 'lead' ? 'bg-[#2D7D46]/20 border border-[#2D7D46]/40' : 'hover:bg-white/5 border border-transparent'}`}
                    >
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-[#A7F3D0]" />
                            <span className="text-white text-sm font-medium">Lead Nuevo</span>
                        </div>
                        <p className="text-white/40 text-xs mt-1 ml-6">Etapa 0 — Onboarding</p>
                    </button>
                    <button
                        onClick={() => setSession('cliente')}
                        className={`w-full text-left p-3 rounded-lg transition-all cursor-pointer ${session === 'cliente' ? 'bg-[#2D7D46]/20 border border-[#2D7D46]/40' : 'hover:bg-white/5 border border-transparent'}`}
                    >
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-[#25D366]" />
                            <span className="text-white text-sm font-medium">Cliente Registrado</span>
                        </div>
                        <p className="text-white/40 text-xs mt-1 ml-6">Etapa 1 — Compra Digital</p>
                    </button>
                </div>

                {session === 'cliente' && (
                    <div className="p-5 border-t border-white/10 mt-auto">
                        <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-2">Contacto Activo</p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#2D7D46] flex items-center justify-center text-white font-bold text-sm">CM</div>
                            <div>
                                <p className="text-white text-sm font-medium">Carlos Méndez</p>
                                <p className="text-white/50 text-xs">Green Bowl Providencia</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Chat Panel */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <div className="h-16 bg-[#2D7D46] flex items-center px-4 gap-3 shrink-0">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <Leaf className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold text-sm">WhakaChile - Ventas</h3>
                        <p className="text-[#A7F3D0] text-xs">
                            {isEscalado ? '👤 Transferido a Ejecutivo — Respondiendo en breve' : 'Bot Comercial · En línea'}
                        </p>
                    </div>
                    <Phone className="w-5 h-5 text-white/60" />
                    <MoreVertical className="w-5 h-5 text-white/60 ml-2" />
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-1" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'400\' height=\'400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3Cpattern id=\'p\' width=\'80\' height=\'80\' patternUnits=\'userSpaceOnUse\'%3E%3Ccircle cx=\'40\' cy=\'40\' r=\'1.5\' fill=\'%23d4cfc4\' opacity=\'0.3\'/%3E%3C/pattern%3E%3C/defs%3E%3Crect fill=\'%23ECE5DD\' width=\'400\' height=\'400\'/%3E%3Crect fill=\'url(%23p)\' width=\'400\' height=\'400\'/%3E%3C/svg%3E")', backgroundColor: '#ECE5DD' }}>
                    {/* Date separator */}
                    <div className="flex justify-center mb-4">
                        <span className="bg-black/8 text-gray-600 text-xs px-4 py-1 rounded-2xl font-medium">Hoy</span>
                    </div>

                    {!flowStarted && (
                        <div className="flex justify-center my-8">
                            <div className="text-center">
                                <div className="w-20 h-20 rounded-full bg-[#2D7D46]/10 flex items-center justify-center mx-auto mb-4">
                                    <Leaf className="w-10 h-10 text-[#2D7D46]" />
                                </div>
                                <p className="text-gray-500 text-sm">Escribe un mensaje para comenzar la conversación</p>
                                <p className="text-gray-400 text-xs mt-1">{session === 'lead' ? 'Etapa 0 — Onboarding de Lead Nuevo' : 'Etapa 1 — Compra Digital (Cliente Habilitado)'}</p>
                            </div>
                        </div>
                    )}

                    {messages.map((msg, i) => (
                        <MessageBubble
                            key={i}
                            msg={msg}
                            onAddToCart={handleAddToCart}
                            cart={cart}
                        />
                    ))}

                    {/* Typing indicator */}
                    {isTyping && (
                        <div className="flex items-end gap-2 animate-fade-in">
                            <div className="w-8 h-8 rounded-full bg-[#2D7D46] flex items-center justify-center shrink-0">
                                <Leaf className="w-4 h-4 text-white" />
                            </div>
                            <div className="bg-white rounded-r-xl rounded-bl-xl px-4 py-3 shadow-sm">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 rounded-full bg-gray-400" style={{ animation: 'pulse-dots 1.4s infinite', animationDelay: '0s' }} />
                                    <span className="w-2 h-2 rounded-full bg-gray-400" style={{ animation: 'pulse-dots 1.4s infinite', animationDelay: '0.2s' }} />
                                    <span className="w-2 h-2 rounded-full bg-gray-400" style={{ animation: 'pulse-dots 1.4s infinite', animationDelay: '0.4s' }} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quick reply options */}
                    {!isTyping && step?.options && flowStarted && (
                        <div className="flex flex-wrap gap-2 mt-3 ml-10 animate-fade-in">
                            {step.options.map((opt, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleOptionClick(opt)}
                                    className="bg-white border border-[#2D7D46]/30 text-[#2D7D46] text-sm px-4 py-2 rounded-full hover:bg-[#E8F5EB] transition-colors shadow-sm font-medium cursor-pointer"
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}

                    <div ref={chatEndRef} />
                </div>

                {/* Input Bar */}
                <div className="h-14 bg-white border-t border-gray-200 flex items-center px-3 gap-2 shrink-0">
                    <Smile className="w-6 h-6 text-gray-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                    />
                    <button
                        onClick={handleSend}
                        className="w-10 h-10 rounded-full bg-[#2D7D46] flex items-center justify-center hover:bg-[#236335] transition-colors cursor-pointer"
                    >
                        <Send className="w-4 h-4 text-white" />
                    </button>
                </div>
            </div>
        </div>
    );
}


/* ================================================================
   MESSAGE BUBBLE COMPONENT
   ================================================================ */

function MessageBubble({ msg, onAddToCart, cart }) {
    if (msg.type === 'system') {
        return (
            <div className="flex justify-center my-2">
                <span className="bg-black/8 text-gray-600 text-xs px-4 py-1 rounded-2xl">{msg.text}</span>
            </div>
        );
    }

    if (msg.type === 'user') {
        return (
            <div className="flex justify-end mb-1 animate-fade-in">
                <div className="bg-[#DCF8C6] rounded-l-xl rounded-br-xl px-3 py-2 shadow-sm max-w-[65%]">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.text}</p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-[10px] text-gray-500">{msg.time}</span>
                        <CheckCheck className="w-4 h-4 text-[#53BDEB]" />
                    </div>
                </div>
            </div>
        );
    }

    if (msg.type === 'bot') {
        return (
            <div className="flex items-end gap-2 mb-1 animate-fade-in">
                <div className="w-8 h-8 rounded-full bg-[#2D7D46] flex items-center justify-center shrink-0">
                    <Leaf className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white rounded-r-xl rounded-bl-xl px-3 py-2 shadow-sm max-w-[75%]">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{renderBotText(msg.text)}</p>
                    <span className="text-[10px] text-gray-400 float-right mt-1">{msg.time}</span>
                </div>
            </div>
        );
    }

    if (msg.type === 'products') {
        return (
            <div className="flex items-end gap-2 mb-1 animate-fade-in">
                <div className="w-8 h-8 rounded-full bg-transparent shrink-0" />
                <div className="max-w-[80%] space-y-2">
                    {msg.products.map(product => (
                        <ProductCard key={product.id} product={product} transactional={msg.transactional} onAddToCart={onAddToCart} cart={cart} />
                    ))}
                </div>
            </div>
        );
    }

    if (msg.type === 'order-summary') {
        const subtotal = msg.cart.reduce((sum, item) => sum + item.subtotal, 0);
        const iva = Math.round(subtotal * 0.19);
        const total = subtotal + iva;

        return (
            <div className="flex items-end gap-2 mb-1 animate-fade-in">
                <div className="w-8 h-8 rounded-full bg-[#2D7D46] flex items-center justify-center shrink-0">
                    <Leaf className="w-4 h-4 text-white" />
                </div>
                <div className="bg-[#E8F5EB] border border-[#2D7D46]/20 rounded-xl px-4 py-3 shadow-sm max-w-[80%]">
                    <p className="font-bold text-[#2D7D46] text-sm mb-3">📋 RESUMEN DE TU PEDIDO — Green Bowl Providencia</p>
                    <div className="space-y-1.5 mb-3">
                        {msg.cart.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm">
                                <span className="text-gray-700">{item.nombre} x{item.cantidad}</span>
                                <span className="text-gray-800 font-medium">{formatCLP(item.subtotal)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-[#2D7D46]/20 pt-2 space-y-1">
                        <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>{formatCLP(subtotal)}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-gray-500">IVA (19%)</span><span>{formatCLP(iva)}</span></div>
                        <div className="flex justify-between text-sm font-bold text-[#2D7D46]"><span>TOTAL</span><span>{formatCLP(total)}</span></div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-[#2D7D46]/10 text-xs text-gray-500 space-y-0.5">
                        <p>📍 Av. Providencia 1020, Providencia, RM</p>
                        <p>📅 Mañana — Martes 24 de Febrero</p>
                        <p>💳 Crédito 30 días</p>
                    </div>
                    <span className="text-[10px] text-gray-400 float-right mt-1">{msg.time}</span>
                </div>
            </div>
        );
    }

    if (msg.type === 'order-confirmed') {
        return (
            <div className="flex justify-center my-4 animate-fade-in">
                <div className="bg-[#DCFCE7] border border-[#15803D]/20 rounded-xl px-6 py-4 text-center shadow-sm">
                    <div className="text-3xl mb-2">✅</div>
                    <p className="font-bold text-[#15803D] text-lg">#WHK-000945</p>
                    <div className="flex items-center gap-2 justify-center mt-3 text-xs">
                        <span className="px-2 py-0.5 rounded-full bg-[#2D7D46] text-white font-medium">Confirmado</span>
                        <ChevronRight className="w-3 h-3 text-gray-400" />
                        <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-500">En Preparación</span>
                        <ChevronRight className="w-3 h-3 text-gray-400" />
                        <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-500">En Camino</span>
                        <ChevronRight className="w-3 h-3 text-gray-400" />
                        <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-500">Entregado</span>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}

function renderBotText(text) {
    return text.split(/(\*[^*]+\*)/g).map((part, i) => {
        if (part.startsWith('*') && part.endsWith('*')) {
            return <strong key={i}>{part.slice(1, -1)}</strong>;
        }
        return part;
    });
}

function ProductCard({ product, transactional, onAddToCart, cart }) {
    const [qty, setQty] = useState(1);
    const inCart = cart.find(i => i.productoId === product.id);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-20 bg-gradient-to-br from-[#2D7D46]/10 to-[#1A6B5A]/10 flex items-center justify-center">
                <Leaf className="w-8 h-8 text-[#2D7D46]/40" />
            </div>
            <div className="p-3">
                <p className="font-semibold text-sm text-gray-800">{product.nombre}</p>
                <p className="text-xs text-gray-500">{product.formato}</p>
                <p className="text-[#2D7D46] font-bold text-sm mt-1">{formatCLP(product.precioUnitario)}</p>
                <p className="text-xs text-gray-400 mt-0.5">Stock: {product.stockDisponible}u</p>
                {transactional && (
                    <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center border border-gray-200 rounded-lg">
                            <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-2 py-1 text-gray-500 hover:bg-gray-50 cursor-pointer">-</button>
                            <span className="px-2 text-sm font-medium w-8 text-center">{qty}</span>
                            <button onClick={() => setQty(q => q + 1)} className="px-2 py-1 text-gray-500 hover:bg-gray-50 cursor-pointer">+</button>
                        </div>
                        <button
                            onClick={() => { onAddToCart(product, qty); setQty(1); }}
                            className="flex-1 bg-[#2D7D46] text-white text-xs font-medium py-1.5 rounded-lg hover:bg-[#236335] transition-colors cursor-pointer"
                        >
                            {inCart ? 'Agregar más' : 'Agregar al pedido'}
                        </button>
                    </div>
                )}
                {!transactional && (
                    <button className="w-full mt-2 bg-[#2D7D46] text-white text-xs font-medium py-1.5 rounded-lg cursor-pointer hover:bg-[#236335]">
                        Crear cuenta para comprar
                    </button>
                )}
            </div>
        </div>
    );
}
