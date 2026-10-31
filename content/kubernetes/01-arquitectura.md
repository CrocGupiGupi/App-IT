# Arquitectura y conceptos

**Kubernetes (K8s)** es una plataforma de orquestación de contenedores: programa, escala, autorrepara y actualiza aplicaciones en un clúster de máquinas. Funciona de forma **declarativa**: describes el *estado deseado* y los controladores trabajan continuamente para que el estado real coincida (bucle de reconciliación).

## Componentes del plano de control (control plane)

| Componente | Función |
|---|---|
| **kube-apiserver** | Puerta de entrada (API REST); autentica, autoriza y valida. Único que habla con etcd. Puerto 6443 |
| **etcd** | Base de datos clave-valor con todo el estado del clúster. Puertos 2379 (clientes) y 2380 (pares) |
| **kube-scheduler** | Asigna los Pods nuevos a un nodo |
| **kube-controller-manager** | Ejecuta los controladores (Deployment, Node, Job, EndpointSlice…) |
| **cloud-controller-manager** | Integra con el proveedor cloud (balanceadores, discos, nodos) |

## Componentes de cada nodo (worker)

| Componente | Función |
|---|---|
| **kubelet** | Agente: se asegura de que los contenedores de los Pods asignados corran y estén sanos. Puerto 10250 |
| **kube-proxy** | Implementa las reglas de red de los Services. Modos en Linux: `iptables` (por defecto en 1.37), `nftables` (será el futuro valor por defecto) e `ipvs` |
| **Container runtime** | containerd o CRI-O, mediante la interfaz **CRI** |

Interfaces de extensión: **CRI** (runtime), **CNI** (red), **CSI** (almacenamiento).

## Objetos básicos

- **Pod**: unidad mínima desplegable; uno o varios contenedores que comparten red (misma IP) y volúmenes.
- **ReplicaSet / Deployment**: mantienen N réplicas y gestionan actualizaciones.
- **Service**: IP y nombre estables para acceder a un conjunto de Pods.
- **Namespace**: separación lógica de recursos (`default`, `kube-system`, `kube-public`, `kube-node-lease`).
- **ConfigMap / Secret**: configuración y datos sensibles.
- **PersistentVolume / PersistentVolumeClaim**: almacenamiento.
- **Labels y selectors**: pares clave-valor para etiquetar y seleccionar objetos. Base de casi todas las relaciones.
- **Annotations**: metadatos no usados para seleccionar.

## Flujo al crear un Deployment

1. `kubectl apply` envía el manifiesto al **API server**, que lo guarda en **etcd**.
2. El controlador de Deployment crea un **ReplicaSet**, que crea los **Pods** (sin nodo asignado).
3. El **scheduler** elige nodo para cada Pod.
4. El **kubelet** del nodo lo ve, pide al runtime que descargue la imagen y arranque los contenedores.
5. Los controladores vigilan y corrigen cualquier desviación.

## Distribuciones

- **Local**: minikube, kind, k3d, Docker Desktop.
- **Ligeras**: k3s, MicroK8s.
- **Autogestionadas**: kubeadm.
- **Gestionadas**: AKS (Azure), EKS (AWS), GKE (Google). El proveedor administra el plano de control.

## Ecosistema cloud native (CNCF)

Kubernetes forma parte del ecosistema de la CNCF junto con Prometheus (métricas), Helm (paquetes), Envoy, Argo CD/Flux (GitOps), etc. KCNA evalúa este panorama.
