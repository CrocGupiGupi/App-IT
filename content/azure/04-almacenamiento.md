# Almacenamiento

## Cuenta de almacenamiento

Contenedor de todos los servicios de datos de Azure Storage, con nombre **único global** (3–24 caracteres, minúsculas y números). El tipo recomendado es **Standard general-purpose v2** (también existen Premium para baja latencia: block blobs, file shares, page blobs).

| Servicio | Contenido |
|---|---|
| **Blob** | Objetos no estructurados (imágenes, backups, data lakes). Tipos: block, append, page |
| **Files** | Recursos compartidos SMB/NFS |
| **Queue** | Mensajería simple (hasta 64 KB por mensaje) |
| **Table** | NoSQL clave-atributo |
| **Disks** | Discos de VM (gestionados) |

```bash
az storage account create -n stdemo12345 -g rg-demo -l westeurope --sku Standard_LRS --kind StorageV2
az storage container create --account-name stdemo12345 -n fotos --auth-mode login
az storage blob upload --account-name stdemo12345 -c fotos -f foto.jpg -n foto.jpg --auth-mode login
```

## Redundancia

| Opción | Copias | Protege de |
|---|---|---|
| **LRS** (local) | 3 en un centro de datos | Fallos de disco/rack |
| **ZRS** (zona) | 3 en 3 zonas de una región | Fallo de un centro de datos |
| **GRS** (geo) | LRS + 3 copias en la región pareja | Desastre regional |
| **GZRS** (geo-zona) | ZRS + LRS en la región pareja | Fallo de zona y de región |
| **RA-GRS / RA-GZRS** | Las geo-redundantes con **lectura** en la secundaria | Igual + lectura durante la caída |

La replicación a la región secundaria es **asíncrona**.

## Niveles de acceso (blobs)

| Nivel | Uso | Almacenamiento | Acceso |
|---|---|---|---|
| **Hot** | Datos frecuentes | Más caro | Más barato |
| **Cool** | Poco frecuentes (≥30 días) | Intermedio | Más caro |
| **Cold** | Muy poco frecuentes (≥90 días) | Más barato | Más caro |
| **Archive** | Retención larga (≥180 días), **offline** | El más barato | Hay que **rehidratar** (horas) |

**Lifecycle management** mueve o elimina blobs automáticamente según reglas (p. ej. pasar a Cool a los 30 días, a Archive a los 180, borrar a los 7 años).

## Seguridad del acceso

- **Microsoft Entra ID + RBAC** (recomendado): roles como *Storage Blob Data Reader/Contributor*.
- **Claves de cuenta**: acceso total; se pueden rotar. Evítalas si es posible.
- **SAS (Shared Access Signature)**: token con permisos, caducidad y ámbito limitados; tipos *user delegation* (firmada con Entra ID, la más segura), de servicio y de cuenta. Se puede restringir por IP y protocolo.
- **Firewall y redes**: limitar a VNets o IP; **Private Endpoint** para acceso privado.
- **Cifrado** en reposo siempre activo (claves gestionadas por Microsoft o por el cliente en Key Vault) y TLS en tránsito.
- **Acceso anónimo** a contenedores: deshabilitado por defecto en cuentas nuevas.

## Protección de datos

- **Soft delete** de blobs y contenedores, **versionado**, **snapshots**, **point-in-time restore**.
- **Immutable storage (WORM)**: políticas de retención legal o por tiempo.
- **Replicación de objetos** entre cuentas/regiones.

## Azure Files

Recursos compartidos de archivos (SMB 3.x, NFS 4.1) montables desde Windows, Linux y macOS. **Azure File Sync** extiende un recurso compartido a servidores Windows locales con caché. Integra autenticación con AD DS o Entra Domain Services.

## Herramientas de movimiento de datos

- **AzCopy** (CLI de alto rendimiento), **Storage Explorer** (GUI).
- **Azure Data Box** (dispositivo físico para grandes volúmenes), **Azure Migrate** (migración de servidores), **Import/Export**.

## Discos gestionados

Standard HDD < Standard SSD < Premium SSD < Premium SSD v2 < Ultra Disk (rendimiento creciente). Cifrados por defecto (SSE); *Azure Disk Encryption* añade cifrado dentro del SO.
