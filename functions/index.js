const {onSchedule} = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
admin.initializeApp();

// Función programada para ejecutarse todos los días a las 8:00 AM
exports.enviarAlertasCobro = onSchedule("0 8 * * *", async (event) => {
    const db = admin.firestore();
    const hoy = new Date();

    try {
        // Consultamos la colección "atletas" en tu Firestore
        const snapshot = await db.collection("atletas").get();
        
        snapshot.forEach(doc => {
            const atleta = doc.data();
            if (!atleta.fechaInscripcion || !atleta.correo) return;

            // Calcular fecha de vencimiento (30 días después de la inscripción)
            const inscripcion = new Date(atleta.fechaInscripcion);
            const vencimiento = new Date(inscripcion);
            vencimiento.setDate(vencimiento.getDate() + 30);

            // Si la fecha actual es mayor o igual al vencimiento, disparamos la alerta
            if (hoy >= vencimiento) {
                console.log(`⚠️ Alerta de pago: El atleta ${atleta.nombre} (${atleta.correo}) tiene su pago vencido.`);
                // Aquí más adelante añadiremos el servicio para enviar el correo real.
            }
        });

        console.log("Revisión diaria de pagos completada con éxito.");
    } catch (error) {
        console.error("Error al revisar los pagos en la base de datos:", error);
    }
});
