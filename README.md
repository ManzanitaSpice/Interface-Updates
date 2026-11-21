# Interface Updates

Repositorio público para la página de novedades de INTERFACE.

La página borrador enumera los releases publicados en [`ManzanitaSpice/Interface-2`](https://github.com/ManzanitaSpice/Interface-2), sus notas y los archivos adjuntos. No muestra commits individuales y todavía no define el diseño visual final.

## Feed público

Cuando GitHub Pages esté habilitado, el feed estará en:

`https://manzanitaspice.github.io/Interface-Updates/data/releases.json`

El feed conserva las notas como Markdown y normaliza los datos del API de releases de GitHub para que la futura interfaz no dependa de la respuesta cruda de GitHub.

## Actualización

GitHub Actions genera y publica la página al subir cambios a `main`, cada hora y cuando se ejecuta manualmente `Publish updates site` desde la pestaña **Actions**. La lectura del repositorio fuente es pública y no requiere secretos.

En la configuración del repositorio, GitHub Pages debe usar **GitHub Actions** como fuente de publicación.
