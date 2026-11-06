# Imágenes y Dockerfile

Un **Dockerfile** es la receta para construir una imagen. Cada instrucción que modifica el sistema de ficheros crea una **capa**.

## Instrucciones principales

| Instrucción | Uso |
|---|---|
| `FROM` | Imagen base (`FROM node:22-alpine`); `FROM scratch` parte de vacío |
| `WORKDIR` | Directorio de trabajo |
| `COPY` | Copia ficheros del contexto de build |
| `ADD` | Como `COPY`, pero además descomprime tar y admite URL (prefiere `COPY`) |
| `RUN` | Ejecuta un comando durante el build |
| `ENV` | Variable de entorno que persiste en la imagen y en ejecución |
| `ARG` | Variable solo durante el build |
| `EXPOSE` | Documenta el puerto (no lo publica) |
| `USER` | Usuario con el que corre lo siguiente |
| `ENTRYPOINT` | Ejecutable fijo del contenedor |
| `CMD` | Argumentos o comando por defecto (se puede sobrescribir) |
| `HEALTHCHECK` | Comprobación de salud |
| `VOLUME`, `LABEL`, `STOPSIGNAL` | Volumen anónimo, metadatos, señal de parada |

## ENTRYPOINT frente a CMD

- Con ambos, `CMD` aporta los **argumentos por defecto** de `ENTRYPOINT`.
- `docker run imagen args` sustituye a `CMD`; para cambiar `ENTRYPOINT` hay que usar `--entrypoint`.
- **Forma exec** `["nginx","-g","daemon off;"]`: el proceso es PID 1 y recibe señales. **Forma shell** `nginx -g ...`: se ejecuta bajo `/bin/sh -c` y las señales pueden no llegar. Prefiere la forma exec.

## Ejemplo: aplicación Node.js

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
USER node
EXPOSE 3000
HEALTHCHECK CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "server.js"]
```

```bash
docker build -t miapp:1.0 .
docker run -d -p 3000:3000 miapp:1.0
```

## Caché de capas

Docker reutiliza una capa si la instrucción y todo lo anterior no han cambiado. Por eso se copian primero los ficheros de dependencias (`package*.json`) y se instalan, y **después** el código, que cambia más a menudo.

Combina comandos relacionados para reducir capas y limpia en la misma instrucción:

```dockerfile
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
```

## .dockerignore

Excluye del contexto de build lo que no debe entrar: `.git`, `node_modules`, `.env`, logs. Acelera el build y evita filtrar secretos.

## Multi-stage builds

Compila en una etapa y copia solo el resultado a una imagen final pequeña.

```dockerfile
FROM golang:1.23 AS build
WORKDIR /src
COPY . .
RUN CGO_ENABLED=0 go build -o /app ./cmd/server

FROM gcr.io/distroless/static-debian12
COPY --from=build /app /app
USER nonroot
ENTRYPOINT ["/app"]
```

Resultado: imagen de pocos MB, sin compilador ni herramientas, con menor superficie de ataque.

## BuildKit y buildx

BuildKit es el motor de build moderno (paralelo, caché mejor, secretos de build). Con `buildx` se construyen imágenes **multiarquitectura**:

```bash
docker buildx build --platform linux/amd64,linux/arm64 -t usuario/app:1.0 --push .
```

Secretos en build sin dejarlos en la imagen:

```dockerfile
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci
```

## Etiquetado

- Evita depender de `latest`: no es una versión, solo una etiqueta por defecto.
- Fija versiones (`node:22.11-alpine`) o, para máxima reproducibilidad, el digest.

## Fuentes

- [Documentación oficial de referencia](https://docs.docker.com/reference/dockerfile/)
