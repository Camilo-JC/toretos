# 🐂 Los Toreto - Sistema de Gestión Premium

Sistema de gestión táctica diseñado para tiendas de barrio de alto volumen, optimizado para el control de fiados, inventario y reportes financieros profesionales.

![Los Toreto PWA](public/icon.png)

## ✨ Características Principales

- **Dashboard Táctico**: Visualización de ingresos diarios, ventas mensuales y "dinero en la calle" con gráficas dinámicas (escala M/k).
- **Gestión de Fiados (Abonos)**: Sistema robusto para registrar pagos parciales y saldar cuentas de clientes.
- **Inventario Inteligente**: Alertas automáticas de stock bajo y control total de productos.
- **Reportes PDF Profesionales**: Generación de informes financieros y facturas con branding oficial de Los Toreto.
- **Seguridad Avanzada**: Protección contra ataques de fuerza bruta (lockout) y autenticación segura con JWT.
- **App Instalable (PWA)**: Se puede instalar en Android y iPhone directamente desde el navegador.

## 🚀 Instalación Local

1.  **Clonar el repositorio**:
    ```bash
    git clone https://github.com/tu-usuario/toretos.git
    cd toretos
    ```

2.  **Instalar dependencias**:
    ```bash
    npm install
    ```

3.  **Configurar base de datos**:
    - Cambia el `provider` en `prisma/schema.prisma` a `sqlite` si deseas probar localmente, o mantén `postgresql` para producción.
    - Crea un archivo `.env` basado en `.env.example`.

4.  **Migrar base de datos**:
    ```bash
    npx prisma migrate dev
    ```

5.  **Iniciar servidor**:
    ```bash
    npm run dev
    ```

## ☁️ Despliegue en la Nube (Vercel + Neon)

Este proyecto está listo para ser desplegado:
1.  **Base de Datos**: Crea un proyecto gratis en [Neon.tech](https://neon.tech) (PostgreSQL).
2.  **Hosting**: Conecta tu repositorio de GitHub a [Vercel](https://vercel.com).
3.  **Variables de Entorno**: Configura `DATABASE_URL` y `JWT_SECRET` en el panel de Vercel.

## 🛠️ Tecnologías

- **Framework**: Next.js 16 (App Router)
- **Base de Datos**: Prisma ORM + PostgreSQL/SQLite
- **Estilo**: CSS Vanilla (Diseño Glassmorphism Premium)
- **Documentos**: jsPDF / autoTable

---

**Desarrollado con ❤️ para Los Toreto.**
