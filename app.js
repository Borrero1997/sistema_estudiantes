// Importa las funciones necesarias de Firebase SDK (versión 10 modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ⚠️ REEMPLAZA ESTO CON TUS DATOS REALES DE FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyApLzOIRxWh9aZdXzPK-bHFUpjvSMtVvPU",
  authDomain: "escuelaatletas.firebaseapp.com",
  projectId: "escuelaatletas",
  storageBucket: "escuelaatletas.firebasestorage.app",
  messagingSenderId: "918394662099",
  appId: "1:918394662099:web:a9cf9f9cd9847410d27826"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const COLECCION_ATLETAS = "atletas";

let listaAtletas = [];
let idAtletaEnEdicion = null;

window.onload = function() {
    cargarDatosFirebase();
};

// 1. Cargar datos desde Firestore
async function cargarDatosFirebase() {
    try {
        const querySnapshot = await getDocs(collection(db, COLECCION_ATLETAS));
        listaAtletas = [];
        querySnapshot.forEach((docSnap) => {
            listaAtletas.push({ id: docSnap.id, ...docSnap.data() });
        });
        actualizarInterfaz(listaAtletas);
    } catch (error) {
        console.error("Error al cargar datos de Firebase:", error);
    }
}

window.procesarFormulario = function() {
    if (idAtletaEnEdicion === null) {
        registrarAtleta();
    } else {
        guardarEdicionAtleta();
    }
}

// 2. Registrar nuevo atleta
async function registrarAtleta() {
    const campos = obtenerCamposFormulario();
    if (!campos) return;

    campos.estatus = "Solvente";
    campos.asistencias = 0;

    try {
        const docRef = await addDoc(collection(db, COLECCION_ATLETAS), campos);
        listaAtletas.push({ id: docRef.id, ...campos });
        cerrarModal();
        actualizarInterfaz(listaAtletas);
    } catch (error) {
        console.error("Error al registrar en Firebase:", error);
    }
}

// 3. Activar Modo Edición (Abre el modal con los datos cargados)
window.activarModoEdicion = async function (id) {
    const atleta = listaAtletas.find(a => a.id === id);
    if (!atleta) return;

    idAtletaEnEdicion = id;
    document.getElementById("cedula").value = atleta.cedula;
    document.getElementById("nombre").value = atleta.nombre;
    document.getElementById("edad").value = atleta.edad;
    document.getElementById("telefono").value = atleta.telefono;
    document.getElementById("deporte").value = atleta.deporte;
    document.getElementById("correo").value = atleta.correo || "";
    document.getElementById("fechaInscripcion").value = atleta.fechaInscripcion || "";

    document.getElementById("tituloModal").innerText = "Editar Ficha de Atleta";
    const btn = document.getElementById("btnGuardar");
    btn.innerText = "Actualizar Atleta";
    btn.classList.add("modo-edicion");

    abrirModal();
}

// 4. Guardar Edición
async function guardarEdicionAtleta() {
    const campos = obtenerCamposFormulario();
    if (!campos) return;

    try {
        const atletaRef = doc(db, COLECCION_ATLETAS, idAtletaEnEdicion);
        await updateDoc(atletaRef, campos);

        const index = listaAtletas.findIndex(a => a.id === idAtletaEnEdicion);
        if (index !== -1) {
            listaAtletas[index] = { id: idAtletaEnEdicion, ...listaAtletas[index], ...campos };
        }

        cerrarModal();
        filtrarAtletas();
    } catch (error) {
        console.error("Error al actualizar:", error);
    }
}

// 5. Alternar Estatus de Pago (Solvente / Moroso)
window.alternarEstatusPago = async function (id) {
    const atleta = listaAtletas.find(a => a.id === id);
    if (!atleta) return;

    const nuevoEstatus = (atleta.estatus === "Solvente") ? "Moroso" : "Solvente";

    try {
        const atletaRef = doc(db, COLECCION_ATLETAS, id);
        await updateDoc(atletaRef, { estatus: nuevoEstatus });

        atleta.estatus = nuevoEstatus;
        if (nuevoEstatus === "Moroso") {
            alert(`⚠️ ATENCIÓN: El alumno "${atleta.nombre}" ha cambiado a estado MOROSO.`);
        }
        filtrarAtletas();
    } catch (error) {
        console.error("Error al cambiar estatus:", error);
    }
}

// 6. Marcar Asistencia (+1)
window.marcarAsistencia = async function(id) {
    const atleta = listaAtletas.find(a => a.id === id);
    if (!atleta) return;

    const nuevasAsistencias = (atleta.asistencias || 0) + 1;

    try {
        const atletaRef = doc(db, COLECCION_ATLETAS, id);
        await updateDoc(atletaRef, { asistencias: nuevasAsistencias });

        atleta.asistencias = nuevasAsistencias;
        filtrarAtletas();
    } catch (error) {
        console.error("Error al registrar asistencia:", error);
    }
}

// 7. Eliminar Atleta
window.eliminarAtleta = async function(id) {
    if (!confirm("¿Estás seguro de eliminar este atleta permanentemente?")) return;

    try {
        await deleteDoc(doc(db, COLECCION_ATLETAS, id));
        listaAtletas = listaAtletas.filter(a => a.id !== id);
        actualizarInterfaz(listaAtletas);
    } catch (error) {
        console.error("Error al eliminar:", error);
    }
}

