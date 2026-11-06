# Operación: Helm, kubeadm, etcd y troubleshooting

## Helm y Kustomize

**Helm** es el gestor de paquetes de Kubernetes (la versión mayor actual es Helm 4). Un **chart** es un paquete de plantillas; una **release** es una instalación concreta; los **values** parametrizan.

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm search repo prometheus
helm install mon prometheus-community/prometheus -n obs --create-namespace
helm install mon prometheus-community/prometheus -f valores.yaml
helm list -A
helm upgrade mon prometheus-community/prometheus -f valores.yaml
helm history mon
helm rollback mon 1
helm uninstall mon
helm create micharto             # esqueleto de un chart
helm template web ./micharto     # renderiza sin instalar
```

> Revisa siempre quién mantiene un chart. El catálogo público gratuito de Bitnami se recortó en 2025 y las versiones antiguas pasaron a `bitnamilegacy`, sin actualizaciones.

**Kustomize** (integrado: `kubectl apply -k`) personaliza YAML sin plantillas, con *bases* y *overlays* (`kustomization.yaml`, `patches`, `namePrefix`, `images`).

## Instalar un clúster con kubeadm

```bash
# En todos los nodos: runtime (containerd), kubeadm, kubelet y kubectl desde pkgs.k8s.io
# El kubelet no arranca con swap activo salvo que lo toleres con failSwapOn: false
# En el control plane:
kubeadm init --pod-network-cidr=10.244.0.0/16
mkdir -p ~/.kube && cp /etc/kubernetes/admin.conf ~/.kube/config
kubectl apply -f <manifiesto-del-CNI>
# En cada worker (comando que imprime init):
kubeadm join 10.0.0.10:6443 --token ... --discovery-token-ca-cert-hash sha256:...
kubeadm token create --print-join-command
```

- Los componentes del control plane corren como **static Pods** definidos en `/etc/kubernetes/manifests/` (el kubelet los vigila).
- Certificados en `/etc/kubernetes/pki`; los de kubeadm caducan al año: `kubeadm certs check-expiration` y `kubeadm certs renew all`.
- Configuración del kubelet: `/var/lib/kubelet/config.yaml`; servicio: `systemctl status kubelet`, logs con `journalctl -u kubelet`.

## Actualizar el clúster

Solo se puede subir **una versión menor cada vez** (1.36 → 1.37). Haz antes una copia de seguridad. Orden:

1. Primer control plane: actualiza el paquete `kubeadm` → `kubeadm upgrade plan` → `kubeadm upgrade apply v1.37.x` → `kubectl drain` → actualiza `kubelet` y `kubectl`, reinicia el kubelet → `kubectl uncordon`.
2. Resto de control planes, uno a uno: igual, pero con `kubeadm upgrade node`.
3. Cada worker: actualiza `kubeadm` → `kubeadm upgrade node` → `kubectl drain nodo --ignore-daemonsets` → actualiza kubelet y kubectl → `kubectl uncordon nodo`.

## Copia de seguridad de etcd

```bash
etcdctl snapshot save /backup/etcd.db \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key

etcdutl snapshot restore /backup/etcd.db --data-dir /var/lib/etcd-restaurado
# después, apuntar el static Pod de etcd (hostPath) al nuevo data-dir
```

`etcdctl` trabaja por red y `etcdutl` directamente sobre los ficheros. La API v3 ya es la predeterminada, así que `ETCDCTL_API=3` no hace falta.

## Método de troubleshooting

1. `kubectl get pods -o wide` y `kubectl describe pod X` → mira los **Events** al final.
2. `kubectl logs X [--previous] [-c contenedor]`.
3. Si el problema es de red: Service, Endpoints, etiquetas, NetworkPolicy, DNS.
4. Si es del nodo: `kubectl get nodes`, `describe node`, `journalctl -u kubelet`, `crictl ps`.

| Estado | Causas habituales |
|---|---|
| **Pending** | Sin recursos en ningún nodo, taints sin toleration, nodeSelector/affinity imposibles, PVC sin enlazar |
| **ImagePullBackOff / ErrImagePull** | Nombre o tag erróneo, registry privado sin `imagePullSecrets`, sin red |
| **CrashLoopBackOff** | La aplicación falla al arrancar: `logs --previous`, configuración, probes demasiado agresivas |
| **OOMKilled** | Límite de memoria insuficiente |
| **CreateContainerConfigError** | ConfigMap/Secret inexistente o clave errónea |
| **Running pero sin tráfico** | readinessProbe falla, Service sin endpoints, `targetPort` equivocado |
| **Node NotReady** | kubelet caído, runtime, red, disco/memoria agotados |
| **Evicted** | Presión de recursos en el nodo |

Plano de control caído: revisar `/etc/kubernetes/manifests/*.yaml`, `crictl ps -a`, logs en `/var/log/pods` y el certificado del API server.

## Observabilidad

- Métricas: **metrics-server** (`kubectl top`), **Prometheus + Grafana**.
- Logs: Fluent Bit/Fluentd → Loki/Elasticsearch/servicios cloud.
- Trazas: OpenTelemetry, Jaeger.

## GitOps

El Git es la fuente de la verdad y un agente (**Argo CD**, **Flux**) sincroniza el clúster con él. Aporta auditoría, reversión simple y entornos reproducibles.

## Extender Kubernetes

**CustomResourceDefinition (CRD)** añade tipos propios y un **operador** (controlador personalizado) los gestiona automáticamente (p. ej. bases de datos, cert-manager).

## Fuentes

- [Documentación oficial de referencia](https://kubernetes.io/docs/tasks/administer-cluster/)
