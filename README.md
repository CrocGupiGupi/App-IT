# Estudio IT

PWA estática para estudiar y preparar certificaciones de **Docker, Kubernetes, Azure y AWS**. Sin backend ni paso de compilación: HTML + CSS + JS puro. Funciona en PC, móvil y tablet, se puede instalar y sigue funcionando sin conexión.

## Probar en local

```bash
python -m http.server 8000
# abrir http://localhost:8000
```

(Hace falta un servidor; abrir `index.html` con doble clic no permite cargar el contenido.)

## Publicar en GitHub Pages

1. Sube el contenido de esta carpeta a un repositorio.
2. *Settings → Pages → Build and deployment → Deploy from a branch* → rama `main`, carpeta `/ (root)`.
3. Todas las rutas son relativas, así que funciona en `https://usuario.github.io/repo/`.
4. Al cambiar contenido, sube el número de `V` en `sw.js` para que los dispositivos renueven la caché.

## Añadir un campo nuevo (p. ej. Terraform)

1. Crea `content/terraform/` con:
   - `course.json` (copia el de otro campo: `id`, `title`, `icon`, `description`, `certs`, `note`, `lessons`).
   - Una lección `.md` por entrada de `lessons` (campo `file`).
   - `quiz.json`: `{ "id-de-leccion": [ { "q", "options", "answer", "explain" } ] }`. `answer` es un índice, o un array de índices para respuesta múltiple.
2. Añade `"terraform"` a `content/fields.json`.

No hay que tocar código.

## Formato Markdown admitido

Títulos `#`–`####`, párrafos, **negrita**, *cursiva*, `código`, enlaces, listas (con un nivel de anidado), tablas, citas `>`, reglas `---` y bloques de código con ``` (sin resaltado de sintaxis).

## Funciones de estudio

- Test al final de cada lección, **repaso aleatorio** (10 preguntas) y **simulacro cronometrado** (hasta 20 preguntas, 90 s por pregunta) que al terminar indica qué lecciones repasar.
- **Buscador** en el menú lateral sobre el texto de todas las lecciones.

## Datos del usuario

El progreso (lecciones completadas y notas de los tests) se guarda en `localStorage` del navegador: es local a cada dispositivo. Para pasarlo de un dispositivo a otro, usa **Exportar / Importar progreso** en la página de inicio.
