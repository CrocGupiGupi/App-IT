# Bases de datos y mensajería

## Bases de datos relacionales

| Servicio | Descripción |
|---|---|
| **Azure SQL Database** | PaaS de SQL Server para una aplicación; modelos **DTU** o **vCore**, y *serverless* con pausa automática |
| **Azure SQL Managed Instance** | Casi 100 % compatible con SQL Server (ideal para migraciones "lift and shift") |
| **SQL Server en VM** | IaaS: control total del SO y la instancia |
| **Azure Database for PostgreSQL / MySQL** | PaaS de estos motores (servidor flexible) |

Opciones en Azure SQL: **elastic pools** (compartir recursos entre bases), **geo-replicación activa** y **grupos de conmutación por error**, copias de seguridad automáticas con restauración a un punto en el tiempo (PITR), **Always Encrypted**, enmascaramiento dinámico, auditoría, Entra ID.

## Cosmos DB

Base de datos **NoSQL multimodelo**, distribuida globalmente, con latencias de milisegundos de un dígito y SLA de disponibilidad de hasta 99,999 %.

- **API**: NoSQL (nativa), MongoDB, Cassandra, Gremlin (grafos), Table, PostgreSQL.
- **Capacidad**: aprovisionada (RU/s, con autoescalado) o *serverless*. Una **RU** (Request Unit) mide el coste de una operación.
- **Partición**: elegir bien la **clave de partición** (alta cardinalidad, distribución uniforme) es decisivo.
- **Replicación global** de varias regiones con escrituras multirregión opcionales.

### Niveles de consistencia (de más fuerte a más débil)

1. **Strong** — lecturas siempre lo último confirmado (linealizable).
2. **Bounded staleness** — retraso acotado por tiempo o número de operaciones.
3. **Session** — consistencia dentro de una sesión de cliente (**por defecto**, el más usado).
4. **Consistent prefix** — se respeta el orden de las escrituras.
5. **Eventual** — sin garantía de orden, menor latencia y coste.

## Otros servicios de datos

- **Azure Managed Redis**: caché en memoria. Sustituye a **Azure Cache for Redis**, que tiene anunciada la retirada de todos sus niveles.
- **Azure Synapse Analytics / Microsoft Fabric**: analítica y almacén de datos.
- **Azure Data Lake Storage Gen2**: lago de datos (Blob con espacio de nombres jerárquico).
- **Azure Data Factory**: orquestación de ETL/ELT.
- **Azure Databricks**, **HDInsight**, **Stream Analytics**, **Azure AI Search**.

### ¿Cuál elegir?

| Necesidad | Servicio |
|---|---|
| Esquema relacional, transacciones | Azure SQL / PostgreSQL |
| Migrar SQL Server local con mínimos cambios | SQL Managed Instance |
| Datos JSON, escala global, baja latencia | Cosmos DB |
| Caché para acelerar | Azure Managed Redis |
| Archivos y objetos | Blob / Files |

## Mensajería y eventos

| Servicio | Patrón | Cuándo |
|---|---|---|
| **Storage Queue** | Cola simple, barata | Desacoplar tareas básicas, grandes volúmenes |
| **Service Bus** | Mensajería empresarial: colas y **temas/suscripciones**, sesiones, transacciones, dead-letter, entrega ordenada | Mensajes críticos entre aplicaciones |
| **Event Grid** | **Eventos** reactivos de bajo coste (algo ocurrió: se creó un blob) | Reacciones a cambios de estado |
| **Event Hubs** | **Streaming** de telemetría a gran escala (millones de eventos/seg), compatible con Kafka | Ingesta de datos, IoT, logs |

> Diferencia clave: un **mensaje** (Service Bus) contiene datos que el receptor debe procesar; un **evento** (Event Grid) notifica que algo ocurrió; un **flujo de eventos** (Event Hubs) es telemetría continua para analizar.

## Integración y APIs

- **API Management**: puerta de entrada de APIs con políticas, cuotas, autenticación y portal para desarrolladores.
- **Logic Apps**: flujos de trabajo low-code con cientos de conectores.
- **Azure Functions**: código a medida disparado por eventos.

## Continuidad de datos

Copias de seguridad automáticas en PaaS, **geo-restauración**, replicación geográfica y grupos de conmutación por error. Define **RPO** (pérdida de datos tolerable) y **RTO** (tiempo de recuperación tolerable) antes de elegir.
