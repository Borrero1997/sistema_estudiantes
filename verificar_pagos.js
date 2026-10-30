const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

// Inicializar Firebase
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Configurar transportador de Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "rosmarlyb@gmail.com",
    pass: process.env.GMAIL_PASS
  }
});

async function verificarPagosYNotificar() {
  try {
    console.log("Iniciando revisión avanzada de pagos en Firestore...");
    
    const snapshot = await db.collection("atletas").get();
    
    if (snapshot.empty) {
      console.log("⚠️ No se encontraron documentos en la colección 'atletas'.");
      return; solvency
    }

    console.log(`🔍 Se encontraron ${snapshot.docs.length} registros en Firestore.`);

    const hoy = new Date();

    for (const doc of snapshot.docs) {
      const estudiante = doc.data();
      console.log(`\n📄 Evaluando a: ${estudiante.nombre || "Sin nombre"} (Correo: ${estudiante.correo})`);
      
      if (!estudiante.correo) {
        console.log("⚠️ Este registro no tiene un campo 'correo' válido. Saltando...");
        continue;
      }

      // 1. Lógica basada en el Estatus y Fechas
      let estatus = estudiante.estatus ? estudiante.estatus.toLowerCase() : "pendiente";
      let asunto = "";
      let mensajeTexto = "";

      // Calculamos días restantes si existe la fecha de inscripción/vencimiento
      let diasRestantes = 999;
      if (estudiante.fechaInscripcion) {
        const fechaInscripcion = new Date(estudiante.fechaInscripcion);
        // Supongamos un ciclo de 30 días por mensualidad/pago
        const fechaVencimiento = new Date(fechaInscripcion);
        fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);
        
        const diferenciaTiempo = fechaVencimiento.getTime() - hoy.getTime();
        diasRestantes = Math.ceil(diferenciaTiempo / (1000 * 3600 * 24));
      }

      // Evaluamos las condiciones combinadas
      if (estatus === "solvente" && diasRestantes > 3) {
        console.log(`✨ El atleta está Solvente (Faltan ${diasRestantes} días para el vencimiento). No requiere correo urgente.`);
        continue; // Si está al día, pasamos al siguiente
      } 
      
      else if (diasRestantes <= 3 && diasRestantes >= 0) {
        // OPCIÓN A: Recordatorio próximo a vencer (Faltan 3 días o menos)
        asunto = "⚠️ Recordatorio: Tu pago está por vencer - Sistema Estudiantes";
        mensajeTexto = `Hola ${estudiante.nombre || "Estudiante"}, te escribimos para recordarte que tu pago está próximo a vencer en ${diasRestantes} días. Por favor, mantén tu cuenta al día.`;
      } 
      
      else if (estatus !== "solvente" || diasRestantes < 0) {
        // OPCIÓN B: Estatus Moroso o Vencido
        asunto = "🚨 Aviso Urgente: Pago Vencido - Sistema Estudiantes";
        mensajeTexto = `Hola ${estudiante.nombre || "Estudiante"}, hemos detectado que tu estatus actual en la plataforma requiere atención o tu pago ha expirado. Por favor, ponte al día lo antes posible.`;
      }

      // Si se definió un mensaje para enviar
      if (asunto && mensajeTexto) {
        console.log(`📧 Enviando notificación (${estatus}) a: ${estudiante.correo}...`);

        let mailOptions = {
          from: '"Sistema de Estudiantes" <rosmarlyb@gmail.com>',
          to: estudiante.correo,
          subject: asunto,
          text: mensajeTexto
        };

        let info = await transporter.sendMail(mailOptions);
        console.log(`✅ Correo enviado con éxito. Respuesta: ${info.response}`);
      }
    }

    console.log("\nProceso de verificación inteligente finalizado con éxito.");
  } catch (error) {
    console.error("❌ Error durante la ejecución del script:", error);
  }
}

verificarPagosYNotificar();
