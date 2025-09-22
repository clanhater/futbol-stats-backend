# Futbol Stats API Backend

![Versión](https://img.shields.io/badge/version-1.0.0-blue)
![Licencia](https://img.shields.io/badge/license-MIT-green)
![Estado](https://img.shields.io/badge/status-completo-brightgreen)

Backend de la aplicación de estadísticas de fútbol para grupos de amigos. Este proyecto gestiona jugadores, estadísticas diarias de partidos, un sistema de logros, misiones y una tienda virtual, todo a través de una API RESTful.

## Características Principales

-   **Gestión de Jornadas:** Endpoint de administrador para registrar los resultados diarios (ganados, perdidos, goles, asistencias).
-   **Cálculo Automático:** El sistema actualiza automáticamente los totales de los jugadores y determina el MVP de cada jornada.
-   **Sistema de Gamificación:**
    -   **Logros:** Los jugadores desbloquean medallas permanentes al alcanzar hitos.
    -   **Misiones:** El sistema asigna misiones diarias y semanales.
    -   **Recompensas:** Los jugadores ganan "Puntos de Leyenda" que pueden gastar.
-   **Tienda Virtual:** Un lugar para gastar puntos en ítems cosméticos como avatares y marcos de perfil.
-   **Estadísticas Detalladas:** Endpoints públicos para obtener clasificaciones, perfiles de jugador, historiales de rendimiento y más.
-   **Despliegue Serverless:** Optimizado para un despliegue fácil y gratuito en plataformas como Vercel.

## Stack Tecnológico

-   **Backend:** Node.js, Express.js
-   **Base de Datos:** PostgreSQL (gestionada a través de Supabase)
-   **Despliegue:** Vercel

---

## Configuración del Entorno Local

Para correr este proyecto en tu máquina local, sigue estos pasos:

### 1. Prerrequisitos

-   [Node.js](https://nodejs.org/) (versión LTS recomendada)
-   Una base de datos PostgreSQL. Se recomienda crear un proyecto gratuito en [Supabase](https://supabase.com).

### 2. Clonar el Repositorio

```bash
git clone https://github.com/clanhater/futbol-stats-backend.git
cd futbol-stats-backend
```

### 3. Instalar Dependencias

```bash
npm install
```

### 4. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto y añade las siguientes variables:

```dotenv
# La cadena de conexión de tu base de datos (se recomienda usar el Pooler de Supabase)
DATABASE_URL="postgresql://postgres.xxxxxxxx:[TU_CONTRASEÑA]@aws-region.pooler.supabase.com:6543/postgres"

# Una clave secreta larga y aleatoria para proteger el endpoint de administrador
ADMIN_API_KEY="TU_CLAVE_SECRETA_PERSONALIZADA"

# Puerto en el que correrá el servidor local
PORT=3001
```

### 5. Iniciar el Servidor de Desarrollo

```bash
npm start
# O si tienes nodemon configurado:
npm run dev
```

El servidor estará corriendo en `http://localhost:3001`.

---

## Guía de Uso de la API

La URL base para la API desplegada es: `https://futbol-stats-backend.vercel.app`

### Autenticación (Solo para Admin)

El endpoint de registro de jornadas está protegido. Debes incluir tu clave de administrador en la cabecera de la petición:

-   **Header:** `x-api-key`
-   **Value:** `TU_CLAVE_SECRETA_PERSONALIZADA`

### Endpoints

---

####  Administrador

-   **`POST /api/jornada/registrar`**
    -   **Descripción:** Registra las estadísticas de una jornada completa para múltiples jugadores.
    -   **Autenticación:** Requerida.
    -   **Body (JSON):**
        ```json
        {
          "date": "YYYY-MM-DD",
          "stats": [
            { "player_id": 1, "wins": 5, "losses": 2, "goals": 4, "assists": 3 },
            { "player_id": 2, "wins": 3, "losses": 4, "goals": 2, "assists": 1 }
          ]
        }
        ```

---

#### 👑 Estadísticas Públicas

-   **`GET /api/portada`**
    -   **Descripción:** Obtiene los datos clave para la página de inicio (MVP del último día, Top 3 del ranking, Dato Curioso).

-   **`GET /api/clasificacion`**
    -   **Descripción:** Devuelve la lista completa de jugadores con sus estadísticas totales, ordenados por porcentaje de victorias.

-   **`GET /api/jugadores/:id/perfil`**
    -   **Descripción:** Obtiene todos los datos detallados de un jugador específico, incluyendo su perfil, historial de rendimiento y logros desbloqueados.

---

#### 🏆 Desafíos y Tienda

-   **`GET /api/jugadores/:id/desafios`**
    -   **Descripción:** Devuelve las misiones diarias activas o completadas y los logros desbloqueados para un jugador.

-   **`POST /api/desafio/jugadores/:playerId/reclamar-misiones`**
    -   **Descripción:** Reclama las recompensas de misiones completadas.
    -   **Body (JSON):**
        ```json
        {
          "missionIds":
        }
        ```

-   **`POST /api/desafio/jugadores/:playerId/comprar-item`**
    -   **Descripción:** Compra un ítem de la tienda.
    -   **Body (JSON):**
        ```json
        {
          "itemId": 3
        }
        ```

---

## Contribuir

Las contribuciones son bienvenidas. Por favor, abre un "issue" para discutir cualquier cambio que te gustaría hacer.