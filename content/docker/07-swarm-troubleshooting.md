# Swarm y resolución de problemas

## Docker Swarm

**Swarm mode** es el orquestador integrado en Docker. Hoy Kubernetes domina el mercado, pero Swarm es sencillo y forma parte del temario de la DCA.

### Arquitectura

- **Managers**: gestionan el estado del clúster mediante consenso **Raft**. Se recomienda un número impar.
- **Workers**: ejecutan tareas.
- Quórum Raft: con N managers hacen falta `⌊N/2⌋+1` activos. 3 managers toleran 1 fallo; 5 toleran 2. Con 1 solo manager, no hay tolerancia.

```bash
docker swarm init --advertise-addr 192.168.1.10
docker swarm join-token worker       # muestra el comando de unión
docker node ls
docker node promote nodo2 / demote / update --availability drain nodo2
docker swarm leave
```

### Servicios

Un **servicio** define el estado deseado; Swarm crea **tareas** (contenedores) y las reconcilia.

```bash
docker service create --name web --replicas 3 -p 80:80 nginx:1.27
docker service ls
docker service ps web
docker service scale web=5
docker service update --image nginx:1.27.2 web      # actualización progresiva
docker service rollback web
docker service logs -f web
```

- Modos: **replicated** (N réplicas) o **global** (una por nodo).
- **Routing mesh**: el puerto publicado responde en *todos* los nodos y reenvía a una réplica.
- **Rolling update**: `--update-parallelism`, `--update-delay`, `--update-failure-action`.
- Restricciones: `--constraint node.role==worker`, `node.labels.zona==a`.

### Stacks, secretos y configs

```bash
docker stack deploy -c compose.yaml mistack
docker stack ls / services mistack / rm mistack
echo "pass123" | docker secret create db_pass -
docker config create nginx_conf nginx.conf
```

Los **secretos** se cifran en Raft y se montan en `/run/secrets/<nombre>` solo en los contenedores que los necesitan.

Redes **overlay** conectan contenedores entre nodos; el tráfico de datos puede cifrarse con `--opt encrypted`.

## Resolución de problemas

Método: observar → aislar → comprobar un cambio cada vez.

| Síntoma | Comprobar |
|---|---|
| Contenedor `Exited` | `docker logs`, `docker inspect --format '{{.State.ExitCode}} {{.State.OOMKilled}}'` |
| Se reinicia en bucle | Código de salida, `docker logs`, política `--restart` |
| No responde en el puerto | `docker ps` (¿publicado?), la app escucha en `0.0.0.0` y no en `127.0.0.1`, firewall |
| Un contenedor no ve a otro | ¿Misma red definida por el usuario?, usar nombre y no IP, `docker network inspect` |
| Sin espacio en disco | `docker system df`, `prune` |
| `permission denied` | Usuario del contenedor, permisos del volumen/bind mount, SELinux (`:z`) |
| Falla el build | Salida de `docker build --progress=plain --no-cache` |
| Imagen no baja | Login, nombre del registry, límite de descargas, red/proxy |

Herramientas útiles:

```bash
docker events --since 10m
docker inspect --format '{{json .NetworkSettings.Networks}}' web
docker run --rm -it --network container:web nicolaka/netshoot     # depurar red de otro contenedor
journalctl -u docker              # logs del demonio (Linux)
docker info                        # versión, drivers, estado de Swarm
```

### Logging

El driver por defecto es `json-file`, que crece sin límite si no se rota:

```json
{ "log-driver": "json-file", "log-opts": { "max-size": "10m", "max-file": "3" } }
```

(en `/etc/docker/daemon.json`). Otros drivers: `syslog`, `journald`, `fluentd`, `gelf`, `awslogs`.

## Siguiente paso

Con Docker dominado, el paso natural es **Kubernetes**, que añade orquestación a gran escala, autocuración, descubrimiento de servicios y despliegues declarativos.
