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
| **LRS** (local) | 3 en un centro de datos | Fallos de disco, servidor o rack |
| **ZRS** (zona) | En 3 o más zonas de una región | Fallo de un centro de datos |
| **GRS** (geo) | LRS + 3 copias en la región pareja | Desastre regional |
| **GZRS** (geo-zona) | ZRS + LRS en la región pareja | Fallo de zona y de región |
| **RA-GRS / RA-GZRS** | Las geo-redundantes con **lectura** en la secundaria | Igual + lectura durante la caída |

La replicación a la región secundaria es **asíncrona**, y para GZRS la región debe tener zonas y par. Sin RA-, la secundaria solo se puede leer tras una conmutación por error. La redundancia no protege de borrados: se replican a todas las copias.

## Niveles de acceso (blobs)

| Nivel | Uso | Almacenamiento | Acceso |
|---|---|---|---|
| **Hot** | Datos frecuentes | Más caro | Más barato |
| **Cool** | Poco frecuentes (≥30 días) | Intermedio | Más caro |
| **Cold** | Muy poco frecuentes (≥90 días) | Más barato | Más caro |
| **Archive** | Retención larga (≥180 días), **offline** | El más barato | Hay que **rehidratar** (hasta 15 horas) |

- Borrar o mover un blob antes del mínimo de días tiene **penalización por eliminación temprana**.
- Archive solo funciona con LRS, GRS y RA-GRS, **no con ZRS, GZRS ni RA-GZRS**, y solo se aplica a blobs en bloques.
- **Smart tier** mueve los datos automáticamente entre Hot, Cool y Cold según su uso.

**Lifecycle management** mueve o elimina blobs automáticamente según reglas (p. ej. pasar a Cool a los 30 días, a Archive a los 180, borrar a los 7 años). No sirve para rehidratar desde Archive.

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

Standard HDD < Standard SSD < Premium SSD < Premium SSD v2 < Ultra Disk (rendimiento creciente). Cifrados por defecto (SSE); *encryption at host* extiende el cifrado a discos temporales y cachés.

## Laboratorio: crear y leer un blob privado

Usa Bash con Azure CLI, una suscripción de prácticas y permisos para crear un grupo, una cuenta de almacenamiento y una asignación de rol. Revisa la suscripción con `az account show`. Elige nombres nuevos para el grupo y la cuenta. El precio depende de región, redundancia y operaciones. Con un blob de pocos bytes, el consumo previsto es una escritura, una lectura y almacenamiento hasta eliminar el grupo. Consulta la tarifa regional en las fuentes.

```bash
az group create -n estudio-it-blob-lab -l westeurope
# Sustituye el nombre por uno globalmente único (solo minúsculas y dígitos).
cuenta=estudioitblobcambia123
scope=$(az storage account create -g estudio-it-blob-lab -n "$cuenta" -l westeurope --sku Standard_LRS --kind StorageV2 --allow-blob-public-access false --query id -o tsv)
usuario=$(az ad signed-in-user show --query id -o tsv)
az role assignment create --assignee-object-id "$usuario" --assignee-principal-type User --role "Storage Blob Data Contributor" --scope "$scope"
```

Cuando el rol se haya propagado, ejecuta los comandos de datos con autenticación de Entra ID.

```bash
printf "%s\n" "Estudio IT" > prueba.txt
az storage container create --name practica --account-name "$cuenta" --auth-mode login
az storage blob upload --container-name practica --name prueba.txt --file prueba.txt --account-name "$cuenta" --auth-mode login
az storage blob download --container-name practica --name prueba.txt --file descargado.txt --account-name "$cuenta" --auth-mode login
cat descargado.txt
```

El fichero debe contener «Estudio IT». Si aparece un error de autorización, confirma el ámbito del rol y espera su propagación. Para limpiar, verifica el nombre del grupo y ejecuta `az group delete -n estudio-it-blob-lab --yes` solo si lo creaste para este ejercicio. Confirma su eliminación con `az group exists -n estudio-it-blob-lab`.

## Fuentes

- [Documentación oficial de referencia](https://learn.microsoft.com/en-us/azure/storage/common/storage-introduction)
- [Precios de Blob Storage](https://azure.microsoft.com/en-us/pricing/details/storage/blobs/)
