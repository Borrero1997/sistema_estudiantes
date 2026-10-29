const admin = require("firebase-admin");

// Inicializamos Firebase usando las credenciales del entorno de GitHub
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
  })
});

const db = admin.firestore();

async function revisarPagos() {
    const hoy = new Date();
    try {
        const snapshot = await db.collection("atletas").get();
        
        snapshot.forEach(doc => {
            const atleta = doc.data();
            if (!atleta.fechaInscripcion || !atleta.correo) return;

            const inscripcion = new Date(atleta.fechaInscripcion);
            const vencimiento = new Date(inscripcion);
            vencimiento.setDate(vencimiento.getDate() + 30);

            if (hoy >= vencimiento) {
                console.log(`⚠️ Alerta de pago: El atleta ${atleta.nombre} (${atleta.correo}) tiene su pago vencido.`);
                // Aquí conectaremos el envío de correo (ej. Nodemailer) más adelante.
            }
        });

        console.log("Revisión diaria completada con éxito en la nube de GitHub.");
    } catch (error) {
        console.error("Error al revisar los pagos:", error);
        process.exit(1);
    }
}

revisarPagos();