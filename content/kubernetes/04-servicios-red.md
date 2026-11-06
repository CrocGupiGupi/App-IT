# Servicios, Ingress y DNS

## Modelo de red de Kubernetes

1. Cada Pod tiene su **propia IP**.
2. Todos los Pods pueden comunicarse entre sí sin NAT.
3. Los agentes del nodo pueden comunicarse con los Pods del nodo.

Lo implementa un plugin **CNI** (Calico, Cilium, Flannel…).

## Service

Como los Pods son efímeros, un **Service** ofrece una IP virtual y un nombre DNS estables y reparte la carga entre los Pods que cumplan su `selector`.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  type: ClusterIP
  selector:
    app: web
  ports:
    - port: 80          # puerto del Service
      targetPort: 8080  # puerto del contenedor
```

| Tipo | Alcance |
|---|---|
| **ClusterIP** (por defecto) | Solo dentro del clúster |
| **NodePort** | Abre un puerto (30000–32767) en todos los nodos |
| **LoadBalancer** | Crea un balanceador externo del proveedor cloud |
| **ExternalName** | Alias DNS (CNAME) a un nombre externo |
| **Headless** (`clusterIP: None`) | Sin IP virtual; el DNS devuelve las IP de los Pods (usado con StatefulSet) |

Los Service mantienen la lista de destinos en objetos **EndpointSlice**; solo los Pods **Ready** reciben tráfico. La API antigua **Endpoints** está obsoleta.

## DNS (CoreDNS)

- Service: `<servicio>.<namespace>.svc.cluster.local`.
- Desde el mismo namespace basta `web`; desde otro, `web.dev`.
- Pod de un StatefulSet con Service headless: `db-0.db.<ns>.svc.cluster.local`.

```bash
kubectl run tmp --rm -it --image=busybox:1.36 -- nslookup web
```

## Ingress

Un **Ingress** enruta tráfico HTTP/HTTPS externo a Services según host y ruta. Necesita un **Ingress Controller** instalado (Traefik, HAProxy, NGINX de F5, controladores cloud…); el objeto por sí solo no hace nada.

> La API Ingress es estable y no se va a eliminar, pero está **congelada**: no recibirá cambios. El proyecto Kubernetes recomienda **Gateway API** para desarrollos nuevos. Además, el controlador comunitario `ingress-nginx` se retiró en marzo de 2026 y ya no recibe parches de seguridad; migra con `ingress2gateway` o a otro controlador. Sigue siendo materia de examen, así que aprende ambos.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: sitio
spec:
  ingressClassName: nginx
  tls:
    - hosts: [app.ejemplo.com]
      secretName: app-tls
  rules:
    - host: app.ejemplo.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: api
                port:
                  number: 80
```

**Gateway API** (`GatewayClass`, `Gateway`, `HTTPRoute`) es la sucesora de Ingress: más expresiva, con roles separados (infraestructura frente a aplicación) y soporte de más protocolos.

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: api
spec:
  parentRefs:
    - name: mi-gateway
  hostnames: ["app.ejemplo.com"]
  rules:
    - matches:
        - path: { type: PathPrefix, value: /api }
      backendRefs:
        - name: api
          port: 80
```

## NetworkPolicy

Por defecto **todo el tráfico entre Pods está permitido**. Una `NetworkPolicy` lo restringe, pero solo si el CNI la implementa (Calico y Cilium sí; Flannel solo, no). Se detalla en la lección de seguridad.

## Diagnóstico de red

```bash
kubectl get svc,endpointslices
kubectl describe svc web                # ¿tiene destinos?
kubectl get pods --show-labels          # ¿las etiquetas coinciden con el selector?
kubectl port-forward svc/web 8080:80
```

El fallo más común: un Service sin endpoints porque su `selector` no coincide con las etiquetas de los Pods, o porque los Pods no están Ready.

## Fuentes

- [Documentación oficial de referencia](https://kubernetes.io/docs/concepts/services-networking/)
- [Calendario de retirada de ingress-nginx](https://kubernetes.io/blog/2025/11/11/ingress-nginx-retirement/)
