# Estudio IT

PWA estática para estudiar y preparar certificaciones de **Docker, Kubernetes, Azure, AWS y Linux**. Sin backend ni paso de compilación: HTML + CSS + JS puro. Funciona en PC, móvil y tablet, se puede instalar y sigue funcionando sin conexión.

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
   - `course.json` (copia el de otro campo: `id`, `title`, `description`, `certs`, `certsNote`, `note`, `lessons`; `related` es opcional).
   - Cada entrada de `certs` lleva `code`, `name`, `price`, `format` y `url`; `info` es opcional. Aparece en el campo y en **Certificaciones y precios**.
   - Una lección `.md` por entrada de `lessons` (campo `file`).
   - `quiz.json`: `{ "id-de-leccion": [ { "q", "options", "answer", "explain" } ] }`. `answer` es un índice, o un array de índices para respuesta múltiple.
2. Añade `"terraform"` a `content/fields.json`.

No hay que tocar código.

## Formato Markdown admitido

Títulos `#`–`####`, párrafos, **negrita**, *cursiva*, `código`, enlaces, listas (con un nivel de anidado), tablas, citas `>`, reglas `---` y bloques de código con ``` (sin resaltado de sintaxis).

## Funciones de estudio

- Test de una pregunta por pantalla al final de cada lección, con la respuesta al momento.
- **Repaso aleatorio** (10 preguntas) y **simulacro cronometrado** (hasta 20 preguntas, 90 s por pregunta), que corrige al terminar e indica qué lecciones repasar.
- **Buscador** en el menú lateral sobre el texto de todas las lecciones.
- **Certificaciones y precios**: enlace oficial, precio, formato e idioma de cada examen. Los precios son orientativos y llevan fecha de consulta.
- Inicio con la siguiente lección, lecciones completadas, días seguidos, acierto en los tests y lecciones que conviene repasar.

## Diseño

Cada campo es una línea de metro y cada lección, una parada. Las líneas toman su color de `--l0` a `--l5` en `styles.css`, según su orden en `content/fields.json`, y su distintivo son las dos primeras letras del `id`. El tema puede ser automático, claro u oscuro, y se elige en el menú lateral.

La tipografía es [Overpass](https://github.com/RedHatOfficial/Overpass), incluida en `fonts/` bajo licencia SIL OFL 1.1 (`fonts/OFL.txt`).

## Datos del usuario

El progreso (lecciones completadas, notas de los tests y días de estudio) se guarda en `localStorage` del navegador: es local a cada dispositivo. Para pasarlo de un dispositivo a otro, usa **Copia de tu progreso** en la página de inicio.
