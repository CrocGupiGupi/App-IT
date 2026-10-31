# Qué son los contenedores y Docker

## Contenedor frente a máquina virtual

Un **contenedor** es un proceso (o grupo de procesos) aislado que comparte el kernel del sistema anfitrión. Una **máquina virtual** emula hardware y ejecuta su propio sistema operativo completo.

| | Máquina virtual | Contenedor |
|---|---|---|
| Aislamiento | Hardware virtualizado (hipervisor) | Kernel compartido, aislado por el SO |
| Tamaño | GB | MB |
| Arranque | Minutos | Segundos o menos |
| Kernel | Uno propio por VM | El del host |
| Seguridad | Aislamiento más fuerte | Aislamiento más débil si no se endurece |

## Cómo se aísla un contenedor (Linux)

- **Namespaces**: limitan lo que el proceso *ve* (`pid`, `net`, `mnt`, `uts`, `ipc`, `user`).
- **cgroups** (control groups): limitan lo que el proceso *consume* (CPU, memoria, E/S).
- **Union filesystem** (OverlayFS): apila capas de solo lectura y añade una capa de escritura por contenedor.

> En Windows y macOS, Docker Desktop ejecuta los contenedores Linux dentro de una VM ligera (WSL 2 o similar).

## Conceptos clave

- **Imagen**: plantilla inmutable, formada por capas, que contiene el sistema de ficheros y la configuración de arranque.
- **Contenedor**: instancia en ejecución (o detenida) de una imagen, con una capa de escritura encima.
- **Registry**: servicio donde se almacenan y distribuyen imágenes (Docker Hub, ACR, ECR, GHCR…).
- **Repositorio y etiqueta**: `nginx:1.27` es repositorio `nginx` con tag `1.27`. Un **digest** (`nginx@sha256:…`) identifica una imagen de forma inmutable.

## Arquitectura de Docker

1. **Docker CLI** (`docker`): el cliente que escribes en la terminal.
2. **dockerd** (Docker Engine): el demonio; expone una API REST por el socket `/var/run/docker.sock`.
3. **containerd**: gestiona el ciclo de vida de contenedores e imágenes.
4. **runc**: crea realmente el contenedor siguiendo la especificación OCI.

Estándares **OCI** (Open Container Initiative): formato de imagen y runtime, por lo que las imágenes de Docker funcionan en otros motores (Podman, containerd, CRI-O).

## Docker Desktop y alternativas

- **Docker Engine**: componente de servidor en Linux, libre.
- **Docker Desktop**: aplicación para Windows/macOS/Linux con interfaz gráfica; su licencia comercial depende del tamaño de la empresa.
- **Podman**: alternativa sin demonio y por defecto sin root, con CLI compatible.

## Para qué sirven

Entornos reproducibles, empaquetar aplicaciones con sus dependencias, microservicios, integración continua y despliegue idéntico de desarrollo a producción.
