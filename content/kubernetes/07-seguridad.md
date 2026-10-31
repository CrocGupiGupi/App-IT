# Seguridad: RBAC, NetworkPolicy y Pod Security

## Las cuatro C de la seguridad cloud native

**Cloud → Clúster → Contenedor → Código**: cada capa depende de la anterior.

## Autenticación y autorización

Cada petición al API server pasa por: **autenticación** (¿quién eres?) → **autorización** (¿puedes hacerlo?) → **admission control** (¿cumple las políticas? puede mutar/validar).

- Usuarios: certificados de cliente, OIDC (Entra ID, Google, Okta…). Kubernetes **no tiene objeto User**.
- Cuentas de servicio (**ServiceAccount**): identidad de los Pods.

## RBAC

| Objeto | Alcance | Función |
|---|---|---|
| **Role** | Un namespace | Conjunto de permisos |
| **ClusterRole** | Todo el clúster | Permisos globales o sobre recursos sin namespace |
| **RoleBinding** | Un namespace | Asigna un Role/ClusterRole a sujetos en ese namespace |
| **ClusterRoleBinding** | Clúster | Asigna un ClusterRole en todo el clúster |

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata: { name: lector-pods, namespace: dev }
rules:
  - apiGroups: [""]
    resources: ["pods", "pods/log"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata: { name: lector-pods, namespace: dev }
subjects:
  - kind: User
    name: ana
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: lector-pods
  apiGroup: rbac.authorization.k8s.io
```

```bash
kubectl auth can-i delete pods -n dev --as ana
kubectl create role lector --verb=get,list --resource=pods -n dev
kubectl create rolebinding rb --role=lector --user=ana -n dev
kubectl create serviceaccount ci -n dev
```

RBAC es **aditivo** (solo permite, nunca deniega). Principio de mínimo privilegio; evita `cluster-admin` y los comodines `*`.

### ServiceAccount de los Pods

Cada Pod usa la ServiceAccount `default` salvo que se indique. Si la app no llama a la API, usa `automountServiceAccountToken: false`.

## NetworkPolicy

Aísla Pods a nivel de red (L3/L4). Una vez que un Pod es seleccionado por alguna política, solo se permite el tráfico explícitamente autorizado.

```yaml
# Denegar todo el tráfico entrante en el namespace
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: denegar-entrada, namespace: dev }
spec:
  podSelector: {}
  policyTypes: [Ingress]
---
# Permitir que solo "web" llegue a "db" por el 5432
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: web-a-db, namespace: dev }
spec:
  podSelector:
    matchLabels: { app: db }
  policyTypes: [Ingress]
  ingress:
    - from:
        - podSelector:
            matchLabels: { app: web }
      ports:
        - { protocol: TCP, port: 5432 }
```

Requiere un CNI compatible. No olvides permitir el DNS (UDP/TCP 53) si restringes la salida.

## Pod Security

**Pod Security Admission** (los *PodSecurityPolicy* se eliminaron en 1.25) aplica tres perfiles por namespace: `privileged`, `baseline`, `restricted`.

```bash
kubectl label namespace dev pod-security.kubernetes.io/enforce=restricted
```

Modos: `enforce` (rechaza), `audit`, `warn`.

### securityContext

```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 10001
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  capabilities:
    drop: ["ALL"]
  seccompProfile:
    type: RuntimeDefault
```

## Otras medidas

- Escanear imágenes y usar solo registries de confianza; firmar con cosign y exigirlo con admission controllers (Kyverno, OPA Gatekeeper).
- Cifrar Secrets en etcd; proteger etcd (TLS, acceso restringido).
- Proteger la API (no exponerla a Internet) y el kubelet (autenticación y autorización activas).
- Registro de auditoría (*audit log*) del API server.
- Herramientas: Trivy, kube-bench (CIS Benchmark), Falco (detección en ejecución).
