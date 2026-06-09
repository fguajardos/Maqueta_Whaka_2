import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Send, Leaf, CheckCircle, AlertCircle, PhoneCall } from 'lucide-react';

/**
 * Bot de Pedidos para WhatsApp
 * Flujo: Cliente → Producto → Cantidad → Despacho → Dirección → Pago → Confirmación
 */

const PRODUCTOS_MOCK = [
  { id: 'leche-desc', nombre: 'Leche Descremada', unidad: 'litro', precio: 1200, stock: 50 },
  { id: 'leche-entera', nombre: 'Leche Entera', unidad: 'litro', precio: 1200, stock: 40 },
  { id: 'yogurt', nombre: 'Yogurt Natural', unidad: '500ml', precio: 800, stock: 60 },
  { id: 'queso', nombre: 'Queso', unidad: 'kg', precio: 8500, stock: 15 },
  { id: 'mantequilla', nombre: 'Mantequilla', unidad: 'kg', precio: 6500, stock: 25 },
];

const CIUDADES = ['Guaca', 'Santiago', 'Providencia', 'Ñuñoa'];
const METODOS_PAGO = ['Efectivo', 'Transferencia', 'Cheque'];

// API URL - conectar a WMS real
const API_BASE_URL = import.meta.env.VITE_WMS_URL || 'http://localhost:3000';
const API_ENDPOINT = `${API_BASE_URL}/api/orders/whatsapp/create`;

// Datos de producto compartidos entre CRM y WMS
const PRODUCTOS_COMPARTIDOS = {
  'leche-desc': { nombre: 'Leche Descremada', unidad: 'litro', precio: 1200, stock: 50 },
  'leche-entera': { nombre: 'Leche Entera', unidad: 'litro', precio: 1200, stock: 40 },
  'yogurt': { nombre: 'Yogurt Natural', unidad: '500ml', precio: 800, stock: 60 },
  'queso': { nombre: 'Queso', unidad: 'kg', precio: 8500, stock: 15 },
  'mantequilla': { nombre: 'Mantequilla', unidad: 'kg', precio: 6500, stock: 25 },
};

const FLUJO_PASOS = {
  cliente: {
    pregunta: '👤 ¿Cuál es tu nombre?',
    tipo: 'input',
  },
  producto: {
    pregunta: '🛒 ¿Qué producto necesitas?\n\n1️⃣ Leche Descremada (litro) - $1.200\n2️⃣ Leche Entera (litro) - $1.200\n3️⃣ Yogurt Natural (500ml) - $800\n4️⃣ Queso (kg) - $8.500\n5️⃣ Mantequilla (kg) - $6.500\n\nResponde con el número:',
    tipo: 'input',
  },
  cantidad: {
    pregunta: 'cantidad', // dinámico
    tipo: 'input',
  },
  despacho: {
    pregunta: '🚚 ¿Cómo quieres recibir tu pedido?\n\n1️⃣ Retiro\n2️⃣ Entrega\n\nResponde con el número:',
    tipo: 'input',
  },
  direccion: {
    pregunta: '📍 ¿A qué dirección entregamos?\nIncluye: calle, número, depto (si aplica), referencia',
    tipo: 'input',
  },
  ciudad: {
    pregunta: 'ciudad', // dinámico
    tipo: 'input',
  },
  pago: {
    pregunta: '💳 ¿Cómo vas a pagar?\n\n1️⃣ Efectivo\n2️⃣ Transferencia\n3️⃣ Cheque\n\nResponde con el número:',
    tipo: 'input',
  },
  confirmacion: {
    pregunta: 'confirmacion', // especial - resumen
    tipo: 'especial',
  },
};

