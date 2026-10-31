# Configuración y almacenamiento

## ConfigMap

Almacena configuración no sensible (clave-valor o ficheros completos).

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: cfg
data:
  MODO: prod
  app.properties: |
    nivel=info
```

## Secret

Para datos sensibles (contraseñas, tokens, certificados TLS).

```bash
kubectl create secret generic db --from-literal=password='S3creto!'
kubectl create secret tls app-tls --cert=tls.crt --key=tls.key
kubectl create secret docker-registry regcred --docker-server=... --docker-username=... --docker-password=...
```

> Los Secret van **codificados en base64, no cifrados**. Para protegerlos: habilitar *encryption at rest* en etcd, RBAC estricto y/o gestores externos (Vault, Azure Key Vault, AWS Secrets Manager con el External Secrets Operator o el CSI Secrets Store).

## Cómo consumirlos

```yaml
spec:
  containers:
    - name: app
      image: miapp:1.0
      env:
        - name: MODO
          valueFrom:
            configMapKeyRef: { name: cfg, key: MODO }
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef: { name: db, key: password }
      envFrom:
        - configMapRef: { name: cfg }
      volumeMounts:
        - name: config
          mountPath: /etc/app
  volumes:
    - name: config
      configMap:
        name: cfg
```

- Como **variables de entorno**: se leen al arrancar; no se actualizan si cambia el ConfigMap.
- Como **volumen**: los ficheros se actualizan con retraso al cambiar el objeto (excepto con `subPath`).
- `immutable: true` evita modificaciones accidentales.

## Volúmenes

Los volúmenes de un Pod viven lo que el Pod: `emptyDir` (temporal, compartido entre contenedores), `hostPath` (ruta del nodo; evitar), `configMap`, `secret`, `projected`.

## Almacenamiento persistente

| Objeto | Rol |
|---|---|
| **PersistentVolume (PV)** | Recurso de almacenamiento del clúster (no tiene namespace) |
| **PersistentVolumeClaim (PVC)** | Petición de almacenamiento de un usuario (con namespace) |
| **StorageClass** | Define el tipo y permite **aprovisionamiento dinámico** (driver CSI) |

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: datos
spec:
  accessModes: [ReadWriteOnce]
  storageClassName: standard
  resources:
    requests:
      storage: 10Gi
---
apiVersion: v1
kind: Pod
metadata:
  name: db
spec:
  containers:
    - name: db
      image: postgres:16
      volumeMounts:
        - name: datos
          mountPath: /var/lib/postgresql/data
  volumes:
    - name: datos
      persistentVolumeClaim:
        claimName: datos
```

**Modos de acceso**: `ReadWriteOnce` (RWO, un nodo lee/escribe), `ReadOnlyMany` (ROX), `ReadWriteMany` (RWX, varios nodos), `ReadWriteOncePod` (RWOP, un solo Pod).

**Reclaim policy** del PV al liberar el PVC: `Retain` (conserva los datos) o `Delete` (borra el almacenamiento). Las clases dinámicas suelen usar `Delete` por defecto.

**Binding**: un PVC se enlaza a un PV con capacidad y modo suficientes y misma `storageClassName`. Con `volumeBindingMode: WaitForFirstConsumer` el volumen se crea donde se programe el Pod.

Se puede ampliar un PVC si la StorageClass tiene `allowVolumeExpansion: true`.

## StatefulSet y almacenamiento

`volumeClaimTemplates` crea un PVC independiente por réplica (`datos-db-0`, `datos-db-1`). Al borrar el StatefulSet, los PVC **se conservan**.
