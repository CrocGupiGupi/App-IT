# Docker Compose

**Compose** define y ejecuta aplicaciones multicontenedor con un único fichero YAML (`compose.yaml`). Hoy se usa como plugin de Docker: `docker compose` (la versión actual es la 5). El campo `version:` es obsoleto: si lo pones, Compose muestra un aviso y valida igualmente con el esquema más reciente.

## Laboratorio: Compose, red interna y datos persistentes

Usa una terminal Bash, Docker con el plugin Compose, acceso al registro de imágenes y el puerto local 8080 libre. Crea un directorio de trabajo nuevo y ejecuta desde él todos los pasos. La contraseña es exclusiva del laboratorio. El sitio de prueba es estático. La conexión de red a PostgreSQL se comprueba por separado con `psql`.

```bash
mkdir -p web
printf 'FROM nginx:1.27\nCOPY index.html /usr/share/nginx/html/index.html\n' > web/Dockerfile
printf '%s\n' 'Estudio IT: laboratorio Compose' > web/index.html
printf '%s\n' 'DB_PASSWORD=solo-laboratorio' > .env
```

Guarda el siguiente YAML como `compose.yaml`.

```yaml
services:
  web:
    build: ./web
    ports:
      - "127.0.0.1:8080:80"
    environment:
      DATABASE_URL: postgres://app:${DB_PASSWORD:?Define DB_PASSWORD en .env}@db:5432/app
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    networks: [frontend, backend]

  db:
    image: postgres:16
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: ${DB_PASSWORD:?Define DB_PASSWORD en .env}
      POSTGRES_DB: app
    volumes:
      - dbdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -h 127.0.0.1 -U app -d app"]
      interval: 5s
      retries: 10
    networks: [backend]

volumes:
  dbdata:

networks:
  frontend:
  backend:
```

### Ejecutar, comprobar y limpiar

```bash
docker compose config --quiet
docker compose up -d --build --wait
curl -fsS http://127.0.0.1:8080/
docker compose exec -T -e PGPASSWORD=solo-laboratorio db psql -h db -U app -d app -v ON_ERROR_STOP=1 -c "CREATE TABLE IF NOT EXISTS prueba (id integer PRIMARY KEY); INSERT INTO prueba VALUES (1) ON CONFLICT DO NOTHING;"
docker compose down
docker compose up -d --wait
docker compose exec -T -e PGPASSWORD=solo-laboratorio db psql -h db -U app -d app -c "SELECT * FROM prueba;"
```

La respuesta HTTP contiene el texto del sitio y la consulta devuelve la fila `1` tras recrear los contenedores. Si falla, revisa `docker compose ps -a` y `docker compose logs db web`. Al acabar, desde el directorio del laboratorio, ejecuta `docker compose down -v` para borrar también su volumen de prueba.

## Comandos

```bash
docker compose up -d             # crea y arranca (construye si hace falta)
docker compose up -d --build     # fuerza reconstrucción
docker compose ps
docker compose logs -f web
docker compose exec web sh
docker compose stop / start / restart
docker compose down              # para y elimina contenedores y redes
docker compose down -v           # además elimina los volúmenes
docker compose config            # valida y muestra el fichero resuelto
docker compose pull
docker compose run --rm web npm test
```

## Conceptos

- **Servicios**: cada entrada de `services` se convierte en uno o varios contenedores.
- **Red por defecto**: Compose crea una red para el proyecto, y los servicios se resuelven **por nombre de servicio** (`db`).
- **Nombre de proyecto**: por defecto, el nombre de la carpeta; prefija recursos. Se cambia con `-p` o `name:`.
- **`depends_on`** solo ordena el arranque; para esperar a que el servicio esté *listo* hay que usar `condition: service_healthy` con un `healthcheck`.
- **Variables**: `${VAR}` se toma del entorno o de un fichero `.env` junto al compose. `env_file:` carga ficheros para el contenedor. No guardes secretos en el repositorio.
- **`profiles`**: activan servicios opcionales (`docker compose --profile debug up`).
- **Escalado**: `docker compose up -d --scale web=3` (sin `ports` fijos que colisionen).

## Varios ficheros

`compose.yaml` + `compose.override.yaml` se combinan automáticamente (útil para desarrollo). Para otros entornos:

```bash
docker compose -f compose.yaml -f compose.prod.yaml up -d
```

## Desarrollo con recarga

```yaml
services:
  web:
    build: .
    volumes:
      - ./src:/app/src      # bind mount del código
    develop:
      watch:
        - action: sync
          path: ./src
          target: /app/src
```

`docker compose watch` sincroniza cambios automáticamente.

## Límites

Compose es ideal para desarrollo, pruebas y despliegues pequeños en un host. Para alta disponibilidad entre varios nodos se usa Swarm o, sobre todo, **Kubernetes**.

## Fuentes

- [Documentación oficial de referencia](https://docs.docker.com/compose/)
- [Interpolación y fichero .env](https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/)
