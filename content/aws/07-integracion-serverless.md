# Integración y arquitecturas serverless

## Desacoplar componentes

Las arquitecturas acopladas fallan en cadena. Con **colas y eventos** los componentes se comunican de forma **asíncrona**, escalan por separado y toleran fallos.

## Amazon SQS (colas)

Cola gestionada de mensajes; modelo **pull**.

| | Standard | FIFO |
|---|---|---|
| Orden | Mejor esfuerzo | **Estricto** (por grupo de mensajes) |
| Entrega | **Al menos una vez** (posibles duplicados) | **Exactamente una vez** (deduplicación) |
| Rendimiento | Prácticamente ilimitado | Limitado (miles/s con alto rendimiento) |

- **Visibility timeout** (el mensaje se oculta mientras se procesa, 30 s por defecto y 12 horas como máximo; si no se elimina, reaparece), **long polling** (reduce vacíos y coste), retención de 4 días por defecto y 14 como máximo, tamaño máximo **1 MiB**.
- **Dead-letter queue (DLQ)** para mensajes que fallan repetidamente.
- Patrón clásico: ASG que escala según la longitud de la cola.

## Amazon SNS (publicación/suscripción)

**Push** a múltiples suscriptores: SQS, Lambda, HTTP(S), correo, SMS, móvil. Patrón **fan-out**: un tema SNS → varias colas SQS. Filtrado de mensajes y temas FIFO.

## Amazon EventBridge

Bus de **eventos** serverless: reglas que enrutan eventos de servicios AWS, aplicaciones propias y SaaS hacia objetivos (Lambda, Step Functions, SQS…). Programación (cron), *pipes* y reintentos; sustituye a CloudWatch Events.

## Kinesis

Streaming de datos en tiempo real: **Data Streams** (ingesta con fragmentos/shards), **Data Firehose** (entrega a S3/Redshift/OpenSearch sin gestionar consumidores), **Managed Service for Apache Flink** (analítica).

| ¿Qué necesito? | Servicio |
|---|---|
| Procesar tareas una por una con reintentos | SQS |
| Notificar a muchos | SNS |
| Reaccionar a eventos y enrutar | EventBridge |
| Flujo continuo de alto volumen | Kinesis |

## API Gateway

Crea, publica y protege APIs **REST**, **HTTP** y **WebSocket**. Funciones: autenticación (IAM, Cognito, autorizadores Lambda), *throttling* y cuotas, claves de API, caché, despliegue por etapas (*stages*), integración con Lambda, HTTP o servicios AWS.

## Step Functions

Orquesta flujos de trabajo con **máquinas de estado** (Standard de larga duración, Express de alto volumen): secuencias, ramas, paralelo, bucles, reintentos y gestión de errores sin escribir código de coordinación.

## Cognito

Identidad para apps: **User Pools** (registro/inicio de sesión, JWT, MFA, federación social) e **Identity Pools** (credenciales AWS temporales para usuarios).

## Ejemplo de arquitectura serverless

```
Cliente → CloudFront → S3 (frontend estático)
        → API Gateway → Lambda → DynamoDB
                           ↘ SQS → Lambda (tareas largas) → SES (correo)
Cognito: autenticación · EventBridge: tareas programadas · CloudWatch: logs y alarmas
```

Ventajas: sin gestionar servidores, escalado automático, pago por uso. Retos: arranques en frío, límites de Lambda, depuración distribuida, bloqueo con el proveedor.

## Otros servicios de integración

- **SES** (correo), **AppSync** (GraphQL), **Amazon MQ** (ActiveMQ/RabbitMQ gestionados, para migrar sistemas existentes), **AppFlow**, **MSK** (Kafka gestionado).

## Idempotencia

Con "al menos una vez" (SQS Standard, EventBridge, Lambda asíncrona), el consumidor debe poder procesar el mismo mensaje varias veces sin efectos duplicados.