// 8. Filtrar en tiempo real
function filtrarAtletas() {
    const texto = document.getElementById("buscador").value.toLowerCase();
    const filtrados = listaAtletas.filter(a => 
        a.nombre.toLowerCase().includes(texto) || 
        a.cedula.toLowerCase().includes(texto) ||
        a.deporte.toLowerCase().includes(texto) ||
        (a.estatus && a.estatus.toLowerCase().includes(texto))
    );
    actualizarInterfaz(filtrados);
}

// Validar y obtener campos del formulario con categoría automática
function obtenerCamposFormulario() {
    const cedula = document.getElementById("cedula").value.trim();
    const nombre = document.getElementById("nombre").value.trim();
    const edad = parseInt(document.getElementById("edad").value);
    const telefono = document.getElementById("telefono").value.trim();
    const deporte = document.getElementById("deporte").value;
    const correo = document.getElementById("correo").value.trim();
    const fechaInscripcion = document.getElementById("fechaInscripcion").value;

    if (!cedula || !nombre || !edad || !telefono || !correo || !fechaInscripcion) {
    alert("Por favor, rellena todos los campos.");
    return null;
}

    let categoria = "Senior (Mayor de 18)";
    if (edad < 13) categoria = "Infantil (Menor de 13)";
    else if (edad >= 13 && edad <= 18) categoria = "Juvenil (13 a 18 años)";

    return { cedula, nombre, edad, categoria, telefono, deporte, correo, fechaInscripcion };
}

// Control del Modal Flotante
window.abrirModal = function() {
    document.getElementById("modalRegistro").classList.add("activo");
}

window.cerrarModal = function() {
    document.getElementById("modalRegistro").classList.remove("activo");
    limpiarFormulario();
    idAtletaEnEdicion = null;
    document.getElementById("tituloModal").innerText = "Registrar Nuevo Atleta";
    const btn = document.getElementById("btnGuardar");
    btn.innerText = "Guardar Atleta";
    btn.classList.remove("modo-edicion");
}

function limpiarFormulario() {
    document.getElementById("cedula").value = "";
    document.getElementById("nombre").value = "";
    document.getElementById("edad").value = "";
    document.getElementById("telefono").value = "";
}

// Actualizar Interfaz (Tabla y Contador)
function actualizarInterfaz(listaAMostrar) {
    const tabla = document.getElementById("tablaAtletas");
    tabla.innerHTML = "";

    // <-- AQUÍ LLAMAMOS A LOS CONTADORES PARA QUE SE ACTUALICEN
    actualizarMétricas();

    listaAMostrar.forEach(atleta => {
        const estatus = atleta.estatus || "Solvente";
        const claseEstatus = estatus === "Solvente" ? "badge-solvente" : "badge-moroso";
        const asistencias = atleta.asistencias || 0;

        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td><b>${atleta.cedula}</b></td>
            <td>${atleta.nombre}</td>
            <td>${atleta.edad} <small>(${atleta.categoria})</small></td>
            <td>${atleta.telefono}</td>
            <td>${atleta.deporte}</td>
            <td>
                <button class="${claseEstatus}" onclick="alternarEstatusPago('${atleta.id}')">
                    ${estatus}
                </button>
            </td>
            <td style="text-align: center;"><b>${asistencias}</b></td>
            <td>
                <div class="acciones-cell">
                    <button class="btn-icon" title="Marcar Asistencia" onclick="marcarAsistencia('${atleta.id}')">✔️</button>
                    <button class="btn-icon" title="Editar" onclick="activarModoEdicion('${atleta.id}')">✏️</button>
                    <button class="btn-icon btn-delete" title="Eliminar" onclick="eliminarAtleta('${atleta.id}')">🗑️</button>
                </div>
            </td>
        `;
        tabla.appendChild(fila);
    });
}

// Actualiza las 3 métricas en tiempo real
function actualizarMétricas() {
    const total = listaAtletas.length;
    const solventes = listaAtletas.filter(a => (a.estatus || "Solvente") === "Solvente").length;
    const morosos = listaAtletas.filter(a => a.estatus === "Moroso").length;

    document.getElementById("contadorAtletas").innerText = total;
    document.getElementById("contadorSolventes").innerText = solventes;
    document.getElementById("contadorMorosos").innerText = morosos;
}

// Exportar la nómina a un archivo .CSV (compatible con Excel)
window.exportarExcel = function() {
    if (listaAtletas.length === 0) {
        alert("No hay atletas registrados para exportar.");
        return;
    }

    let contenidoCSV = "data:text/csv;charset=utf-8,\uFEFF"; 
    contenidoCSV += "Cedula,Nombre Completo,Edad,Categoria,Telefono,Deporte,Estatus Pago,Asistencias\n";

    listaAtletas.forEach(a => {
        const estatus = a.estatus || "Solvente";
        const asistencias = a.asistencias || 0;
        const fila = `"${a.cedula}","${a.nombre}",${a.edad},"${a.categoria}","${a.telefono}","${a.deporte}","${estatus}",${asistencias}`;
        contenidoCSV += fila + "\n";
    });

    const encodedUri = encodeURI(contenidoCSV);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Nomina_Atletas_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    
    link.click();
    document.body.removeChild(link);
}


