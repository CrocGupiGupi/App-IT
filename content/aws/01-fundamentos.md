# Fundamentos, infraestructura global y cuentas

## Qué es AWS

Plataforma de servicios cloud de Amazon con modelo de **pago por uso**. Seis ventajas de la nube: cambiar CapEx por OpEx, economías de escala, no adivinar la capacidad, mayor velocidad y agilidad, no gastar en mantener centros de datos, y llegar al mundo en minutos.

## Infraestructura global

- **Región**: ubicación geográfica con varias zonas de disponibilidad (`eu-west-1` Irlanda, `eu-south-2` España…). Los datos **no salen de la región** salvo que tú lo decidas. Criterios para elegir región: **cumplimiento/legal**, **latencia**, **precio**, **disponibilidad de servicios**.
- **Zona de disponibilidad (AZ)**: uno o más centros de datos independientes dentro de una región, conectados con baja latencia. Diseña para **varias AZ**.
- **Edge locations** y **Regional Edge Caches**: puntos de presencia para CloudFront, Route 53 y Global Accelerator.
- **Local Zones** y **Wavelength**: cómputo más cercano al usuario final; **Outposts**: infraestructura de AWS en tu centro de datos.

## Responsabilidad compartida

- **AWS**: seguridad **DE** la nube (hardware, instalaciones, red, hipervisor, servicios gestionados a nivel de infraestructura).
- **Cliente**: seguridad **EN** la nube (datos, IAM, configuración del SO invitado y de firewalls, cifrado, parches de EC2).
- Varía según el servicio: en EC2 (IaaS) el cliente parchea el SO; en RDS, AWS parchea el motor y el SO.

## Modelos de precios

- **Pago por uso**, **ahorro por compromiso** (Savings Plans, Reserved) y **descuento por volumen** (por niveles).
- **Capa gratuita**: las cuentas nuevas reciben 100 USD en créditos y pueden ganar hasta 100 más. Con el **plan gratuito**, la cuenta se cierra a los 6 meses o al agotar los créditos, y solo da acceso a un grupo limitado de servicios. El **plan de pago** da acceso a todo. Más de 30 servicios son siempre gratuitos dentro de ciertos límites mensuales.
- Herramientas: **Pricing Calculator**, **Cost Explorer**, **AWS Budgets** (alertas), **Cost and Usage Report**, etiquetas de asignación de costes.
- Transferencia de datos: la **entrada** es gratuita; la salida a Internet se cobra, y entre regiones también. Entre AZ se cobra en algunos casos.
- **IPv4 públicas**: cada una cuesta 0,005 USD por hora, esté en uso o no.
- **Planes de soporte**: Basic (incluido), Business Support+ (producción), Enterprise Support (cargas críticas para el negocio) y Unified Operations (misión crítica).

## Cuentas y Organizations

- **Cuenta raíz**: creada con el correo; activa **MFA**, no la uses para el día a día y no crees claves de acceso para ella.
- **AWS Organizations**: agrupa cuentas en **OUs**, factura **consolidada** y aplica **SCP** (políticas de control de servicio) que limitan lo que pueden hacer las cuentas (no conceden permisos, solo establecen el máximo).
- **Control Tower**: configura una *landing zone* multicuenta con guardarraíles.
- Varias cuentas separan entornos (dev/prod) y limitan el radio de impacto.

## Formas de interactuar

- **Consola de administración** (web), **AWS CLI**, **SDK** (Python/boto3, JS, Java…), **CloudShell** (terminal en el navegador), **IaC** (CloudFormation, CDK, Terraform).

```bash
aws configure                    # o: aws configure sso
aws sts get-caller-identity      # ¿quién soy?
aws s3 ls
aws ec2 describe-regions --output table
aws ec2 describe-instances --query "Reservations[].Instances[].{id:InstanceId,estado:State.Name}" --output table
```

> Perfil y región se resuelven así: parámetros de la línea de comandos → variables de entorno (`AWS_PROFILE`, `AWS_REGION`) → ficheros `~/.aws/config` y `~/.aws/credentials`.

## Marco de adopción

**AWS Well-Architected Framework** (seis pilares: excelencia operativa, seguridad, fiabilidad, eficiencia del rendimiento, optimización de costes y sostenibilidad) y **Cloud Adoption Framework (CAF)**. Las **7 R** de la migración: Retire, Retain, Rehost, Relocate, Repurchase, Replatform y Refactor.

## Fuentes

- [Documentación oficial de referencia](https://docs.aws.amazon.com/whitepapers/latest/aws-overview/introduction.html)
