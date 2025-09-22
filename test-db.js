// test-db.js
const { Pool } = require('pg');
require('dotenv').config();

// Asegurarnos de que la variable de entorno se está leyendo correctamente
console.log("Intentando conectar con DATABASE_URL:", process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Añadimos configuración extra para SSL, que a veces es necesario
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  let client;
  try {
    console.log("Obteniendo cliente del pool...");
    client = await pool.connect();
    console.log("¡Conexión exitosa!");

    console.log("Realizando una consulta de prueba...");
    const result = await client.query('SELECT NOW()'); // Una consulta SQL muy simple
    console.log("Resultado de la consulta:", result.rows[0]);
    
    console.log("¡La prueba de base de datos ha sido un éxito total!");
  } catch (error) {
    console.error("!!!!!!!!!! ERROR DE CONEXIÓN !!!!!!!!!!");
    console.error(error);
  } finally {
    if (client) {
      client.release();
      console.log("Cliente liberado.");
    }
    await pool.end();
    console.log("Pool de conexiones cerrado.");
  }
}

testConnection();