# Bases de datos

## Cómo elegir

| Necesidad | Servicio |
|---|---|
| Relacional (SQL), transacciones | **RDS** / **Aurora** |
| Clave-valor/documento a escala, latencia de ms | **DynamoDB** |
| Caché en memoria | **ElastiCache** (Redis/Valkey, Memcached) |
| Almacén de datos / analítica (OLAP) | **Redshift** |
| Documentos compatibles con MongoDB | **DocumentDB** |
| Grafos | **Neptune** |
| Series temporales | **Timestream for InfluxDB** |
| Migrar bases de datos | **DMS** (+ **SCT**) |

## Amazon RDS

Servicio gestionado para MySQL, PostgreSQL, MariaDB, Oracle, SQL Server (y Db2). AWS gestiona copias, parches, instalación y alta disponibilidad; **no tienes acceso al SO**.

- **Multi-AZ**: réplica **síncrona** en otra AZ para **alta disponibilidad** y conmutación automática (mismo endpoint DNS). Hay dos modalidades: **instancia** (una réplica en espera que no sirve lecturas) y **clúster** (dos réplicas en espera que sí sirven lecturas).
- **Réplicas de lectura (read replicas)**: réplicas **asíncronas** para **escalar lecturas** (hasta 15 por instancia), incluso entre regiones; pueden promoverse. RDS no las añade ni las quita automáticamente.
- **Backups automáticos** (retención de 0 a 35 días, restauración a un punto en el tiempo) y **snapshots manuales**.
- **Cifrado** con KMS (se elige al crear), **IAM authentication**, grupos de seguridad, subred privada.
- **RDS Proxy**: agrupa conexiones (útil con Lambda).
- Almacenamiento: gp3, io1/io2, con **autoescalado** del almacenamiento.

> Multi-AZ = disponibilidad; réplicas de lectura = rendimiento. Es una pregunta clásica.

## Amazon Aurora

Base compatible con **MySQL y PostgreSQL**, hasta 5× / 3× más rápida según AWS.

- Almacenamiento distribuido: **6 copias en 3 AZ**, crece automáticamente hasta 256 TiB en las versiones recientes (128 TiB en las anteriores).
- Hasta **15 réplicas de lectura** con conmutación muy rápida; endpoints de escritura y de lectura.
- **Aurora Serverless v2** (escala la capacidad automáticamente) y **Aurora Global Database** (replicación entre regiones, <1 s).

## DynamoDB

NoSQL clave-valor y documento, serverless, de milisegundos de un dígito a cualquier escala, con replicación en 3 AZ.

- **Clave primaria**: solo **partición** (hash) o **partición + ordenación**. Elige bien para repartir uniformemente.
- **Capacidad**: **bajo demanda** (pago por petición; es el modo por defecto y el recomendado) o **aprovisionada** (RCU/WCU, con autoescalado, para cargas estables y previsibles). 1 RCU = una lectura fuertemente consistente de hasta 4 KB por segundo; 1 WCU = una escritura de hasta 1 KB por segundo.
- **Índices secundarios**: **GSI** (global, otra clave, cualquier momento) y **LSI** (local, misma partición, solo al crear la tabla).
- **Consistencia**: eventual (por defecto) o fuerte en lectura.
- **DAX**: caché en memoria específico. **Streams**: cambios de la tabla → Lambda. **TTL**: caducidad de elementos. **Global Tables**: multirregión activo-activo. **PITR** y copias de seguridad bajo demanda. **Transacciones** ACID.
- Acceso por clave o *query*; evita los *scan* completos.

```bash
aws dynamodb put-item --table-name Pedidos --item '{"pedidoId":{"S":"p1"},"total":{"N":"25"}}'
aws dynamodb get-item --table-name Pedidos --key '{"pedidoId":{"S":"p1"}}'
```

## ElastiCache

Caché gestionada. **Redis/Valkey**: estructuras de datos, persistencia, replicación, Multi-AZ, pub/sub. **Memcached**: simple, multihilo, sin persistencia. Patrones: *lazy loading*, *write-through*, sesiones de usuario.

## Redshift

Almacén de datos columnar (OLAP), SQL sobre petabytes; **Redshift Spectrum** consulta datos en S3; versión *serverless*.

## Analítica de datos

**Athena** (SQL sobre S3, pago por TB escaneado), **Glue** (ETL y catálogo), **EMR**, **Kinesis**, **QuickSight** (BI), **Lake Formation**.

## Resiliencia y recuperación

- **RPO** (cuántos datos puedo perder) y **RTO** (cuánto puedo tardar en recuperar) determinan la estrategia.
- Backups entre regiones, réplicas multirregión, Aurora Global, DynamoDB Global Tables.

## Fuentes

- [Documentación oficial de referencia](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Welcome.html)
