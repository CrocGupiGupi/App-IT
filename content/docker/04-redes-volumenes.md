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

- En la red `bridge` por defecto los contenedores se ven por IP, **no por nombre**.
- En una red **definida por el usuario** hay **DNS interno**: un contenedor resuelve a otro por su nombre. Además aísla mejor.

```bash
docker network create backend
docker run -d --name db --network backend postgres:16
docker run -d --name api --network backend -p 8080:8080 miapi
# desde "api" se accede a la base de datos como db:5432
docker network ls
docker network inspect backend
docker network connect backend otro
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
docker run -d -v datos:/var/lib/postgresql/data postgres:16     # volumen
docker run -d -v "$PWD":/app node:22 ...                        # bind mount
docker run -d --mount type=bind,source="$PWD",target=/app,readonly node:22
docker run -d --tmpfs /tmp alpine
docker volume ls
docker volume inspect datos
```

- `--mount` es más explícito y detallado que `-v`; con bind mount, si la ruta no existe `--mount` da error y `-v` la crea.
- Un volumen vacío se **inicializa con el contenido** que la imagen tenga en esa ruta; un bind mount **oculta** lo que hubiera.
- Los volúmenes sobreviven al borrado del contenedor. Para eliminarlos: `docker rm -v` o `docker volume rm`.

### Copia de seguridad de un volumen

```bash
docker run --rm -v datos:/origen -v "$PWD":/copia alpine \
  tar czf /copia/datos.tgz -C /origen .
```

## Drivers de volumen

Permiten almacenamiento remoto (NFS, almacenamiento cloud) mediante plugins, y `docker volume create --driver local --opt type=nfs ...` para NFS.
