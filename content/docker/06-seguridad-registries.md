# Seguridad y registries

## Principios de seguridad

1. **No ejecutar como root**: `USER` no privilegiado en el Dockerfile.
2. **Imágenes mínimas**: `alpine`, `slim` o *distroless*; menos paquetes, menos vulnerabilidades.
3. **Fijar versiones** y reconstruir con frecuencia para recibir parches.
4. **Nunca meter secretos en la imagen** (`ENV`, `COPY .env`): quedan en las capas y en `docker history`. Usa secretos en tiempo de ejecución o de build.
5. **Escanear** imágenes: Docker Scout, Trivy, Grype, y escáneres de los registries (ACR/ECR).
6. **Firmar y verificar** imágenes con **Sigstore (cosign)** o **Notation**. Docker Content Trust está en retirada: el servicio Notary v1 de `notary.docker.io` se apaga el 8 de diciembre de 2026, así que no lo uses en proyectos nuevos.

## Endurecer la ejecución

```bash
docker run -d \
  --user 10001:10001 \
  --read-only --tmpfs /tmp \
  --cap-drop ALL --cap-add NET_BIND_SERVICE \
  --security-opt no-new-privileges \
  --memory 256m --cpus 0.5 --pids-limit 100 \
  miapp:1.0
```

- `--cap-drop ALL`: quita las *capabilities* de Linux y concede solo las necesarias.
- `--read-only`: sistema de ficheros raíz de solo lectura.
- `--privileged` da casi todos los permisos del host: **evítalo**.
- **seccomp** (filtra llamadas al sistema) y **AppArmor/SELinux** vienen con perfiles por defecto; no los desactives.
- Límites de recursos evitan que un contenedor agote el host.

## El socket de Docker

Montar `/var/run/docker.sock` en un contenedor equivale a darle **control root del host**. Evítalo salvo herramientas que lo exijan.

## Modo rootless

El demonio y los contenedores se ejecutan sin privilegios de root (con *user namespaces*). Reduce el impacto de un escape. Podman lo hace por defecto.

## Registries

- **Docker Hub**: registry público por defecto. Límite cada 6 horas: 100 descargas si eres anónimo (por IP) y 200 con cuenta personal gratuita; en planes de pago no hay límite, sujeto a uso razonable.
- **Privados/gestionados**: Azure Container Registry (ACR), Amazon ECR, Google Artifact Registry, GitHub Container Registry (GHCR), Harbor (autoalojado).
- **Registry propio**: imagen oficial `registry`.

```bash
docker login registro.ejemplo.com
docker tag miapp:1.0 registro.ejemplo.com/equipo/miapp:1.0
docker push registro.ejemplo.com/equipo/miapp:1.0
docker pull registro.ejemplo.com/equipo/miapp:1.0
```

El nombre completo de una imagen es `registro/espacio/repositorio:etiqueta`; si se omite el registro es Docker Hub.

### Autenticación en los registries cloud

```bash
az acr login --name miregistro
aws ecr get-login-password --region eu-west-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.eu-west-1.amazonaws.com
```

Las credenciales se guardan en `~/.docker/config.json`; usa un *credential helper* en vez de texto plano.

## Cadena de suministro

- Usa imágenes oficiales o de editores verificados.
- Genera y conserva el **SBOM** (lista de componentes) y la procedencia (*provenance*) con BuildKit.
- Anclar por digest evita que una etiqueta cambie bajo tus pies.

## Fuentes

- [Documentación oficial de referencia](https://docs.docker.com/engine/security/)
