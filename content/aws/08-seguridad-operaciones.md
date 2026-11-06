# Seguridad, observabilidad, IaC y arquitectura

## Servicios de seguridad

| Servicio | Función |
|---|---|
| **KMS** | Crea y gestiona claves de cifrado (CMK/claves KMS); integrado con S3, EBS, RDS…; auditado con CloudTrail. Cifrado de sobre (*envelope encryption*) |
| **CloudHSM** | HSM dedicado bajo tu control exclusivo |
| **Secrets Manager** | Guarda y **rota automáticamente** secretos (BD, API) |
| **SSM Parameter Store** | Parámetros y secretos de configuración (más simple/económico; sin rotación nativa) |
| **ACM** | Certificados TLS públicos gratuitos y renovación automática |
| **WAF** | Firewall de aplicaciones web (SQLi, XSS, limitación por IP) sobre ALB, CloudFront, API Gateway |
| **Shield** | Protección DDoS (Standard automática; Advanced de pago) |
| **GuardDuty** | Detección de amenazas inteligente (analiza CloudTrail, VPC Flow Logs, DNS) |
| **Inspector** | Escaneo de vulnerabilidades (EC2, ECR, Lambda) |
| **Macie** | Descubre datos sensibles (PII) en S3 |
| **Security Hub CSPM** | Panel central de hallazgos y comprobaciones de cumplimiento (CIS, PCI DSS, NIST). Requiere AWS Config para la mayoría de controles |
| **Config** | Historial y cumplimiento de la configuración de recursos con reglas |
| **Detective**, **Firewall Manager**, **Network Firewall**, **Artifact** (informes de cumplimiento) | |

## Observabilidad y auditoría

- **CloudWatch**: **métricas** (EC2 cada 5 min por defecto, 1 min con monitorización detallada; la memoria y el disco requieren el *CloudWatch agent*), **Logs** (grupos y flujos, filtros de métricas, Logs Insights), **Alarmas** (acciones: SNS, Auto Scaling, EC2), **Dashboards**, **Synthetics**, **Events/EventBridge**.
- **CloudTrail**: registra las **llamadas a la API** (quién, qué, cuándo, desde dónde). Activo por defecto 90 días de historial; crea un *trail* para conservarlo en S3 y habilita la **validación de integridad**.
- **X-Ray**: trazado distribuido. **AWS Health Dashboard**: eventos que afectan a tus recursos.
- **Systems Manager**: gestión operativa (Session Manager, Patch Manager, Run Command, Parameter Store, Automation).
- **Trusted Advisor**: recomendaciones de costes, rendimiento, seguridad, tolerancia a fallos y límites.

> **CloudWatch** = monitorizar rendimiento y métricas; **CloudTrail** = auditar acciones; **Config** = auditar el estado y los cambios de configuración.

## Infraestructura como código

**CloudFormation**: plantillas YAML/JSON que definen **pilas (stacks)**.

```yaml
AWSTemplateFormatVersion: "2010-09-09"
Parameters:
  NombreBucket: { Type: String }
Resources:
  Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Ref NombreBucket
      VersioningConfiguration: { Status: Enabled }
Outputs:
  Arn: { Value: !GetAtt Bucket.Arn }
```

```bash
aws cloudformation deploy --template-file plantilla.yaml --stack-name demo \
  --parameter-overrides NombreBucket=mi-bucket-unico-123
aws cloudformation delete-stack --stack-name demo
```

- **Change sets** (vista previa de cambios), **detección de deriva (drift)**, **StackSets** (multicuenta/multirregión), anidamiento, `DeletionPolicy`.
- **CDK**: define infraestructura en lenguajes de programación (TypeScript, Python…) y genera CloudFormation. **SAM** para serverless. **Terraform** es la alternativa multinube.

## Well-Architected Framework: seis pilares

1. **Excelencia operativa** · 2. **Seguridad** · 3. **Fiabilidad** · 4. **Eficiencia del rendimiento** · 5. **Optimización de costes** · 6. **Sostenibilidad**.

Principios clave: diseñar para el fallo, automatizar, desacoplar, escalar horizontalmente, privilegio mínimo, cifrar siempre, usar servicios gestionados, medir.

## Recuperación ante desastres

De menor a mayor coste y menor RTO/RPO:

1. **Backup y restauración** (horas).
2. **Pilot light**: núcleo mínimo (la base de datos replicada) siempre activo; el resto se levanta al fallar.
3. **Warm standby**: entorno completo a escala reducida.
4. **Multi-site activo-activo**: tráfico en varias regiones (casi sin pérdida).

## Costes: optimizar

- Dimensionar correctamente (*right sizing*), apagar lo no usado, Savings Plans/Reserved, Spot para tolerantes, clases de S3 y ciclo de vida, **Compute Optimizer**, etiquetado, presupuestos y alertas.

## Ruta de certificación sugerida

1. **Cloud Practitioner (CLF-C02)**: visión general, costes y responsabilidad compartida.
2. **Solutions Architect Associate (SAA-C03)**: diseño de arquitecturas resilientes, seguras, rápidas y económicas (el más versátil).
3. **Developer Associate (DVA-C03)** o **CloudOps Engineer Associate (SOA-C03, antes SysOps)**, y después las **Professional** (Solutions Architect, DevOps Engineer) o **Security Specialty**. SOA-C03 incluye contenedores y más multicuenta, multirregión e IaC.

Consejos: haz laboratorios reales con presupuesto y alertas de coste, repasa los *whitepapers* y las páginas de preguntas frecuentes (FAQ) de los servicios principales, y practica con simulacros cronometrados.

## Fuentes

- [Documentación oficial de referencia](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
