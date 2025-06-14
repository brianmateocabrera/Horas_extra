// ===========================
// ELEMENTOS DEL DOM
// ===========================
const inicio = document.getElementById("periodo-inicio");
const fin = document.getElementById("periodo-fin");
const tbody = document.querySelector("tbody.card-body");
const totalPeriodoEl = document.getElementById("total-periodo");
const horasContratoInput = document.getElementById("horas-contrato");
const horasExtraEl = document.getElementById("horas-extra");
const inputEmpleado = document.getElementById("nombre-empleado");

// ===========================
// EVENTOS PRINCIPALES
// ===========================

// Al cambiar la fecha de inicio
inicio.addEventListener("change", () => {
    guardarPeriodoEnLS();
    generarFilas(); // Regenerar la tabla
});

// Al cambiar la fecha de fin
fin.addEventListener("change", () => {
    guardarPeriodoEnLS();
    generarFilas(); // Regenerar la tabla
});

// Cuando cambia el valor de horas de contrato
horasContratoInput.addEventListener("input", () => {
    const data = obtenerDatosLS();
    data.horas_contrato = parseInt(horasContratoInput.value, 10) || 0;
    guardarDatosLS(data);
    calcularTotales(); // Recalcula totales con nuevas horas
});

// Cuando se escribe el nombre del empleado
inputEmpleado.addEventListener("input", () => {
    const data = obtenerDatosLS();
    data.empleado = inputEmpleado.value;
    guardarDatosLS(data);
});

// ===========================
// INICIALIZACIÓN EN CARGA
// ===========================
document.addEventListener("DOMContentLoaded", () => {
    const data = obtenerDatosLS();

    // Restaurar campos desde localStorage
    inputEmpleado.value = data.empleado || "";
    horasContratoInput.value = data.horas_contrato || "";

    if (data.periodo?.inicio) inicio.value = data.periodo.inicio;
    if (data.periodo?.fin) fin.value = data.periodo.fin;

    // Si hay un período válido, generar tabla
    if (inicio.value && fin.value) {
        generarFilas();
    }

    ajustarMargenes();
});

// ===========================
// FUNCIONES DE LOCALSTORAGE
// ===========================

// Obtiene los datos del localStorage (o valores por defecto)
function obtenerDatosLS() {
    const datos = localStorage.getItem("registro-empleado");
    return datos
        ? JSON.parse(datos)
        : { empleado: "", horas_contrato: 0, registro: {}, periodo: {} };
}

// Guarda los datos en localStorage
function guardarDatosLS(data) {
    localStorage.setItem("registro-empleado", JSON.stringify(data));
}

// Guarda el período (inicio y fin) en localStorage
function guardarPeriodoEnLS() {
    const data = obtenerDatosLS();
    data.periodo = {
        inicio: inicio.value,
        fin: fin.value
    };
    guardarDatosLS(data);
}

// Actualiza el registro de un día específico
function actualizarRegistro(fecha, entrada, salida, notas) {
    const data = obtenerDatosLS();
    data.registro[fecha] = { entrada, salida, notas };
    guardarDatosLS(data);
}

// ===========================
// FUNCIONES DE TABLA
// ===========================

