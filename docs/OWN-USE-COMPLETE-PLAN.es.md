# Chatbox: edición personal completa

Decisión del proyecto: nuestro fork personal NO es una edición lite. Se mantienen todas las funciones útiles, incluyendo búsqueda, modelos locales, proveedores externos, API, lectura de páginas, código, archivos, MCP, memoria, OCR, GitHub, terminal y sincronización cuando sea posible.

## Primer cambio de esta rama

- Nuevo buscador Free automatic: SearXNG configurado, Bing y DuckDuckGo; cambia automáticamente si falla o devuelve cero resultados.
- Búsqueda gratuita predeterminada en instalaciones nuevas. Las preferencias previas del usuario se respetan; el modo Chatbox AI sigue disponible bajo selección explícita.
- Lector de páginas públicas basado en Mozilla Readability local, sin créditos Chatbox.
- Se conserva el buscador de pago, Tavily y otros proveedores; no se elimina ninguna funcionalidad.
- Caché separado por proveedor/instancia SearXNG. Pruebas agregadas de errores, fallback, URL y extracción.

## Arquitectura de destino

Chatbox Android/escritorio -> 9router-go -> modelos locales / APIs gratuitas verificadas / suscripciones compatibles.

## Pendientes antes de declarar estable

1. Ejecutar pruebas TypeScript/Vitest y construir APK Android.
2. Probar con HONOR 200 (12 GB físicos + 12 GB extendidos), especialmente búsqueda nativa y lectura de enlaces.
3. Mejorar protección contra redirecciones a redes privadas y respuestas HTML muy grandes.
4. Añadir registro de búsqueda y coste, lectura PDF, permisos por herramientas, respaldo y pruebas de modelos locales.
5. Verificar rutas 9router-go con inferencia real, no solo disponibilidad anunciada.

## Registro de atribución

- Objetivo, necesidades y decisión de edición completa: propietario del proyecto.
- Revisión del código y propuesta del cambio de búsqueda: OpenAI GPT-6.
- Pruebas CI y validación física: pendientes hasta ejecución con resultados.
- Mantener derechos GPLv3 y atribuciones de upstream.
