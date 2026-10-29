const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

// Inicializar Firebase con el JSON único
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Configurar el transportador de correos usando tu cuenta y el secreto de GitHub
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "tucorreo@gmail.com", // <--- Coloca aquí tu correo personal de Gmail
    pass: process.env.GMAIL_PASS // <--- Toma la contraseña de aplicación de los secretos
  }
});

async function verificarPagosYNotificar() {
  try {
    console.log("Iniciando revisión de pagos en Firestore...");
    
    // Consultamos los estudiantes en Firestore
    const snapshot = await db.collection("escuelaatleta").get();
    
    if (snapshot.empty) {
      console.log("No hay estudiantes registrados.");
      return;
    }

    // Recorremos cada estudiante para revisar y enviar el correo de recordatorio de forma dinámica
    for (const doc of snapshot.docs) {
      const estudiante = doc.data();
      
      // Verificamos que el estudiante tenga un correo registrado
      if (estudiante.email) {
        let mailOptions = {
          from: "tucorreo@gmail.com",
          to: estudiante.email, // <--- ¡Correo dinámico extraído directo de Firestore!
          subject: "🔔 Recordatorio de Pago - Sistema Estudiantes",
          text: `Hola ${estudiante.nombre || "Estudiante"}, te escribimos para recordarte el estado de tu pago en la plataforma.`
        };

        let info = await transporter.sendMail(mailOptions);
        console.log(`Correo enviado a ${estudiante.email}: ${info.response}`);
      }
    }

    console.log("Proceso de verificación y correos finalizado con éxito.");
  } catch (error) {
    console.error("Error en el proceso de verificación de pagos:", error);
  }
}

verificarPagosYNotificar();