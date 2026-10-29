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
    console.log("Iniciando revisión de pagos en Firestore...");
    
    const snapshot = await db.collection("atletas").get();
    
    if (snapshot.empty) {
      console.log("⚠️ No se encontraron documentos en la colección 'atletas'.");
      return;
    }

    console.log(`🔍 Se encontraron ${snapshot.docs.length} registros en Firestore.`);

    for (const doc of snapshot.docs) {
      const estudiante = doc.data();
      console.log("📄 Datos del registro encontrado:", estudiante);
      
      // Verificamos que tenga la propiedad email
      if (estudiante.email) {
        console.log(`📧 Intentando enviar correo a: ${estudiante.email}...`);

        let mailOptions = {
          from: '"Sistema de Estudiantes" <rosmarlyb@gmail.com>',
          to: estudiante.email,
          subject: "🔔 Recordatorio de Pago - Sistema Estudiantes",
          text: `Hola ${estudiante.nombre || "Estudiante"}, te escribimos para recordarte el estado de tu pago en la plataforma.`
        };

        let info = await transporter.sendMail(mailOptions);
        console.log(`✅ Correo enviado con éxito a ${estudiante.email}. Respuesta del servidor: ${info.response}`);
      } else {
        console.log("⚠️ El documento existe en Firestore pero NO tiene un campo 'email' o está escrito diferente.");
      }
    }

    console.log("Proceso de verificación y correos finalizado con éxito.");
  } catch (error) {
    console.error("❌ Error durante la ejecución del script:", error);
  }
}

verificarPagosYNotificar();