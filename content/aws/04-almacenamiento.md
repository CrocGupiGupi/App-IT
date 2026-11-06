# Almacenamiento: S3, EBS y EFS

## Tipos de almacenamiento

| Tipo | Servicio | Uso |
|---|---|---|
| **Objetos** | S3 | Ficheros, backups, data lakes, sitios estáticos |
| **Bloque** | EBS | Disco de una instancia EC2 |
| **Archivos** | EFS, FSx | Sistema de ficheros compartido (NFS, SMB, Lustre, ONTAP) |

## Amazon S3

Almacén de objetos prácticamente ilimitado. Estructura: **buckets** (nombre único global, regional) con **objetos** (clave + datos + metadatos, hasta 48,8 TiB; *multipart* recomendado desde 100 MB, con hasta 10 000 partes de 5 MiB a 5 GiB). Durabilidad de **11 nueves (99,999999999 %)**.

### Clases de almacenamiento

| Clase | Uso |
|---|---|
| **S3 Standard** | Acceso frecuente |
| **Intelligent-Tiering** | Patrón de acceso desconocido o cambiante (mueve solo entre niveles) |
| **Standard-IA** | Acceso poco frecuente, recuperación rápida (≥30 días) |
| **One Zone-IA** | Poco frecuente, **una sola AZ**, datos recreables |
| **Glacier Instant Retrieval** | Archivo con acceso en milisegundos (≥90 días) |
| **Glacier Flexible Retrieval** | Archivo; recuperación de minutos a horas (≥90 días) |
| **Glacier Deep Archive** | El más barato; recuperación en horas (≥180 días) |

**Lifecycle rules** transicionan objetos entre clases y los caducan.

### Funciones

- **Versionado** (protege frente a borrados y sobrescrituras; con **MFA Delete**), **Object Lock** (WORM), **replicación** entre buckets (CRR otra región / SRR misma región; requiere versionado).
- **Cifrado** (siempre activo en reposo): **SSE-S3**, **SSE-KMS** (auditable con CloudTrail), SSE-C (claves del cliente) y cifrado en el cliente.
- **Alojamiento web estático**, **eventos** (S3 → Lambda/SQS/SNS/EventBridge), **Transfer Acceleration**, **Multi-Region Access Points**. **S3 Select** ya no está disponible para clientes nuevos; usa Athena para consultar datos en S3.
- Consistencia: **fuerte** de lectura tras escritura.

### Control de acceso

- **Block Public Access** (activado por defecto; manténlo así), **bucket policies**, IAM, ACL (desaconsejadas), **access points**.
- **URL prefirmadas**: acceso temporal a un objeto privado.
- **Pre-signed POST** para subidas directas desde el navegador.

```bash
aws s3 mb s3://mi-bucket-unico-123
aws s3 cp informe.pdf s3://mi-bucket-unico-123/docs/
aws s3 sync ./web s3://mi-bucket-unico-123 --delete
aws s3 presign s3://mi-bucket-unico-123/docs/informe.pdf --expires-in 600
```

## Amazon EBS

Discos en bloque de red para EC2, **atados a una AZ**. Persisten independientemente de la instancia (según `DeleteOnTermination`).

| Tipo | Medio | Uso |
|---|---|---|
| **gp3 / gp2** | SSD uso general | Valor por defecto; en gp3 IOPS y rendimiento se configuran sin depender del tamaño |
| **io2 / io1** | SSD IOPS aprovisionadas | Bases de datos críticas |
| **st1** | HDD optimizado para rendimiento | Big data, logs secuenciales |
| **sc1** | HDD en frío | Datos de acceso infrecuente |

- **Snapshots**: incrementales, guardados en S3; sirven para copias, migrar entre AZ/regiones y crear AMIs. **Cifrado** con KMS.
- Un volumen se conecta a una instancia a la vez (salvo io1/io2 **Multi-Attach**).
- **Data Lifecycle Manager** automatiza snapshots.

## Amazon EFS

NFS gestionado, **multi-AZ**, elástico, accesible por miles de instancias Linux a la vez. Modos de rendimiento y clases de almacenamiento (Standard, IA). Ideal para contenido compartido y sistemas de ficheros de contenedores.

## FSx

- **FSx for Windows File Server** (SMB, AD), **FSx for Lustre** (HPC), **FSx for NetApp ONTAP**, **FSx for OpenZFS**.

## Otros

- **Storage Gateway**: puente híbrido (File, Volume, Tape Gateway).
- **AWS Backup**: copias centralizadas de EBS, RDS, EFS, DynamoDB…
- **DataSync** (transferencias en línea), **Transfer Family** (SFTP) y **Data Transfer Terminal** (transferencia física). **Snowball Edge** ya no está disponible para clientes nuevos.

## Elegir

Archivos estáticos y backups → S3 · Disco de una EC2 → EBS · Compartido entre muchas EC2 Linux → EFS · Compartido Windows → FSx for Windows.

## Laboratorio: cargar y descargar un objeto privado

Usa Bash con AWS CLI y credenciales de una cuenta de prácticas autorizadas para gestionar un bucket. Confirma la cuenta con `aws sts get-caller-identity`. Se prevén una carga, una descarga y el almacenamiento de un objeto de pocos bytes hasta borrarlo. Consulta la tarifa regional en las fuentes.

```bash
region=eu-west-1
# Elige un nombre de bucket nuevo y globalmente único.
bucket=estudio-it-s3-cambia-123456
aws s3api create-bucket --bucket "$bucket" --region "$region" --create-bucket-configuration LocationConstraint="$region"
aws s3api get-public-access-block --bucket "$bucket" --region "$region"
printf "%s\n" "Estudio IT" > prueba.txt
aws s3 cp prueba.txt "s3://$bucket/prueba.txt" --region "$region"
aws s3 cp "s3://$bucket/prueba.txt" descargado.txt --region "$region"
cat descargado.txt
```

Comprueba que los cuatro controles de bloqueo público son `true` y que el fichero descargado contiene «Estudio IT». Si aparece `AccessDenied`, revisa el perfil y sus permisos. Si falla la creación, detente y elige un nombre nuevo. Borra solo el objeto y el bucket de este laboratorio.

```bash
aws s3 rm "s3://$bucket/prueba.txt" --region "$region"
aws s3api delete-bucket --bucket "$bucket" --region "$region"
```

## Fuentes

- [Documentación oficial de referencia](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html)
- [Precios de Amazon S3](https://aws.amazon.com/s3/pricing/)
