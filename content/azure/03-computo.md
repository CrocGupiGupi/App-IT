# Cómputo: VM, App Service, Functions y contenedores

## Cómo elegir

| Necesidad | Servicio |
|---|---|
| Control total del SO | **Virtual Machines** |
| Web/API gestionada | **App Service** |
| Código por eventos, sin servidores | **Azure Functions** |
| Contenedor sencillo, tarea puntual | **Container Instances (ACI)** |
| Microservicios en contenedor sin gestionar Kubernetes | **Container Apps** |
| Kubernetes gestionado | **AKS** |
| Computación por lotes a gran escala | **Azure Batch** |
| Escritorios remotos | **Azure Virtual Desktop** |

## Máquinas virtuales

- **Series/tamaños**: uso general (D), optimizadas para cómputo (F), memoria (E), almacenamiento (L), GPU (N), alto rendimiento (H).
- Tú gestionas SO, parches y seguridad (IaaS). Facturación: cómputo mientras esté **asignada** (una VM *detenida* desde el SO sigue cobrando; **desasignada** desde Azure no cobra cómputo, pero sí discos).
- **Discos**: Standard HDD, Standard SSD, Premium SSD, Premium SSD v2, Ultra Disk. Disco del SO + discos de datos + disco temporal (se pierde).
- **Imágenes**: Marketplace o propias (Azure Compute Gallery).

### Alta disponibilidad

| Opción | Protege de |
|---|---|
| **Availability Set** | Fallos de rack y mantenimientos dentro de un centro de datos (hasta 3 dominios de fallo y 20 de actualización; SLA del 99,95 %) |
| **Availability Zones** | Fallo de un centro de datos completo |
| **Virtual Machine Scale Sets (VMSS)** | Conjunto de VMs con **autoescalado**. Microsoft recomienda el modo de orquestación **flexible** para alta disponibilidad |

```bash
az vm create -g rg-demo -n vm01 --image Ubuntu2204 --size Standard_B2s \
  --admin-username azureuser --generate-ssh-keys
az vm deallocate -g rg-demo -n vm01
az vm list -d -o table
```

## App Service

PaaS para web apps, APIs y móviles (.NET, Java, Node, Python, PHP, contenedores).

- **App Service Plan**: define región, SO y tamaño (cómputo compartido por las apps del plan). Niveles: Free/Shared, Basic, Standard, Premium, Isolated.
- Funciones: **slots de despliegue** (staging → swap sin tiempo de inactividad), escalado manual/automático, dominios y certificados TLS, integración con VNet, autenticación integrada.
- Escalado **vertical** = cambiar de plan; **horizontal** = más instancias.

## Azure Functions

Código disparado por **triggers** (HTTP, temporizador, cola, Blob, Event Grid, Cosmos DB…) con **bindings** de entrada/salida declarativos.

| Plan | Característica |
|---|---|
| **Flex Consumption** | Opción recomendada para serverless: escala a cero y hasta 1000 instancias, VNet, instancias siempre listas opcionales. Solo Linux y solo código |
| **Premium** | Instancias precalentadas, sin arranque en frío, VNet |
| **Dedicated** | Sobre un App Service Plan |
| **Container Apps** | Funciones en contenedores Linux |
| **Consumption** (heredado) | 10 minutos como máximo por ejecución. En Linux se retira el 30/09/2028 |

En cualquier plan, un disparador HTTP debe responder en 230 segundos como máximo.

**Durable Functions**: flujos con estado y orquestación (encadenado, fan-out/fan-in, esperas humanas).

## Contenedores

- **Azure Container Registry (ACR)**: registry privado de imágenes (con escaneo, geo-replicación, tareas de build).
- **Azure Container Instances**: un contenedor o grupo sin orquestador, arranque rápido, facturación por segundo.
- **Azure Container Apps**: plataforma sobre Kubernetes (KEDA, Dapr, Envoy) para microservicios y trabajos, con **escalado a cero** y por eventos; no se gestiona el clúster.
- **Azure Kubernetes Service (AKS)**: Azure gestiona el plano de control y tú pagas los nodos. Tiene tres niveles: **Free** (gestión gratis, sin SLA económico, para pruebas), **Standard** (SLA de hasta 99,95 %, hasta 5000 nodos) y **Premium** (añade soporte a largo plazo de 24 meses). **AKS Automatic** es la opción predeterminada recomendada para producción. Pools de nodos (sistema y usuario), integración con Entra ID, autoescalado de clúster. En redes, usa **Azure CNI Overlay** en la mayoría de los casos; **kubenet** es heredado y se retira el 31/03/2028.

```bash
az acr create -g rg-demo -n miregistro123 --sku Standard
az acr build -r miregistro123 -t miapp:1.0 .
az aks create -g rg-demo -n aks01 --tier free --node-count 2 --attach-acr miregistro123 --generate-ssh-keys
az aks get-credentials -g rg-demo -n aks01
kubectl get nodes
```

## Escalado automático (Azure Monitor autoscale)

Reglas por métrica (CPU > 70 % durante 10 min → +1 instancia) o por horario, con mínimos y máximos y periodos de enfriamiento (*cool-down*).
