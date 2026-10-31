# Comandos esenciales y ciclo de vida

## Ejecutar contenedores

```bash
docker run hello-world
docker run -d --name web -p 8080:80 nginx:1.27
docker run -it --rm ubuntu:24.04 bash
docker run -d -e POSTGRES_PASSWORD=secreto -v datos:/var/lib/postgresql/data postgres:16
```

| Opción | Efecto |
|---|---|
| `-d` | Segundo plano (detached) |
| `-it` | Terminal interactiva (`-i` stdin abierto, `-t` pseudo-TTY) |
| `--name` | Nombre del contenedor |
| `-p host:contenedor` | Publica un puerto |
| `-e CLAVE=valor` | Variable de entorno |
| `-v origen:destino` | Monta volumen o carpeta |
| `--rm` | Borra el contenedor al terminar |
| `--restart` | Política: `no`, `on-failure[:n]`, `always`, `unless-stopped` |
| `--memory`, `--cpus` | Límites de recursos |

## Ciclo de vida

Estados: `created` → `running` → `paused` / `exited` → eliminado.

```bash
docker create / start / stop / restart / pause / unpause / kill / rm
docker ps            # en ejecución
docker ps -a         # todos
docker rm -f web     # fuerza el borrado
```

- `docker stop` envía **SIGTERM** y, tras 10 s por defecto, **SIGKILL**.
- `docker kill` envía SIGKILL directamente (o la señal indicada).

## Inspeccionar y depurar

```bash
docker logs -f --tail 100 web
docker exec -it web sh          # shell en un contenedor en marcha
docker inspect web              # JSON con toda la configuración
docker stats                    # consumo en vivo
docker top web                  # procesos
docker cp web:/etc/nginx/nginx.conf .
docker events
```

## Imágenes

```bash
docker pull alpine:3.20
docker images
docker image ls --filter dangling=true
docker tag alpine:3.20 miusuario/alpine:v1
docker rmi alpine:3.20
docker history nginx:1.27       # capas de una imagen
docker save -o img.tar nginx:1.27 / docker load -i img.tar
```

## Limpieza

```bash
docker system df                # uso de disco
docker container prune
docker image prune -a
docker volume prune              # solo volúmenes anónimos sin usar
docker volume prune -a           # también los volúmenes con nombre sin usar
docker system prune -a --volumes
```

> `docker system prune` no toca los volúmenes salvo con `--volumes`, y aun así solo borra los **anónimos** sin usar. Para borrar volúmenes con nombre hay que usar `docker volume prune -a` o `docker volume rm`: esos datos no se recuperan.

## Códigos de salida frecuentes

| Código | Significado |
|---|---|
| 0 | Terminó correctamente |
| 1 | Error de la aplicación |
| 125 | Falló el propio comando `docker run` |
| 126 / 127 | Comando no ejecutable / no encontrado |
| 137 | SIGKILL (128+9): `kill`, o **OOM killer** por falta de memoria |
| 143 | SIGTERM (128+15): parada ordenada |

## Idea importante

Un contenedor vive mientras viva su **proceso principal (PID 1)**. Si ese proceso termina, el contenedor pasa a `exited`. Por eso un contenedor con `bash` sin `-it` termina al instante.
