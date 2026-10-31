# Pods, Deployments y otras cargas

## Pod

Los contenedores de un Pod comparten IP, puertos y volúmenes. Los Pods son **efímeros**: si mueren no se "reparan", se reemplazan por otros nuevos con otra IP.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app
spec:
  initContainers:
    - name: espera-db
      image: busybox:1.36
      command: ["sh", "-c", "until nc -z db 5432; do sleep 2; done"]
  containers:
    - name: app
      image: miapp:1.0
    - name: logger          # sidecar
      image: fluent/fluent-bit
  restartPolicy: Always
```

- **initContainers**: se ejecutan en orden y deben terminar antes de arrancar los contenedores principales.
- **Sidecar**: contenedor auxiliar (logs, proxy, sincronización).
- **restartPolicy**: `Always` (por defecto), `OnFailure`, `Never`.
- Fases: `Pending`, `Running`, `Succeeded`, `Failed`, `Unknown`.

## Deployment

Gestiona ReplicaSets y ofrece actualizaciones progresivas y *rollback*. Es la carga estándar para aplicaciones **sin estado**.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: nginx
          image: nginx:1.27
```

El `selector` debe coincidir con las etiquetas de `template`, y es **inmutable** una vez creado.

Estrategias:

- **RollingUpdate** (por defecto): sustituye Pods gradualmente. `maxSurge` = Pods extra permitidos, `maxUnavailable` = Pods no disponibles permitidos.
- **Recreate**: elimina todos y crea los nuevos (hay indisponibilidad).

```bash
kubectl rollout status deployment/web
kubectl rollout history deployment/web
kubectl rollout undo deployment/web [--to-revision=2]
kubectl rollout restart deployment/web
kubectl rollout pause|resume deployment/web
```

## Otras cargas de trabajo

| Recurso | Para qué |
|---|---|
| **StatefulSet** | Apps con estado: identidad estable (`db-0`, `db-1`), orden de arranque, almacenamiento propio por réplica (`volumeClaimTemplates`) y Service *headless* |
| **DaemonSet** | Un Pod en cada nodo (agentes de logs, monitorización, CNI) |
| **Job** | Tarea que se ejecuta hasta completarse (`completions`, `parallelism`, `backoffLimit`) |
| **CronJob** | Jobs programados con sintaxis cron (`schedule: "0 2 * * *"`) |
| **ReplicaSet** | Mantiene N Pods; normalmente lo gestiona un Deployment |

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: backup
spec:
  schedule: "0 2 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
            - name: backup
              image: miapp/backup:1.0
```

## Namespaces

```bash
kubectl create namespace dev
kubectl get pods -n dev
kubectl api-resources --namespaced=false     # recursos no namespaced: Node, PV, Namespace…
```

Se combinan con **ResourceQuota** (límites totales) y **LimitRange** (valores por defecto/mínimos/máximos por Pod).
