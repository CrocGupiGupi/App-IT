# Scheduling, recursos, probes y escalado

## Requests y limits

```yaml
resources:
  requests:      # lo que el scheduler reserva
    cpu: "250m"
    memory: "128Mi"
  limits:        # tope en ejecución
    cpu: "500m"
    memory: "256Mi"
```

- El **scheduler** usa los *requests* para elegir nodo.
- Superar el límite de **CPU** → el contenedor se *throttlea* (se ralentiza).
- Superar el límite de **memoria** → `OOMKilled` (código 137).
- `1000m` = 1 CPU.

### Clases de QoS

| Clase | Condición | Prioridad ante presión |
|---|---|---|
| **Guaranteed** | requests = limits en todos los contenedores (CPU y memoria) | Se desaloja la última |
| **Burstable** | Algún request o limit definido | Intermedia |
| **BestEffort** | Sin requests ni limits | Se desaloja la primera |

## Cómo decide el scheduler

1. **Filtrado**: descarta nodos que no sirven (recursos, taints, selectores…).
2. **Puntuación**: ordena los restantes y elige el mejor.

Controles:

```yaml
spec:
  nodeSelector:
    disktype: ssd
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
          - matchExpressions:
              - { key: zona, operator: In, values: [a, b] }
    podAntiAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 100
          podAffinityTerm:
            topologyKey: kubernetes.io/hostname
            labelSelector:
              matchLabels: { app: web }
  tolerations:
    - key: "dedicado"
      operator: "Equal"
      value: "gpu"
      effect: "NoSchedule"
  topologySpreadConstraints:
    - maxSkew: 1
      topologyKey: topology.kubernetes.io/zone
      whenUnsatisfiable: DoNotSchedule
      labelSelector:
        matchLabels: { app: web }
```

- **Taints** (en el nodo) repelen Pods; **tolerations** (en el Pod) les permiten ir allí. Un taint no *atrae*: solo repele.
- Efectos de taint: `NoSchedule`, `PreferNoSchedule`, `NoExecute` (además expulsa los existentes).
- `kubectl taint nodes nodo1 dedicado=gpu:NoSchedule`.
- **Affinity** atrae o agrupa (*required* = obligatorio, *preferred* = deseable); **anti-affinity** dispersa réplicas.
- `kubectl cordon nodo` impide nuevos Pods; `kubectl drain nodo --ignore-daemonsets --delete-emptydir-data` además los desaloja.

## Probes

| Probe | Pregunta | Si falla |
|---|---|---|
| **startupProbe** | ¿Ha terminado de arrancar? | Reinicia; mientras corre, desactiva las otras |
| **livenessProbe** | ¿Sigue vivo? | **Reinicia** el contenedor |
| **readinessProbe** | ¿Puede recibir tráfico? | **Lo saca del Service**, sin reiniciar |

```yaml
readinessProbe:
  httpGet: { path: /ready, port: 8080 }
  initialDelaySeconds: 5
  periodSeconds: 10
livenessProbe:
  httpGet: { path: /healthz, port: 8080 }
  failureThreshold: 3
```

Mecanismos: `httpGet`, `tcpSocket`, `exec`, `grpc`.

## Escalado

- **HPA** (HorizontalPodAutoscaler): ajusta el nº de réplicas según CPU, memoria o métricas personalizadas. Requiere **metrics-server** y *requests* definidos.
- **VPA**: ajusta requests/limits (complemento que se instala aparte).
- **Redimensionado en caliente** (*in-place pod resize*, estable desde v1.35): cambia CPU y memoria de un Pod sin recrearlo, con `kubectl patch pod web --subresource=resize ...`.
- **Cluster Autoscaler** / **Karpenter**: añaden o quitan nodos.

```bash
kubectl autoscale deployment web --cpu-percent=70 --min=2 --max=10
kubectl get hpa
```

Fórmula del HPA: `réplicas = ⌈réplicas_actuales × métrica_actual / métrica_objetivo⌉`.

## Disponibilidad

**PodDisruptionBudget** limita cuántos Pods pueden estar caídos durante interrupciones voluntarias (drain, upgrades): `minAvailable: 2` o `maxUnavailable: 1`.

## Prioridades

`PriorityClass` permite que Pods importantes desplacen (*preempt*) a otros menos prioritarios si no hay hueco.

## Fuentes

- [Documentación oficial de referencia](https://kubernetes.io/docs/concepts/scheduling-eviction/)
