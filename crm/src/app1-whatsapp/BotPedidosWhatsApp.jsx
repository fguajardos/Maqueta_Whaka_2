import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Send, Leaf, CheckCircle, AlertCircle, PhoneCall, Loader, BookOpen } from 'lucide-react';
import { REGIONES, getComunas } from '../data/regionesComunas';
import CatalogoVisual from './CatalogoVisual';

/**
 * Bot de Pedidos para WhatsApp - REFACTORIZADO
 * Nuevo flujo: RUT → Validar → Lead/Existente → Catálogo → Formato → Cantidad → Despacho → Dirección → Pago → Confirmación
 */

const API_BASE_URL = import.meta.env.VITE_WMS_URL || 'http://localhost:3000';

const FLUJO_ESTADOS = {
  // Fase 1: Validación
  INICIO: 'inicio',
  SOLICITAR_RUT: 'solicitar_rut',
  VALIDANDO_RUT: 'validando_rut',

  // Fase 2A: Cliente Existente
  CLIENTE_EXISTENTE: 'cliente_existente',

  // Fase 2B: Nuevo Lead
  SOLICITAR_NOMBRE: 'solicitar_nombre',
  SOLICITAR_RAZON_SOCIAL: 'solicitar_razon_social',
  SOLICITAR_TIPO_NEGOCIO: 'solicitar_tipo_negocio',
  SOLICITAR_TIPO_CLIENTE: 'solicitar_tipo_cliente',
  SOLICITAR_DIRECCION_LEAD: 'solicitar_direccion_lead',
  SOLICITAR_REGION_LEAD: 'solicitar_region_lead',
  SOLICITAR_COMUNA_LEAD: 'solicitar_comuna_lead',
  CREANDO_LEAD: 'creando_lead',
  LEAD_EN_ESPERA: 'lead_en_espera',
  POLLING_APROBACION: 'polling_aprobacion',

  // Fase 3: Catálogo
  CARGANDO_CATALOGO: 'cargando_catalogo',
  SELECCIONAR_PRODUCTO: 'seleccionar_producto',

  // Fase 4: Formato
  SELECCIONAR_FORMATO: 'seleccionar_formato',

  // Fase 5: Cantidad
  SOLICITAR_CANTIDAD: 'solicitar_cantidad',

  // Fase 5b: ¿Algo más? (carrito multi-producto)
  PREGUNTAR_MAS: 'preguntar_mas',

  // Fase 6: Despacho
  SOLICITAR_DESPACHO: 'solicitar_despacho',

  // Fase 7: Dirección + comuna de entrega (cascada región → comuna)
  SOLICITAR_DIRECCION: 'solicitar_direccion',
  SOLICITAR_REGION_ENTREGA: 'solicitar_region_entrega',
  SOLICITAR_COMUNA_ENTREGA: 'solicitar_comuna_entrega',

  // Fase 8: Pago
  SOLICITAR_PAGO: 'solicitar_pago',

  // Fase 9: Confirmación
  RESUMEN: 'resumen',
  PROCESANDO: 'procesando',
  COMPLETADO: 'completado',
  CANCELADO: 'cancelado',

  // Transversal: escalado a ejecutivo humano (disponible en cualquier punto)
  ESCALADO: 'escalado',
};

const TIPOS_NEGOCIO = ['Cafetería', 'Restaurante', 'Tienda', 'Supermercado', 'Otro'];
const TIPOS_CLIENTE = ['Empresa', 'Persona Natural'];
const METODOS_PAGO = ['Efectivo', 'Transferencia', 'Cheque'];

// Contacto del ejecutivo comercial (configurar en producción vía variable de entorno)
const EJECUTIVO_WHATSAPP = import.meta.env.VITE_EJECUTIVO_WHATSAPP || '+56 9 1234 5678';

// Frases que disparan el escalado a un ejecutivo humano cuando el cliente tiene dudas
const PALABRAS_ESCALADA = [
  'ejecutivo', 'humano', 'persona', 'asesor', 'agente', 'vendedor',
  'ayuda', 'duda', 'consulta', 'hablar con', 'no entiendo', 'no sé', 'no se',
];

