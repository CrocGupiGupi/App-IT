# Redes y almacenamiento

## Redes

| Driver | Descripción |
|---|---|
| `bridge` | Por defecto en un solo host. Red privada interna con NAT |
| `host` | El contenedor usa directamente la red del host (sin aislamiento de red) |
| `none` | Sin red |
| `overlay` | Conecta contenedores de varios hosts (Swarm) |
| `macvlan` | El contenedor tiene su propia MAC/IP en la red física |

### Bridge por defecto frente a bridge definida por el usuario

- En la red `bridge` por defecto los contenedores se ven por IP, **no por nombre**. La alternativa antigua, `--link`, está obsoleta y se eliminará de esta red en Docker 30.
- En una red **definida por el usuario** hay **DNS interno**: un contenedor resuelve a otro por su nombre o alias (no por los nombres generados automáticamente). Además aísla mejor y permite conectar y desconectar contenedores en caliente.

```bash
docker network create backend
docker run -d --name db --network backend -e POSTGRES_PASSWORD=solo-laboratorio postgres:16
docker exec db pg_isready -U postgres
# Repite la comprobación hasta que acepte conexiones.
docker run --rm --network backend postgres:16 pg_isready -h db -U postgres
docker network ls
docker network inspect backend
docker rm -f db
docker network rm backend
```

### Publicar puertos

`-p 8080:80` mapea el puerto 8080 del host al 80 del contenedor. `-P` publica los puertos `EXPOSE` en puertos altos aleatorios. `-p 127.0.0.1:8080:80` restringe el acceso a localhost. Solo lo publicado es accesible desde fuera del host.

## Persistencia de datos

La capa de escritura del contenedor **se pierde al borrarlo**. Para persistir hay tres opciones:

| Tipo | Gestión | Uso típico |
|---|---|---|
| **Volumen** | Lo gestiona Docker (`/var/lib/docker/volumes`) | Bases de datos, datos de producción. Recomendado |
| **Bind mount** | Ruta concreta del host | Desarrollo (código en vivo), configuración |
| **tmpfs** | Memoria RAM | Datos temporales o sensibles que no deben tocar disco |

```bash
docker volume create datos
docker run -d --name db-datos -e POSTGRES_PASSWORD=solo-laboratorio -v datos:/var/lib/postgresql/data postgres:16
# Repite esta comprobación hasta que acepte conexiones.
docker exec db-datos pg_isready -U postgres
docker run --rm -v "$PWD":/app node:22 ls /app                 # bind mount
docker run --rm --mount type=bind,source="$PWD",target=/app,readonly node:22 ls /app
docker run --rm --tmpfs /tmp alpine df -h /tmp
docker volume ls
docker volume inspect datos
```

- `--mount` es más explícito y detallado que `-v`; con bind mount, si la ruta no existe `--mount` da error y `-v` la crea.
- Un volumen vacío se **inicializa con el contenido** que la imagen tenga en esa ruta; un bind mount **oculta** lo que hubiera.
- Los volúmenes sobreviven al borrado del contenedor. `docker rm -v` elimina solo los **anónimos** asociados; los volúmenes con nombre se borran con `docker volume rm`.

### Copia de seguridad de un volumen

Para una copia en frío de este ejemplo, detén PostgreSQL antes de copiar su directorio de datos. Usa la contraseña de ejemplo únicamente en el laboratorio y elige un nombre de volumen nuevo si `datos` ya existe.

```bash
docker stop db-datos
docker run --rm -v datos:/origen:ro -v "$PWD":/copia alpine \
  tar czf /copia/datos.tgz -C /origen .
docker start db-datos
```

## Drivers de volumen

Permiten almacenamiento remoto (NFS, almacenamiento cloud) mediante plugins, y `docker volume create --driver local --opt type=nfs ...` para NFS.

## Fuentes

- [Documentación oficial de referencia](https://docs.docker.com/engine/storage/volumes/)
- [Imagen oficial de PostgreSQL](https://hub.docker.com/_/postgres#environment-variables)
- [Publicación de puertos](https://docs.docker.com/engine/network/port-publishing/)
