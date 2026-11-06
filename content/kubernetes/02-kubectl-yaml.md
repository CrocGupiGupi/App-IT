# kubectl, YAML y entorno local

## Montar un clúster local

```bash
# kind (Kubernetes dentro de contenedores Docker)
kind create cluster --name lab
# minikube
minikube start
kubectl cluster-info
kubectl get nodes
```

`kubectl` lee la configuración de `~/.kube/config` (clusters, usuarios y *contexts*).

```bash
kubectl config get-contexts
kubectl config use-context kind-lab
kubectl config set-context --current --namespace=dev
```

## Anatomía de un manifiesto

Todo objeto tiene cuatro campos principales:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: web
  namespace: default
  labels:
    app: web
spec:
  containers:
    - name: nginx
      image: nginx:1.27
      ports:
        - containerPort: 80
```

`apiVersion` + `kind` identifican el tipo; `metadata` el nombre y etiquetas; `spec` el estado deseado; el sistema añade `status` con el estado real.

## Comandos que usarás siempre

```bash
kubectl get pods -o wide -A                 # -A = todos los namespaces
kubectl get pod web -o yaml
kubectl describe pod web                    # eventos: primer sitio donde mirar
kubectl apply -f manifiesto.yaml            # crear o actualizar (declarativo)
kubectl create -f manifiesto.yaml           # solo crear (imperativo)
kubectl delete -f manifiesto.yaml
kubectl logs web -c nginx -f --previous
kubectl exec -it web -- sh
kubectl port-forward pod/web 8080:80
kubectl explain pod.spec.containers         # documentación de campos
kubectl get events --sort-by=.metadata.creationTimestamp
kubectl top pod                             # requiere metrics-server
kubectl diff -f manifiesto.yaml
```

## Generar YAML rápido (clave en los exámenes prácticos)

```bash
kubectl run web --image=nginx:1.27 --dry-run=client -o yaml > pod.yaml
kubectl create deployment web --image=nginx:1.27 --replicas=3 --dry-run=client -o yaml
kubectl expose deployment web --port=80 --target-port=80 --type=ClusterIP
kubectl create configmap cfg --from-literal=modo=prod
kubectl create secret generic db --from-literal=password=abc123
kubectl scale deployment web --replicas=5
kubectl set image deployment/web nginx=nginx:1.27.2
kubectl label pod web tier=front
kubectl annotate pod web owner=equipo
```

Selección con etiquetas y salida personalizada:

```bash
kubectl get pods -l app=web,tier=front
kubectl get pods -o jsonpath='{.items[*].metadata.name}'
kubectl get pods -o custom-columns=NOMBRE:.metadata.name,NODO:.spec.nodeName
```

## Imperativo frente a declarativo

- **Imperativo**: `kubectl run`, `create`, `scale`. Rápido, pero no queda registrado.
- **Declarativo**: `kubectl apply -f` con ficheros en Git. Es la práctica recomendada (base de GitOps).

## Consejos para el examen práctico

- Configura alias y autocompletado: `alias k=kubectl`, `source <(kubectl completion bash)`, `export do="--dry-run=client -o yaml"`.
- Usa `kubectl explain` y la documentación oficial permitida en el examen.
- **Comprueba siempre el contexto y el namespace** antes de cada tarea.

## Fuentes

- [Documentación oficial de referencia](https://kubernetes.io/docs/reference/kubectl/)