export default function BotPedidosWhatsApp() {
  const [mensajes, setMensajes] = useState([]);
  const [pasoActual, setPasoActual] = useState('cliente');
  const [datosFormulario, setDatosFormulario] = useState({});
  const [input, setInput] = useState('');
  const [escribiendo, setEscribiendo] = useState(false);
  const [errores, setErrores] = useState([]);
  const chatRef = useRef(null);

  // Enviar mensaje del bot
  const enviarBotMessage = useCallback(async (paso) => {
    setEscribiendo(true);

    await new Promise(r => setTimeout(r, 1200));

    let pregunta = FLUJO_PASOS[paso]?.pregunta || '';

    // Preguntas dinámicas
    if (paso === 'cantidad' && datosFormulario.producto) {
      const prod = PRODUCTOS_MOCK.find(p => p.id === datosFormulario.producto);
      pregunta = `📦 ¿Cuántos ${prod?.unidad || ''} de ${prod?.nombre}?\n\n(Máx. disponible: ${prod?.stock || 0})`;
    }

    if (paso === 'ciudad') {
      pregunta = `🏙️ ¿En qué ciudad?\n\n${CIUDADES.map((c, i) => `${i+1}️⃣ ${c}`).join('\n')}\n\nResponde con el número:`;
    }

    if (paso === 'confirmacion') {
      const prod = PRODUCTOS_MOCK.find(p => p.id === datosFormulario.producto);
      const subtotal = (datosFormulario.cantidad || 0) * (prod?.precio || 0);
      const metodo = METODOS_PAGO[parseInt(datosFormulario.pago || 1) - 1];

      pregunta = `📋 **RESUMEN DE TU PEDIDO**\n\n👤 Cliente: ${datosFormulario.cliente}\n📱 Teléfono: +56912345678\n\n🛒 Producto: ${prod?.nombre}\nCantidad: ${datosFormulario.cantidad} ${prod?.unidad}\nPrecio unitario: $${prod?.precio.toLocaleString()}\nSubtotal: $${subtotal.toLocaleString()}\n\n🚚 Despacho: ${datosFormulario.despacho === '1' ? 'RETIRO' : 'ENTREGA'}\n${datosFormulario.despacho === '2' ? `📍 ${datosFormulario.direccion}\n🏙️ ${CIUDADES[parseInt(datosFormulario.ciudad) - 1] || ''}` : 'Nuestro local'}\n\n💳 Pago: ${metodo}\n\n═════════════════════\nTOTAL: $${subtotal.toLocaleString()}\n═════════════════════\n\n¿CONFIRMAS TU PEDIDO? (SI/NO)`;
    }

    setMensajes(prev => [...prev, { tipo: 'bot', texto: pregunta, hora: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) }]);
    setEscribiendo(false);

    setTimeout(() => {
      chatRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [datosFormulario]);

  // Procesar entrada del usuario
  const procesarEntrada = useCallback(async (texto) => {
    setMensajes(prev => [...prev, { tipo: 'usuario', texto, hora: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) }]);

    let nuevosPasos = datosFormulario;
    let nuevosErrores = [];
    let pasoSiguiente = null;

    switch (pasoActual) {
      case 'cliente':
        if (texto.trim().length < 2) {
          nuevosErrores.push('El nombre debe tener al menos 2 caracteres');
        } else {
          nuevosPasos.cliente = texto;
          pasoSiguiente = 'producto';
        }
        break;

      case 'producto':
        const productMap = { '1': 'leche-desc', '2': 'leche-entera', '3': 'yogurt', '4': 'queso', '5': 'mantequilla' };
        if (!productMap[texto]) {
          nuevosErrores.push('Por favor, responde con un número del 1 al 5');
        } else {
          nuevosPasos.producto = productMap[texto];
          pasoSiguiente = 'cantidad';
        }
        break;

      case 'cantidad':
        const qty = parseFloat(texto);
        const prod = PRODUCTOS_MOCK.find(p => p.id === nuevosPasos.producto);
        if (isNaN(qty) || qty <= 0) {
          nuevosErrores.push('Debe ser un número mayor a 0');
        } else if (qty > (prod?.stock || 0)) {
          nuevosErrores.push(`Stock insuficiente. Máximo disponible: ${prod?.stock}`);
        } else {
          nuevosPasos.cantidad = qty;
          pasoSiguiente = 'despacho';
        }
        break;

      case 'despacho':
        if (texto === '1' || texto === '2') {
          nuevosPasos.despacho = texto;
          pasoSiguiente = texto === '1' ? 'pago' : 'direccion';
        } else {
          nuevosErrores.push('Por favor, responde con 1 o 2');
        }
        break;

      case 'direccion':
        if (texto.trim().length < 10) {
          nuevosErrores.push('Dirección muy corta. Incluye calle, número y referencias');
        } else {
          nuevosPasos.direccion = texto;
          pasoSiguiente = 'ciudad';
        }
        break;

      case 'ciudad':
        const cityMap = { '1': '0', '2': '1', '3': '2', '4': '3' };
        if (!cityMap[texto]) {
          nuevosErrores.push('Por favor, responde con un número del 1 al 4');
        } else {
          nuevosPasos.ciudad = (parseInt(cityMap[texto]) + 1).toString();
          pasoSiguiente = 'pago';
        }
        break;

      case 'pago':
        if (texto === '1' || texto === '2' || texto === '3') {
          nuevosPasos.pago = texto;
          pasoSiguiente = 'confirmacion';
        } else {
          nuevosErrores.push('Por favor, responde con 1, 2 o 3');
        }
        break;

      case 'confirmacion':
        if (texto.toUpperCase() === 'SI') {
          setMensajes(prev => [...prev, { tipo: 'sistema', texto: '⏳ Procesando pedido...' }]);

          // Enviar a API
          try {
            const prod = PRODUCTOS_MOCK.find(p => p.id === nuevosPasos.producto);
            const response = await fetch(`${API_BASE_URL}/api/orders/whatsapp/create`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                clientPhone: '+56912345678',
                clientName: nuevosPasos.cliente,
                productId: nuevosPasos.producto,
                productName: prod?.nombre,
                quantity: nuevosPasos.cantidad,
                unitOfMeasure: prod?.unidad,
                deliveryType: nuevosPasos.despacho === '1' ? 'retiro' : 'entrega',
                address: nuevosPasos.direccion,
                city: CIUDADES[parseInt(nuevosPasos.ciudad) - 1],
                reference: nuevosPasos.reference,
                paymentMethod: METODOS_PAGO[parseInt(nuevosPasos.pago) - 1],
                unitPrice: prod?.precio,
              }),
            });

            const result = await response.json();

            if (result.success) {
              setMensajes(prev => [...prev.slice(0, -1), {
                tipo: 'sistema',
                texto: '✅ ¡PEDIDO CONFIRMADO!\n📦 Número: ' + result.orderId.slice(0, 8).toUpperCase() + '\n\nTu pedido está en el sistema. ¡Gracias!'
              }]);
            } else {
              setMensajes(prev => [...prev.slice(0, -1), {
                tipo: 'error',
                texto: '❌ Error al procesar: ' + (result.errors?.join(', ') || 'Error desconocido')
              }]);
            }
          } catch (error) {
            console.error('Error:', error);
            setMensajes(prev => [...prev.slice(0, -1), {
              tipo: 'error',
              texto: '❌ Error de conexión. Por favor, intenta de nuevo.'
            }]);
          }

          pasoSiguiente = null;
        } else if (texto.toUpperCase() === 'NO') {
          setMensajes(prev => [...prev, { tipo: 'sistema', texto: '❌ Pedido cancelado. Si necesitas algo, estoy aquí para ayudarte. 😊' }]);
          pasoSiguiente = null;
        } else {
          nuevosErrores.push('Por favor, responde SI o NO');
        }
        break;

      default:
        nuevosErrores.push('Error en el flujo');
    }

    setErrores(nuevosErrores);
    setDatosFormulario(nuevosPasos);

    if (nuevosErrores.length > 0) {
      setMensajes(prev => [...prev, { tipo: 'error', texto: '❌ ' + nuevosErrores.join('\n'), hora: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) }]);
      // Reintentar mismo paso
    } else if (pasoSiguiente) {
      setPasoActual(pasoSiguiente);
      setTimeout(() => enviarBotMessage(pasoSiguiente), 500);
    }
  }, [pasoActual, datosFormulario, enviarBotMessage]);

  // Enviar mensaje
  const handleSend = () => {
    if (!input.trim()) return;
    procesarEntrada(input);
    setInput('');
  };

  // Iniciar flujo
  useEffect(() => {
    enviarBotMessage('cliente');
  }, []);

  return (
    <div className="h-screen flex bg-[#111827] overflow-hidden">
      {/* Header */}
      <div className="w-full flex flex-col">
        <div className="h-16 bg-[#2D7D46] flex items-center px-4 gap-3">
          <Leaf className="w-5 h-5 text-white" />
          <div className="flex-1">
            <h3 className="text-white font-bold text-sm">Bot de Pedidos — WhakaChile</h3>
            <p className="text-[#A7F3D0] text-xs">Sistema de pedidos estructurado</p>
          </div>
          <PhoneCall className="w-5 h-5 text-white/60" />
        </div>

        {/* Chat */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#ECE5DD]">
          {mensajes.map((msg, i) => (
            <div key={i} className={`flex ${msg.tipo === 'usuario' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              <div className={`max-w-[70%] rounded-lg px-3 py-2 ${
                msg.tipo === 'usuario' ? 'bg-[#DCF8C6] text-gray-800' :
                msg.tipo === 'bot' ? 'bg-white text-gray-800' :
                msg.tipo === 'error' ? 'bg-red-100 text-red-800' :
                'bg-green-100 text-green-800'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{msg.texto}</p>
                <p className="text-xs text-gray-500 mt-1">{msg.hora}</p>
              </div>
            </div>
          ))}
          <div ref={chatRef} />
        </div>

        {/* Input */}
        <div className="h-14 bg-white border-t border-gray-200 flex items-center px-3 gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Escribe tu respuesta..."
            className="flex-1 text-sm outline-none placeholder:text-gray-400"
          />
          <button onClick={handleSend} className="w-10 h-10 rounded-full bg-[#2D7D46] flex items-center justify-center hover:bg-[#236335] transition-colors cursor-pointer">
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
