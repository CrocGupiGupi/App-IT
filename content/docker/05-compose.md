# Docker Compose

**Compose** define y ejecuta aplicaciones multicontenedor con un único fichero YAML (`compose.yaml`). Hoy se usa como plugin de Docker: `docker compose` (la versión actual es la 5). El campo `version:` es obsoleto: si lo pones, Compose muestra un aviso y valida igualmente con el esquema más reciente.

## Ejemplo completo

```yaml
services:
  web:
    build: ./web
    ports:
      - "8080:80"
    environment:
      DATABASE_URL: postgres://app:${DB_PASSWORD}@db:5432/app
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    networks: [frontend, backend]

  db:
    image: postgres:16
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: app
    volumes:
      - dbdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
      interval: 5s
      retries: 10
    networks: [backend]

volumes:
  dbdata:

networks:
  frontend:
  backend:
```

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