// Genera las filas de la tabla según el período
function generarFilas() {
    const fechaInicio = new Date(inicio.value);
    const fechaFin = new Date(fin.value);
    const data = obtenerDatosLS();

    // Validación de fechas
    if (
        isNaN(fechaInicio.getTime()) ||
        isNaN(fechaFin.getTime()) ||
        fechaFin < fechaInicio
    ) {
        tbody.innerHTML = "";
        return;
    }

    tbody.innerHTML = ""; // Limpiar tabla

    // Generar una fila por cada día
    for (
        let d = new Date(fechaInicio);
        d <= fechaFin;
        d.setDate(d.getDate() + 1)
    ) {
        const fechaStr = d.toISOString().split("T")[0];
        const datosDia = data.registro[fechaStr] || {
            entrada: "",
            salida: "",
            notas: ""
        };

        // Crear fila
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${fechaStr}</td>
            <td><input type="time" name="entrada" value="${datosDia.entrada}" /></td>
            <td><input type="time" name="salida" value="${datosDia.salida}" /></td>
            <td><span class="total-dia">00:00</span></td>
            <td><input type="text" name="notas" value="${datosDia.notas}" /></td>
        `;

        // Inputs individuales
        const entrada = tr.querySelector('input[name="entrada"]');
        const salida = tr.querySelector('input[name="salida"]');
        const notas = tr.querySelector('input[name="notas"]');

        // Eventos por campo
        entrada.addEventListener("input", () => {
            actualizarRegistro(
                fechaStr,
                entrada.value,
                salida.value,
                notas.value
            );
            calcularDia(tr);
        });

        salida.addEventListener("input", () => {
            actualizarRegistro(
                fechaStr,
                entrada.value,
                salida.value,
                notas.value
            );
            calcularDia(tr);
        });

        notas.addEventListener("input", () => {
            actualizarRegistro(
                fechaStr,
                entrada.value,
                salida.value,
                notas.value
            );
        });

        // Agregar fila y calcular si ya hay datos guardados
        tbody.appendChild(tr);
        calcularDia(tr);
    }

    calcularTotales(); // Calcular totales al terminar
}

// ===========================
// CÁLCULOS DE HORAS
// ===========================

// Calcula el total de horas de una fila
function calcularDia(tr) {
    const entrada = tr.querySelector('input[name="entrada"]').value;
    const salida = tr.querySelector('input[name="salida"]').value;
    const totalSpan = tr.querySelector(".total-dia");

    if (!entrada || !salida) {
        totalSpan.textContent = "00:00";
        calcularTotales();
        return;
    }

    // Convertir a minutos desde la medianoche
    const [h1, m1] = entrada.split(":").map(Number);
    const [h2, m2] = salida.split(":").map(Number);

    let t1 = h1 * 60 + m1;
    let t2 = h2 * 60 + m2;

    // Si la salida es después de medianoche (turno nocturno)
    if (t2 < t1) t2 += 24 * 60;

    const diffMin = t2 - t1;
    const horas = String(Math.floor(diffMin / 60)).padStart(2, "0");
    const minutos = String(diffMin % 60).padStart(2, "0");

    totalSpan.textContent = `${horas}:${minutos}`;
    calcularTotales();
}

// Calcula el total de horas trabajadas y horas extra
function calcularTotales() {
    let totalMinutos = 0;

    document.querySelectorAll(".total-dia").forEach(el => {
        const [h, m] = el.textContent.split(":").map(Number);
        totalMinutos += h * 60 + m;
    });

    const horas = String(Math.floor(totalMinutos / 60)).padStart(2, "0");
    const minutos = String(totalMinutos % 60).padStart(2, "0");
    totalPeriodoEl.textContent = `${horas}:${minutos}`;

    const contrato = parseInt(horasContratoInput.value, 10);
    if (!isNaN(contrato)) {
        const contratoMin = contrato * 60;
        const extraMin = Math.max(0, totalMinutos - contratoMin);
        const extraH = String(Math.floor(extraMin / 60)).padStart(2, "0");
        const extraM = String(extraMin % 60).padStart(2, "0");
        horasExtraEl.textContent = `${extraH}:${extraM}`;
    } else {
        horasExtraEl.textContent = "00:00";
    }
}

// ===========================
// DISEÑO RESPONSIVO (AJUSTE DE MÁRGENES)
// ===========================

function ajustarMargenes() {
    const cardTop = document.getElementById("card-top");
    const cardBottom = document.getElementById("card-bottom");
    const cardMiddle = document.getElementById("card-middle");

    const alturaTop = cardTop.offsetHeight;
    const alturaBottom = cardBottom.offsetHeight;

    cardMiddle.style.marginTop = `${alturaTop}px`;
    cardMiddle.style.marginBottom = `${alturaBottom}px`;
    cardMiddle.style.height = `calc(100vh - ${alturaTop + alturaBottom}px)`;
}

window.addEventListener("resize", ajustarMargenes);

// ===========================
// DEPURACIÓN OPCIONAL
// ===========================

// Muestra el estado actual del JSON guardado (para depuración)
function mostrarEstadoActual() {
    const data = obtenerDatosLS();
    console.log("Estado actual del JSON:", JSON.stringify(data, null, 2));
}

// ===========================
// ESCALADO Y CAPTURA AUTOMÁTICA 
// ===========================
document.getElementById("captura-btn").addEventListener("click", async () => {
    const contenido = document.body; // Captura todo: header, main y footer

    // 1. Calcular escala para que entre en pantalla
    const escala = calcularEscalaParaEncajar(contenido);

    // 2. Guardar estilos originales
    const estiloOriginal = {
        transform: contenido.style.transform,
        transformOrigin: contenido.style.transformOrigin,
        overflow: document.body.style.overflow,
    };

    // 3. Aplicar escalado visual
    contenido.style.transformOrigin = "top left";
    contenido.style.transform = `scale(${escala})`;
    document.body.style.overflow = "hidden";

    // 4. Esperar un instante para que el render refleje los cambios
    await new Promise(resolve => setTimeout(resolve, 300));

    // 5. Captura con html2canvas
    html2canvas(contenido, {
        scale: 2, // resolución mejorada
        useCORS: true
    }).then(canvas => {
        // 6. Descargar imagen como PNG
        const enlace = document.createElement("a");
        enlace.download = "captura-registro.png";
        enlace.href = canvas.toDataURL("image/png");
        enlace.click();

        // 7. Restaurar estilo original
        contenido.style.transform = estiloOriginal.transform;
        contenido.style.transformOrigin = estiloOriginal.transformOrigin;
        document.body.style.overflow = estiloOriginal.overflow;
    });
});

// Función auxiliar para calcular la escala
function calcularEscalaParaEncajar(elemento) {
    const anchoPantalla = window.innerWidth;
    const altoPantalla = window.innerHeight;
    const anchoContenido = elemento.scrollWidth;
    const altoContenido = elemento.scrollHeight;

    const escalaX = anchoPantalla / anchoContenido;
    const escalaY = altoPantalla / altoContenido;

    return Math.min(escalaX, escalaY, 1); // Nunca escalar más allá de 100%
}