export default function BotPedidosWhatsApp() {
  const [mensajes, setMensajes] = useState([]);
  const [estado, setEstado] = useState(FLUJO_ESTADOS.INICIO);
  const [datosFormulario, setDatosFormulario] = useState({});
  const [input, setInput] = useState('');
  const [escribiendo, setEscribiendo] = useState(false);
  const [errores, setErrores] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [clienteInfo, setClienteInfo] = useState(null);
  const [leadId, setLeadId] = useState(null);
  const [showCatalogo, setShowCatalogo] = useState(false);
  const [carrito, setCarrito] = useState([]); // items del pedido en curso
  const chatRef = useRef(null);
  const pollingRef = useRef(null);
  const estadoPrevioRef = useRef(null); // { estado, prompt } previos al escalado
  const ultimoPromptRef = useRef(null); // último prompt del bot, para reanudar tras escalar
  const inicializadoRef = useRef(false); // evita el doble saludo por StrictMode (dev)

  // Enviar mensaje del bot
  const enviarBotMessage = useCallback(async (texto) => {
    ultimoPromptRef.current = texto;
    setEscribiendo(true);
    await new Promise(r => setTimeout(r, 800));

    setMensajes(prev => [
      ...prev,
      {
        tipo: 'bot',
        texto,
        hora: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setEscribiendo(false);

    setTimeout(() => {
      chatRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  // Agregar mensaje de sistema
  const mensajeDelSistema = useCallback(async (texto) => {
    setMensajes(prev => [
      ...prev,
      {
        tipo: 'sistema',
        texto,
        hora: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, []);

  // Cargar catálogo
  const cargarCatalogo = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/whatsapp/catalog/productos`);
      const data = await res.json();

      if (data.success && data.catalogo) {
        setCatalogo(data.catalogo);
        return data.catalogo;
      }
      return [];
    } catch (error) {
      console.error('[Bot] Error cargando catálogo:', error);
      return [];
    }
  }, []);

  // Escalar a un ejecutivo humano (disponible en cualquier punto del flujo)
  const escalarAEjecutivo = useCallback(
    async (motivo = null) => {
      // Guardamos dónde estábamos para poder reanudar el pedido después
      if (estado !== FLUJO_ESTADOS.ESCALADO) {
        estadoPrevioRef.current = { estado, prompt: ultimoPromptRef.current };
      }
      setErrores([]);
      setEstado(FLUJO_ESTADOS.ESCALADO);

      // Contexto para el ejecutivo (extensible a un endpoint de notificaciones)
      console.info('[Bot] Escalada a ejecutivo', {
        estadoPrevio: estadoPrevioRef.current?.estado || null,
        rut: datosFormulario.rut || null,
        cliente: datosFormulario.contactName || clienteInfo?.nombre || null,
        motivo,
      });

      await enviarBotMessage(
        `🤝 Te estoy conectando con un *ejecutivo comercial* de WhakaChile.\n\n` +
          `En breve alguien te atenderá personalmente. Mientras tanto, puedes escribir tu consulta aquí y la haremos llegar.\n\n` +
          `📱 ¿Prefieres contacto directo? Escríbenos por WhatsApp: ${EJECUTIVO_WHATSAPP}`
      );
    },
    [estado, datosFormulario, clienteInfo, enviarBotMessage]
  );

  // Reanudar el flujo estructurado donde se dejó antes de escalar
  const volverAlBot = useCallback(async () => {
    const previo = estadoPrevioRef.current;
    const destino = previo?.estado || FLUJO_ESTADOS.SOLICITAR_RUT;
    setEstado(destino);
    await enviarBotMessage('👍 Retomemos tu pedido donde lo dejamos:');
    if (previo?.prompt) await enviarBotMessage(previo.prompt);
  }, [enviarBotMessage]);

  // Procesar entrada del usuario
  const procesarEntrada = useCallback(
    async (texto) => {
      setMensajes(prev => [
        ...prev,
        {
          tipo: 'usuario',
          texto,
          hora: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      // ===== ESCALADO TRANSVERSAL A EJECUTIVO =====
      // Si ya está con un ejecutivo, sus mensajes se registran como consulta
      if (estado === FLUJO_ESTADOS.ESCALADO) {
        await mensajeDelSistema('✅ Mensaje recibido. Un ejecutivo comercial revisará tu consulta a la brevedad.');
        return;
      }
      // Si pide ayuda humana en cualquier punto, escalamos sin perder el avance
      const textoLower = texto.toLowerCase();
      if (PALABRAS_ESCALADA.some(k => textoLower.includes(k))) {
        await escalarAEjecutivo(texto);
        return;
      }

      let nuevoEstado = estado;
      let nuevosDatos = { ...datosFormulario };
      let nuevosErrores = [];

      switch (estado) {
        // ===== FASE 1: VALIDACIÓN =====
        case FLUJO_ESTADOS.INICIO:
          await enviarBotMessage('👋 ¡Hola! Bienvenido a WhakaChile.\n\nPara comenzar, necesitamos validar tu RUT.');
          nuevoEstado = FLUJO_ESTADOS.SOLICITAR_RUT;
          break;

        case FLUJO_ESTADOS.SOLICITAR_RUT:
          if (!texto || texto.trim().length < 7) {
            nuevosErrores.push('Por favor, ingresa un RUT válido (ej: 12345678-9)');
          } else {
            nuevosDatos.rut = texto.trim();
            setEstado(FLUJO_ESTADOS.VALIDANDO_RUT);
            await mensajeDelSistema('⏳ Validando RUT...');

            try {
              const res = await fetch(`${API_BASE_URL}/api/whatsapp/leads/validate-rut`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rut: texto.trim() }),
              });

              const result = await res.json();

              if (result.success) {
                if (result.flowType === 'existing_client') {
                  nuevosDatos.clientId = result.clientId;
                  nuevoEstado = FLUJO_ESTADOS.CLIENTE_EXISTENTE;
                  await enviarBotMessage('✅ ¡Encontramos tu registro!\n\nCargando catálogo...');

                  const cat = await cargarCatalogo();
                  if (cat.length > 0) {
                    nuevoEstado = FLUJO_ESTADOS.SELECCIONAR_PRODUCTO;
                    await mostrarCatalogo(cat);
                  }
                } else if (result.flowType === 'new_lead') {
                  nuevoEstado = FLUJO_ESTADOS.SOLICITAR_NOMBRE;
                  await enviarBotMessage(
                    '📝 No encontramos tu RUT en nuestros registros.\n\nVamos a registrarte para que puedas hacer pedidos.\n\n¿Cuál es tu nombre?'
                  );
                } else if (result.flowType === 'pending_lead') {
                  nuevoEstado = FLUJO_ESTADOS.LEAD_EN_ESPERA;
                  setLeadId(result.leadId);
                  await enviarBotMessage(
                    '⏳ Tu solicitud está siendo revisada por nuestro equipo.\n\nNos pondremos en contacto pronto.'
                  );
                }
              } else {
                nuevosErrores.push(result.error || 'Error validando RUT');
                nuevoEstado = FLUJO_ESTADOS.SOLICITAR_RUT;
              }
            } catch (error) {
              console.error('[Bot] Error:', error);
              nuevosErrores.push('Error de conexión. Intenta de nuevo.');
              nuevoEstado = FLUJO_ESTADOS.SOLICITAR_RUT;
            }
          }
          break;

        // ===== FASE 2B: NUEVO LEAD =====
        case FLUJO_ESTADOS.SOLICITAR_NOMBRE:
          if (texto.trim().length < 2) {
            nuevosErrores.push('El nombre debe tener al menos 2 caracteres');
          } else {
            nuevosDatos.contactName = texto;
            nuevoEstado = FLUJO_ESTADOS.SOLICITAR_RAZON_SOCIAL;
            await enviarBotMessage('¿Cuál es el nombre de tu negocio / empresa?');
          }
          break;

        case FLUJO_ESTADOS.SOLICITAR_RAZON_SOCIAL:
          if (texto.trim().length < 3) {
            nuevosErrores.push('La razón social debe tener al menos 3 caracteres');
          } else {
            nuevosDatos.razonSocial = texto;
            nuevoEstado = FLUJO_ESTADOS.SOLICITAR_TIPO_NEGOCIO;
            await enviarBotMessage(
              `¿Qué tipo de negocio tienes?\n\n${TIPOS_NEGOCIO.map((t, i) => `${i + 1}️⃣ ${t}`).join('\n')}\n\nResponde con el número:`
            );
          }
          break;

        case FLUJO_ESTADOS.SOLICITAR_TIPO_NEGOCIO:
          const idxNegocio = parseInt(texto) - 1;
          if (isNaN(idxNegocio) || idxNegocio < 0 || idxNegocio >= TIPOS_NEGOCIO.length) {
            nuevosErrores.push(`Por favor, responde con un número del 1 al ${TIPOS_NEGOCIO.length}`);
          } else {
            nuevosDatos.tipoNegocio = TIPOS_NEGOCIO[idxNegocio];
            nuevoEstado = FLUJO_ESTADOS.SOLICITAR_TIPO_CLIENTE;
            await enviarBotMessage(
              `¿Cuál es tu tipo de cliente?\n\n${TIPOS_CLIENTE.map((t, i) => `${i + 1}️⃣ ${t}`).join('\n')}\n\nResponde con el número:`
            );
          }
          break;

        case FLUJO_ESTADOS.SOLICITAR_TIPO_CLIENTE:
          const idxCliente = parseInt(texto) - 1;
          if (isNaN(idxCliente) || idxCliente < 0 || idxCliente >= TIPOS_CLIENTE.length) {
            nuevosErrores.push(`Por favor, responde con un número del 1 al ${TIPOS_CLIENTE.length}`);
          } else {
            nuevosDatos.tipoCliente = TIPOS_CLIENTE[idxCliente];
            nuevoEstado = FLUJO_ESTADOS.SOLICITAR_DIRECCION_LEAD;
            await enviarBotMessage(
              '📍 ¿Cuál es la dirección de tu negocio?\n\nIncluye calle, número y depto/oficina si aplica:'
            );
          }
          break;

        case FLUJO_ESTADOS.SOLICITAR_DIRECCION_LEAD:
          if (texto.trim().length < 5) {
            nuevosErrores.push('Dirección muy corta. Incluye calle y número.');
          } else {
            nuevosDatos.direccion = texto.trim();
            nuevoEstado = FLUJO_ESTADOS.SOLICITAR_REGION_LEAD;
            await enviarBotMessage(
              `🗺️ ¿En qué región se ubica tu negocio?\n\n${REGIONES.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\nResponde con el número:`
            );
          }
          break;

        case FLUJO_ESTADOS.SOLICITAR_REGION_LEAD: {
          const idxRegion = parseInt(texto) - 1;
          if (isNaN(idxRegion) || idxRegion < 0 || idxRegion >= REGIONES.length) {
            nuevosErrores.push(`Por favor, responde con un número del 1 al ${REGIONES.length}`);
          } else {
            const region = REGIONES[idxRegion];
            nuevosDatos.region = region;
            const comunas = getComunas(region);
            nuevoEstado = FLUJO_ESTADOS.SOLICITAR_COMUNA_LEAD;
            await enviarBotMessage(
              `🏙️ ¿En qué comuna? (${region})\n\n${comunas.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\nResponde con el número o escribe el nombre:`
            );
          }
          break;
        }

        case FLUJO_ESTADOS.SOLICITAR_COMUNA_LEAD: {
          const comunas = getComunas(nuevosDatos.region);
          const idxComuna = parseInt(texto) - 1;
          let comunaSel = null;
          if (!isNaN(idxComuna) && idxComuna >= 0 && idxComuna < comunas.length) {
            comunaSel = comunas[idxComuna];
          } else {
            // permitir escribir el nombre (ignorando tildes y mayúsculas)
            const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
            comunaSel = comunas.find(c => norm(c) === norm(texto)) || null;
          }

          if (!comunaSel) {
            nuevosErrores.push('No reconocí esa comuna. Responde con el número de la lista o escribe el nombre exacto.');
          } else {
            nuevosDatos.comuna = comunaSel;
            nuevoEstado = FLUJO_ESTADOS.CREANDO_LEAD;
            await mensajeDelSistema('⏳ Registrando tu negocio...');

            try {
              const res = await fetch(`${API_BASE_URL}/api/whatsapp/leads/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  rut: nuevosDatos.rut,
                  razonSocial: nuevosDatos.razonSocial,
                  tipoNegocio: nuevosDatos.tipoNegocio,
                  tipoCliente: nuevosDatos.tipoCliente,
                  direccion: nuevosDatos.direccion,
                  comuna: nuevosDatos.comuna,
                  region: nuevosDatos.region,
                  phone: '+56912345678', // Mock - en producción viene de WhatsApp
                  contactName: nuevosDatos.contactName,
                }),
              });

              const result = await res.json();

              if (result.success) {
                setLeadId(result.leadId);
                nuevoEstado = FLUJO_ESTADOS.LEAD_EN_ESPERA;
                await enviarBotMessage(
                  '✅ ¡Tu registro ha sido creado!\n\nNuestro equipo está revisando tu solicitud.\nTe notificaremos cuando sea aprobada.'
                );
              } else {
                nuevosErrores.push(result.error || 'Error registrando tu negocio');
                nuevoEstado = FLUJO_ESTADOS.SOLICITAR_COMUNA_LEAD;
              }
            } catch (error) {
              console.error('[Bot] Error:', error);
              nuevosErrores.push('Error de conexión');
              nuevoEstado = FLUJO_ESTADOS.SOLICITAR_COMUNA_LEAD;
            }
          }
          break;
        }

        // ===== FASE 3: CATÁLOGO =====
        case FLUJO_ESTADOS.SELECCIONAR_PRODUCTO:
          const productMap = {};
          catalogo.forEach((prod, idx) => {
            productMap[idx + 1] = prod.id;
          });

          const numProd = parseInt(texto);
          if (!productMap[numProd]) {
            nuevosErrores.push(`Por favor, responde con un número del 1 al ${catalogo.length}`);
          } else {
            const producto = catalogo.find(p => p.id === productMap[numProd]);
            nuevosDatos.productoId = producto.id;
            nuevosDatos.productName = producto.nombre;

            if (producto.formatos && producto.formatos.length > 0) {
              nuevoEstado = FLUJO_ESTADOS.SELECCIONAR_FORMATO;
              await mostrarFormatos(producto);
            } else {
              nuevosErrores.push('Este producto no tiene formatos disponibles');
            }
          }
          break;

        // ===== FASE 4: FORMATO =====
        case FLUJO_ESTADOS.SELECCIONAR_FORMATO:
          const producto = catalogo.find(p => p.id === nuevosDatos.productoId);
          const formatoIdx = parseInt(texto) - 1;

          if (isNaN(formatoIdx) || formatoIdx < 0 || formatoIdx >= producto.formatos.length) {
            nuevosErrores.push(`Por favor, responde con un número del 1 al ${producto.formatos.length}`);
          } else {
            const formato = producto.formatos[formatoIdx];
            nuevosDatos.productoFormatoId = formato.id;
            nuevosDatos.formato = formato.formato;
            nuevosDatos.unidadMedida = formato.unidadMedida;
            nuevosDatos.precioFormato = formato.precio;

            nuevoEstado = FLUJO_ESTADOS.SOLICITAR_CANTIDAD;
            await enviarBotMessage(
              `📦 ¿Cuántos ${formato.unidadMedida} necesitas?\n\n(Disponible: ${formato.stock} unidades)\n\nResponde con la cantidad:`
            );
          }
          break;

        // ===== FASE 5: CANTIDAD =====
        case FLUJO_ESTADOS.SOLICITAR_CANTIDAD:
          const qty = parseFloat(texto);
          if (isNaN(qty) || qty <= 0) {
            nuevosErrores.push('Debe ser un número mayor a 0');
          } else {
            const prod = catalogo.find(p => p.id === nuevosDatos.productoId);
            const formato = prod?.formatos?.find(f => f.id === nuevosDatos.productoFormatoId);

            if (formato && qty > formato.stock) {
              nuevosErrores.push(`Stock insuficiente. Máximo disponible: ${formato.stock}`);
            } else {
              // Agregar el ítem al carrito
              const precio = nuevosDatos.precioFormato;
              const item = {
                productoId: nuevosDatos.productoId,
                productName: nuevosDatos.productName,
                productoFormatoId: nuevosDatos.productoFormatoId,
                formato: nuevosDatos.formato,
                unidadMedida: nuevosDatos.unidadMedida,
                precioFormato: precio,
                cantidad: qty,
                subtotal: qty * precio,
              };
              const nuevoCarrito = [...carrito, item];
              setCarrito(nuevoCarrito);

              const subtotalCarrito = nuevoCarrito.reduce((a, it) => a + it.subtotal, 0);
              const oferta = catalogo.find(p => p.enOferta && !nuevoCarrito.some(i => i.productoId === p.id));
              nuevosDatos.ofertaId = oferta ? oferta.id : null;

              nuevoEstado = FLUJO_ESTADOS.PREGUNTAR_MAS;
              let msg = `✅ Agregado: *${item.productName}* x${qty} — $${item.subtotal.toLocaleString('es-CL')}\n\n🛒 Tu pedido lleva *${nuevoCarrito.length}* producto(s) — Subtotal: $${subtotalCarrito.toLocaleString('es-CL')}\n\n¿Deseas agregar algo más?\n1️⃣ Agregar otro producto\n2️⃣ Finalizar pedido`;
              if (oferta) {
                msg += `\n3️⃣ 🔥 *${oferta.nombre}* en OFERTA: $${oferta.precioBase.toLocaleString('es-CL')}`;
                if (oferta.precioAnterior) msg += ` (antes $${oferta.precioAnterior.toLocaleString('es-CL')})`;
              }
              await enviarBotMessage(msg);
            }
          }
          break;

        // ===== FASE 5b: ¿ALGO MÁS? (carrito) =====
        case FLUJO_ESTADOS.PREGUNTAR_MAS: {
          if (texto === '1') {
            nuevoEstado = FLUJO_ESTADOS.SELECCIONAR_PRODUCTO;
            await mostrarCatalogo(catalogo);
          } else if (texto === '2') {
            nuevoEstado = FLUJO_ESTADOS.SOLICITAR_DESPACHO;
            await enviarBotMessage('🚚 ¿Cómo quieres recibir tu pedido?\n\n1️⃣ Retiro\n2️⃣ Entrega\n\nResponde con el número:');
          } else if (texto === '3' && nuevosDatos.ofertaId) {
            const oferta = catalogo.find(p => p.id === nuevosDatos.ofertaId);
            if (oferta) {
              nuevosDatos.productoId = oferta.id;
              nuevosDatos.productName = oferta.nombre;
              nuevoEstado = FLUJO_ESTADOS.SELECCIONAR_FORMATO;
              await mostrarFormatos(oferta);
            } else {
              nuevosErrores.push('Responde 1, 2 o 3');
            }
          } else {
            nuevosErrores.push('Responde con 1 (agregar), 2 (finalizar)' + (nuevosDatos.ofertaId ? ' o 3 (oferta)' : ''));
          }
          break;
        }

        // ===== FASE 6: DESPACHO =====
        case FLUJO_ESTADOS.SOLICITAR_DESPACHO:
          if (texto === '1' || texto === '2') {
            nuevosDatos.tipoDespacho = texto === '1' ? 'retiro' : 'entrega';
            nuevoEstado = texto === '1' ? FLUJO_ESTADOS.SOLICITAR_PAGO : FLUJO_ESTADOS.SOLICITAR_DIRECCION;

            if (texto === '1') {
              await enviarBotMessage('💳 ¿Cómo vas a pagar?\n\n1️⃣ Efectivo\n2️⃣ Transferencia\n3️⃣ Cheque\n\nResponde con el número:');
            } else {
              await enviarBotMessage('📍 ¿A qué dirección entregamos?\n\nIncluye: calle, número, depto (si aplica), referencia:');
            }
          } else {
            nuevosErrores.push('Por favor, responde con 1 o 2');
          }
          break;

        // ===== FASE 7: DIRECCIÓN =====
        case FLUJO_ESTADOS.SOLICITAR_DIRECCION:
          if (texto.trim().length < 10) {
            nuevosErrores.push('Dirección muy corta. Incluye calle, número y referencias');
          } else {
            nuevosDatos.direccion = texto;
            nuevoEstado = FLUJO_ESTADOS.SOLICITAR_REGION_ENTREGA;
            await enviarBotMessage(
              `🗺️ ¿En qué región es la entrega?\n\n${REGIONES.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\nResponde con el número:`
            );
          }
          break;

        case FLUJO_ESTADOS.SOLICITAR_REGION_ENTREGA: {
          const idxRegion = parseInt(texto) - 1;
          if (isNaN(idxRegion) || idxRegion < 0 || idxRegion >= REGIONES.length) {
            nuevosErrores.push(`Por favor, responde con un número del 1 al ${REGIONES.length}`);
          } else {
            const region = REGIONES[idxRegion];
            nuevosDatos.regionEntrega = region;
            const comunas = getComunas(region);
            nuevoEstado = FLUJO_ESTADOS.SOLICITAR_COMUNA_ENTREGA;
            await enviarBotMessage(
              `🏙️ ¿En qué comuna? (${region})\n\n${comunas.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\nResponde con el número o escribe el nombre:`
            );
          }
          break;
        }

        case FLUJO_ESTADOS.SOLICITAR_COMUNA_ENTREGA: {
          const comunas = getComunas(nuevosDatos.regionEntrega);
          const idxComuna = parseInt(texto) - 1;
          let comunaSel = null;
          if (!isNaN(idxComuna) && idxComuna >= 0 && idxComuna < comunas.length) {
            comunaSel = comunas[idxComuna];
          } else {
            const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
            comunaSel = comunas.find(c => norm(c) === norm(texto)) || null;
          }
          if (!comunaSel) {
            nuevosErrores.push('No reconocí esa comuna. Responde con el número de la lista o escribe el nombre exacto.');
          } else {
            nuevosDatos.ciudad = comunaSel;
            nuevoEstado = FLUJO_ESTADOS.SOLICITAR_PAGO;
            await enviarBotMessage(
              '💳 ¿Cómo vas a pagar?\n\n1️⃣ Efectivo\n2️⃣ Transferencia\n3️⃣ Cheque\n\nResponde con el número:'
            );
          }
          break;
        }

        // ===== FASE 8: PAGO =====
        case FLUJO_ESTADOS.SOLICITAR_PAGO:
          const idxPago = parseInt(texto) - 1;
          if (isNaN(idxPago) || idxPago < 0 || idxPago >= METODOS_PAGO.length) {
            nuevosErrores.push(`Por favor, responde con un número del 1 al ${METODOS_PAGO.length}`);
          } else {
            nuevosDatos.metodo_pago = METODOS_PAGO[idxPago];
            nuevoEstado = FLUJO_ESTADOS.RESUMEN;
            await mostrarResumen(carrito, nuevosDatos);
          }
          break;

        // ===== FASE 9: RESUMEN & CONFIRMACIÓN =====
        case FLUJO_ESTADOS.RESUMEN:
          if (texto.toUpperCase() === 'SI') {
            nuevoEstado = FLUJO_ESTADOS.PROCESANDO;
            await mensajeDelSistema('⏳ Procesando pedido...');

            try {
              const ids = [];
              let fallo = null;
              for (const it of carrito) {
                const res = await fetch(`${API_BASE_URL}/api/whatsapp/orders/create`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    clientPhone: '+56912345678',
                    clientName: nuevosDatos.contactName || 'Cliente',
                    clientId: nuevosDatos.clientId,
                    productoFormatoId: it.productoFormatoId,
                    productId: it.productoId,
                    productName: it.productName,
                    quantity: it.cantidad,
                    unitOfMeasure: it.unidadMedida,
                    unitPrice: it.precioFormato,
                    deliveryType: nuevosDatos.tipoDespacho,
                    address: nuevosDatos.direccion,
                    city: nuevosDatos.ciudad,
                    paymentMethod: nuevosDatos.metodo_pago,
                  }),
                });
                const result = await res.json();
                if (result.success) ids.push(result.orderId);
                else { fallo = result.error || 'Error al procesar'; break; }
              }

              if (!fallo) {
                nuevoEstado = FLUJO_ESTADOS.COMPLETADO;
                const total = carrito.reduce((a, it) => a + it.subtotal, 0);
                const ref = ids[0] ? ids[0].slice(0, 8).toUpperCase() : '—';
                await mensajeDelSistema(
                  `✅ ¡PEDIDO CONFIRMADO!\n📦 ${carrito.length} producto(s) — Total: $${total.toLocaleString('es-CL')}\nN° de pedido: ${ref}${ids.length > 1 ? ` (+${ids.length - 1} más)` : ''}\n\nTu pedido está en el sistema. ¡Gracias! 🌿`
                );
                setCarrito([]);
              } else {
                nuevosErrores.push(fallo);
                nuevoEstado = FLUJO_ESTADOS.RESUMEN;
              }
            } catch (error) {
              console.error('[Bot] Error:', error);
              nuevosErrores.push('Error de conexión');
              nuevoEstado = FLUJO_ESTADOS.RESUMEN;
            }
          } else if (texto.toUpperCase() === 'NO') {
            nuevoEstado = FLUJO_ESTADOS.CANCELADO;
            await enviarBotMessage('❌ Pedido cancelado. ¿Hay algo más en lo que pueda ayudarte? 😊');
          } else {
            nuevosErrores.push('Por favor, responde SI o NO');
          }
          break;

        default:
          nuevosErrores.push('Estado desconocido');
      }

      // Actualizar estado
      setErrores(nuevosErrores);
      setDatosFormulario(nuevosDatos);

      if (nuevosErrores.length > 0) {
        setMensajes(prev => [
          ...prev,
          {
            tipo: 'error',
            texto: '❌ ' + nuevosErrores.join('\n'),
            hora: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }

      if (nuevoEstado) {
        setEstado(nuevoEstado);
      }
    },
    [estado, datosFormulario, catalogo, carrito, enviarBotMessage, mensajeDelSistema, cargarCatalogo, escalarAEjecutivo]
  );

  // Mostrar catálogo
  const mostrarCatalogo = useCallback(
    async (catalogoData) => {
      const texto = `🛒 **CATÁLOGO DE PRODUCTOS**\n\n${catalogoData
        .map(
          (p, i) =>
            `${i + 1}️⃣ ${p.nombre}\n   Formatos disponibles: ${p.formatos.map(f => f.formato).join(', ')}`
        )
        .join('\n\n')}\n\nResponde con el número del producto:`;

      await enviarBotMessage(texto);
      setEstado(FLUJO_ESTADOS.SELECCIONAR_PRODUCTO);
    },
    [enviarBotMessage]
  );

  // Mostrar formatos
  const mostrarFormatos = useCallback(async (producto) => {
    const texto = `📦 **${producto.nombre}**\n\nFormatos disponibles:\n\n${producto.formatos
      .map(
        (f, i) => `${i + 1}️⃣ ${f.formato} - $${f.precio.toLocaleString()} (Stock: ${f.stock})`
      )
      .join('\n')}\n\nResponde con el número del formato:`;

    await enviarBotMessage(texto);
  }, [enviarBotMessage]);

  // Mostrar resumen
  const mostrarResumen = useCallback(
    async (items, datos) => {
      const total = items.reduce((a, it) => a + it.subtotal, 0);
      const lineas = items
        .map(it => `• ${it.productName} (${it.formato}) x${it.cantidad} — $${it.subtotal.toLocaleString('es-CL')}`)
        .join('\n');
      const entrega = datos.tipoDespacho === 'entrega'
        ? `\n📍 ${datos.direccion}\n🏙️ ${datos.ciudad}`
        : '';
      const texto = `📋 *RESUMEN DE TU PEDIDO*\n\n🛒 ${items.length} producto(s):\n${lineas}\n\n🚚 Despacho: ${datos.tipoDespacho === 'retiro' ? 'RETIRO' : 'ENTREGA'}${entrega}\n\n💳 Pago: ${datos.metodo_pago}\n\n═════════════════════\nTOTAL: $${total.toLocaleString('es-CL')}\n═════════════════════\n\n¿CONFIRMAS TU PEDIDO? (SI/NO)`;

      await enviarBotMessage(texto);
    },
    [enviarBotMessage]
  );

  // Iniciar flujo (una sola vez, incluso con el doble montaje de StrictMode)
  useEffect(() => {
    if (inicializadoRef.current) return;
    inicializadoRef.current = true;
    enviarBotMessage('👋 ¡Hola! Bienvenido a WhakaChile.\n\nPara comenzar, necesitamos validar tu RUT.');
    setEstado(FLUJO_ESTADOS.SOLICITAR_RUT);
  }, []);

  // Limpiar polling al desmontar
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Polling: mientras el lead está "en espera", consultar si el admin lo aprobó/rechazó.
  // Al aprobarse, cierra el flujo de registro mostrando el éxito y abriendo el catálogo.
  useEffect(() => {
    if (estado !== FLUJO_ESTADOS.LEAD_EN_ESPERA || !leadId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/whatsapp/leads/${leadId}/status`);
        const data = await res.json();
        if (!data.success) return;

        if (data.status === 'aprobado' || data.status === 'cliente_creado') {
          clearInterval(interval);
          pollingRef.current = null;
          setDatosFormulario(prev => ({ ...prev, clientId: data.clientId }));
          await enviarBotMessage(
            '🎉 *¡Tu registro fue aprobado!*\n\nYa eres cliente de WhakaChile. Te dejamos el catálogo para que hagas tu primer pedido 👇'
          );
          const cat = await cargarCatalogo();
          if (cat.length > 0) {
            await mostrarCatalogo(cat);
          }
        } else if (data.status === 'rechazado') {
          clearInterval(interval);
          pollingRef.current = null;
          await enviarBotMessage(
            'Tu solicitud no fue aprobada en esta ocasión. 🙏\n\nUn ejecutivo se pondrá en contacto contigo para más información. ¡Gracias por tu interés!'
          );
          setEstado(FLUJO_ESTADOS.CANCELADO);
        }
      } catch (_) {
        // silencio — se reintenta en el próximo ciclo
      }
    }, 3000);

    pollingRef.current = interval;
    return () => clearInterval(interval);
  }, [estado, leadId, enviarBotMessage, cargarCatalogo, mostrarCatalogo]);

  // Enviar mensaje
  const handleSend = () => {
    if (!input.trim()) return;
    procesarEntrada(input);
    setInput('');
  };

  return (
    <div className="h-screen flex bg-[#111827] overflow-hidden">
      <CatalogoVisual open={showCatalogo} onClose={() => setShowCatalogo(false)} />
      <div className="w-full flex flex-col">
        {/* Header */}
        <div className="h-16 bg-[#2D7D46] flex items-center px-4 gap-3">
          <Leaf className="w-5 h-5 text-white" />
          <div className="flex-1">
            <h3 className="text-white font-bold text-sm">Bot de Pedidos — WhakaChile</h3>
            <p className="text-[#A7F3D0] text-xs">Con validación de RUT y Lead Management</p>
          </div>
          <button
            onClick={() => setShowCatalogo(true)}
            title="Ver catálogo"
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
          >
            <BookOpen className="w-5 h-5 text-white/80" />
          </button>
          <button
            onClick={() => escalarAEjecutivo()}
            title="Hablar con un ejecutivo"
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
          >
            <PhoneCall className="w-5 h-5 text-white/80" />
          </button>
        </div>

        {/* Chat */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#ECE5DD]">
          {mensajes.map((msg, i) => (
            <div key={i} className={`flex ${msg.tipo === 'usuario' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[70%] rounded-lg px-3 py-2 ${
                  msg.tipo === 'usuario'
                    ? 'bg-[#DCF8C6] text-gray-800'
                    : msg.tipo === 'bot'
                    ? 'bg-white text-gray-800'
                    : msg.tipo === 'error'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.texto}</p>
                <p className="text-xs text-gray-500 mt-1">{msg.hora}</p>
              </div>
            </div>
          ))}
          {escribiendo && (
            <div className="flex justify-start">
              <div className="bg-white rounded-lg px-3 py-2">
                <Loader className="w-4 h-4 animate-spin text-gray-600" />
              </div>
            </div>
          )}
          <div ref={chatRef} />
        </div>

        {/* Barra de escalado / acción de ejecutivo */}
        {estado === FLUJO_ESTADOS.ESCALADO ? (
          <div className="bg-amber-50 border-t border-amber-200 px-3 py-2 flex items-center justify-between gap-2">
            <span className="text-xs text-amber-800 flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5" /> En contacto con un ejecutivo comercial
            </span>
            <button
              onClick={volverAlBot}
              className="text-xs font-semibold text-[#2D7D46] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Volver a mi pedido
            </button>
          </div>
        ) : (
          <div className="bg-white border-t border-gray-100 px-3 py-1.5 flex justify-end">
            <button
              onClick={() => escalarAEjecutivo()}
              className="text-xs text-gray-500 hover:text-[#2D7D46] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5" /> ¿Dudas? Hablar con un ejecutivo
            </button>
          </div>
        )}

        {/* Input */}
        <div className="h-14 bg-white border-t border-gray-200 flex items-center px-3 gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={estado === FLUJO_ESTADOS.ESCALADO ? 'Escribe tu consulta al ejecutivo...' : 'Escribe tu respuesta...'}
            className="flex-1 text-sm outline-none placeholder:text-gray-400"
            disabled={estado === FLUJO_ESTADOS.LEAD_EN_ESPERA || estado === FLUJO_ESTADOS.COMPLETADO}
          />
          <button
            onClick={handleSend}
            disabled={estado === FLUJO_ESTADOS.LEAD_EN_ESPERA || estado === FLUJO_ESTADOS.COMPLETADO}
            className="w-10 h-10 rounded-full bg-[#2D7D46] flex items-center justify-center hover:bg-[#236335] disabled:bg-gray-400 transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
