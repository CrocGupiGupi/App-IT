# Redes: VPC, Route 53 y CloudFront

## VPC (Virtual Private Cloud)

Red virtual aislada **regional**, que abarca todas las AZ. Defines un bloque CIDR IPv4 (`/16` a `/28`) y la divides en **subredes**, cada una dentro de **una AZ**. Cada cuenta tiene una **VPC por defecto** por región.

- AWS reserva **5 direcciones** por subred.
- **Subred pública**: su tabla de rutas tiene una ruta `0.0.0.0/0` hacia un **Internet Gateway (IGW)**; las instancias necesitan IP pública/Elastic IP.
- **Subred privada**: sin ruta directa a Internet. Para salida (actualizaciones) usa un **NAT Gateway**. El **zonal** va en una subred pública y hay que crear uno por AZ; el **regional** no necesita subred pública y se extiende solo por las AZ con carga, pero no admite NAT privado.
- **Tabla de rutas**: define a dónde va cada destino.
- **Egress-only Internet Gateway** para IPv6 saliente.

### Arquitectura típica de tres capas

```
Internet → ALB (subredes públicas, 2+ AZ)
         → Aplicación EC2/ECS (subredes privadas)
         → Base de datos RDS (subredes privadas aisladas)
```

## Seguridad de red

| | Security Group | Network ACL |
|---|---|---|
| Nivel | Instancia / ENI | Subred |
| Estado | **Con estado** (stateful): la respuesta se permite sola | **Sin estado** (stateless): hay que permitir ida y vuelta |
| Reglas | Solo **Allow** | Allow y **Deny**, numeradas |
| Evaluación | Todas las reglas | En orden por número |

Los grupos de seguridad pueden referenciar a otros grupos de seguridad (la forma habitual de conectar capas).

## Conectividad

| Opción | Descripción |
|---|---|
| **VPC Peering** | Conexión 1:1 entre VPC (misma o distinta cuenta/región). **No transitiva**. CIDR sin solapamiento |
| **Transit Gateway** | Hub central que conecta muchas VPC y redes locales (transitivo) |
| **Site-to-Site VPN** | Túnel IPsec cifrado sobre Internet hacia tu red local (rápido de montar) |
| **Direct Connect** | Enlace físico **dedicado** y privado; menor latencia y ancho de banda constante (tarda semanas en aprovisionarse) |
| **Client VPN** | Acceso remoto de usuarios |
| **PrivateLink** | Expone un servicio de forma privada a otras VPC sin Internet |

### VPC Endpoints (acceso privado a servicios de AWS)

- **Gateway endpoint**: solo **S3 y DynamoDB**; gratuito; se añade a la tabla de rutas.
- **Interface endpoint** (PrivateLink): ENI con IP privada para la mayoría de servicios; de pago.

Así las instancias privadas acceden a S3 sin pasar por el NAT ni por Internet.

## Route 53 (DNS)

DNS escalable y altamente disponible, con registro de dominios y comprobaciones de salud.

Registros: `A`, `AAAA`, `CNAME`, `MX`, `TXT`, y el registro **Alias** (propio de AWS; apunta a recursos AWS —ALB, CloudFront, S3—, funciona en el ápice de la zona y no se cobra).

### Políticas de enrutamiento

| Política | Uso |
|---|---|
| **Simple** | Un recurso |
| **Ponderada** | Repartir porcentajes (pruebas A/B, migraciones) |
| **Latencia** | A la región con menor latencia |
| **Failover** | Activo/pasivo con comprobación de salud |
| **Geolocalización** | Según el país/continente del usuario |
| **Geoproximidad** | Según ubicación y sesgo configurable |
| **Multivalor** | Varias respuestas con salud |

## CloudFront (CDN)

Red de distribución de contenido con cientos de *edge locations*. Reduce la latencia y la carga del origen (S3, ALB, EC2, HTTP).

- **Caché** con TTL, invalidaciones, HTTPS, firma de URLs/cookies, **Origin Access Control** (para que S3 solo sea accesible vía CloudFront), integración con **WAF** y **Shield**, Lambda@Edge / CloudFront Functions.

## Global Accelerator

Dos IP anycast estáticas que enrutan el tráfico TCP/UDP por la red troncal de AWS hacia el endpoint óptimo; mejora latencia y conmutación por error (distinto de CloudFront, que **cachea**).

## Diagnóstico

**VPC Flow Logs** (tráfico aceptado/rechazado), **Reachability Analyzer**, **Traffic Mirroring**.

## Elegir

Aislar la BD → subred privada + SG que solo acepta tráfico del SG de la app · Salida a Internet desde subred privada → NAT Gateway · Acceder a S3 privadamente → gateway endpoint · Conectar muchas VPC → Transit Gateway.

## Fuentes

- [Documentación oficial de referencia](https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html)
