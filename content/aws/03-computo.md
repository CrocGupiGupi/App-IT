# Cómputo: EC2, balanceo, Lambda y contenedores

## EC2 (Elastic Compute Cloud)

Máquinas virtuales (IaaS).

- **Familias de instancias**: uso general (`t`, `m`), cómputo (`c`), memoria (`r`, `x`), almacenamiento (`i`, `d`), aceleradas/GPU (`p`, `g`). Las `t` son *burstable* (créditos de CPU).
- **AMI**: imagen de arranque (propia, de AWS o del Marketplace); es regional (se puede copiar).
- **User data**: script de arranque (se ejecuta con root solo en el primer arranque por defecto).
- **Almacenamiento**: EBS (persistente) o *instance store* (efímero, se pierde al parar/terminar).
- **IP**: privada fija mientras exista; la pública cambia al parar/iniciar, salvo una **Elastic IP**.
- **Grupos de seguridad** (firewall con estado) y **pares de claves** (SSH). Alternativa a SSH: **Systems Manager Session Manager**.

### Modelos de compra

| Modelo | Descripción | Cuándo |
|---|---|---|
| **On-Demand** | Pago por segundo/hora sin compromiso | Cargas impredecibles o de corta duración |
| **Savings Plans** | Compromiso de gasto/hora a 1 o 3 años (hasta ~72 %) | Uso estable, flexible |
| **Reserved Instances** | Compromiso a 1 o 3 años sobre una configuración | Uso estable y conocido |
| **Spot** | Capacidad sobrante con gran descuento (hasta ~90 %); AWS puede reclamarla con aviso de 2 min | Cargas tolerantes a interrupciones (lotes, CI) |
| **Dedicated Hosts / Instances** | Servidor físico dedicado | Licencias por socket/núcleo, cumplimiento |
| **Capacity Reservations** | Reserva de capacidad en una AZ | Garantizar disponibilidad |

### Grupos de ubicación (placement groups)

- **Cluster**: baja latencia en una AZ. **Spread**: instancias en hardware distinto (máx. 7 por AZ). **Partition**: grupos aislados por rack (Hadoop, Kafka).

## Elastic Load Balancing

| Tipo | Capa | Características |
|---|---|---|
| **ALB** | 7 (HTTP/HTTPS) | Rutas y hosts, redirecciones, WebSocket, objetivos Lambda |
| **NLB** | 4 (TCP/UDP/TLS) | Latencia ultrabaja, millones de peticiones, **IP estática** |
| **GWLB** | 3 | Despliega y escala appliances de seguridad |

Realizan comprobaciones de salud y reparten entre AZ (balanceo entre zonas).

## Auto Scaling

**Auto Scaling Group (ASG)**: mantiene entre mínimo y máximo de instancias a partir de una **plantilla de lanzamiento**.

- Políticas: **seguimiento de objetivo** (mantener CPU al 50 %), por pasos, programadas, predictivas.
- Se integra con el ELB para reemplazar instancias no saludables.
- Escalado **horizontal** (más instancias) frente a vertical (instancia mayor).

## Lambda (serverless)

Código que se ejecuta por eventos; sin servidores que gestionar, pago por invocación y duración.

- Límites: **15 minutos** por invocación, memoria de 128 MB a 10 240 MB (la CPU escala con la memoria), `/tmp` de 512 MB a 10 240 MB, 1000 ejecuciones concurrentes por región por defecto (menos en cuentas nuevas). Carga útil: 6 MB síncrona y 1 MB asíncrona. Paquete: 50 MB comprimido y 250 MB descomprimido.
- Para procesos largos con estado existen las **durable functions**.
- Disparadores: API Gateway, S3, SQS, SNS, EventBridge, DynamoDB Streams, Kinesis…
- **Arranque en frío**; mitígalo con **Provisioned Concurrency** o SnapStart.
- Despliegue como ZIP o **imagen de contenedor** (hasta 10 GB). **Capas (layers)** para dependencias compartidas.

## Contenedores

| Servicio | Descripción |
|---|---|
| **ECR** | Registro de imágenes (escaneo de vulnerabilidades) |
| **ECS** | Orquestador propio de AWS (servicios, tareas) |
| **EKS** | Kubernetes gestionado (AWS administra el plano de control) |
| **Fargate** | Motor *serverless* para ECS/EKS: sin gestionar instancias |
| **ECS Express Mode** | Despliegue simplificado de aplicaciones en contenedores. AWS lo recomienda en lugar de **App Runner**, que ya no admite clientes nuevos |

ECS/EKS pueden ejecutarse sobre instancias EC2 (tú gestionas los nodos) o Fargate.

## Otros servicios de cómputo

- **Elastic Beanstalk**: PaaS para web apps (subes el código; aprovisiona el resto).
- **Lightsail**: VPS sencillos y previsibles.
- **Batch**: trabajos por lotes a gran escala.
- **Outposts**: infraestructura de AWS en tu centro de datos.

## Elegir servicio

Control total del SO → EC2 · Código corto por eventos → Lambda · Contenedores sin gestionar nodos → Fargate · Kubernetes → EKS · Web app rápida → Beanstalk / ECS Express Mode.
