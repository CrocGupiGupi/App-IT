# Almacenamiento

## Ver lo que hay

```bash
lsblk -f              # discos, particiones y sistemas de ficheros
blkid                 # UUID y etiquetas
df -hT                # espacio libre por sistema de ficheros
df -i                 # inodos: un disco puede agotarlos con espacio libre
du -sh /var/* | sort -h   # qué ocupa más
lsof +L1              # ficheros borrados que siguen abiertos
```

Si `df` muestra el disco lleno pero `du` no lo explica, busca ficheros borrados que un proceso mantiene abiertos con `lsof +L1` y reinicia ese proceso.

## Particiones GPT

> Trabaja como administrador en una VM desechable con una instantánea y un disco secundario vacío de al menos 12 GiB. Los nombres de dispositivo son ejemplos. Compara el inventario antes y después de conectar el disco. Si no puedes identificarlo con certeza, detente.

```bash
lsblk -o NAME,PATH,SIZE,TYPE,FSTYPE,MOUNTPOINTS,MODEL,SERIAL
findmnt -no SOURCE /
lsblk -f /dev/vdb
wipefs -n /dev/vdb
```

Continúa solo si `/dev/vdb` coincide con el disco de laboratorio, carece de firmas y particiones y está separado del disco del sistema. `mklabel` reemplaza la tabla de particiones.

```bash
parted /dev/vdb mklabel gpt
parted /dev/vdb mkpart datos xfs 1MiB 10GiB
parted /dev/vdb print
gdisk /dev/vdb          # alternativa interactiva
udevadm settle          # espera a que aparezca el dispositivo
```

`mklabel` en un disco con datos los deja inaccesibles: compruébalo antes con `lsblk`.

## Sistemas de ficheros

| Tipo | Crear | Ampliar | Reducir |
|---|---|---|---|
| XFS | `mkfs.xfs` | `xfs_growfs /punto` (montado) | No en la práctica |
| ext4 | `mkfs.ext4` | `resize2fs /dev/...` | Sí, desmontado |
| VFAT | `mkfs.vfat` | No habitual | No habitual |

```bash
lsblk -f /dev/vdb
findmnt --source /dev/vdb1
# Solo si vdb1 es la partición nueva, sin firma ni montaje:
mkfs.xfs -L datos /dev/vdb1
mkdir -p /datos
mount /dev/vdb1 /datos
printf 'dato persistente\n' > /datos/prueba.txt
umount /datos
mount /dev/vdb1 /datos
cat /datos/prueba.txt
umount /datos
```

El resultado esperado es `dato persistente` después del segundo montaje. Si falla, revisa `lsblk -f` y `findmnt /datos`. Para limpiar el laboratorio, desmonta, retira el disco desde el hipervisor y vuelve a la instantánea. Para diagnosticar XFS desmontado puedes consultar `xfs_repair -n` antes de reparar.

## Montaje permanente

`/etc/fstab` tiene seis campos: dispositivo, punto de montaje, tipo, opciones, *dump* y orden de comprobación.

```
UUID=1234-abcd  /datos  xfs   defaults          0 0
LABEL=copias    /copias ext4  defaults,nofail   0 2
```

```bash
systemctl daemon-reload
mount -a                   # comprueba fstab antes de reiniciar
findmnt --verify
```

Usa UUID o etiquetas, porque los nombres `/dev/vdb` pueden cambiar. `nofail` evita que el arranque se detenga si falta el disco. Un error en `fstab` puede dejar el sistema en modo de emergencia: prueba siempre con `mount -a`.

## LVM

Este ejercicio es independiente del anterior. Restaura la instantánea o usa otro disco vacío dedicado. Identifica y comprueba los discos con `lsblk -f` y `wipefs -n` antes de preparar cada partición. Marca como LVM únicamente las particiones de esta práctica. El ejemplo de ampliación requiere también un PV vacío en `/dev/vdc1`.

LVM añade una capa flexible: **volúmenes físicos** (PV) forman un **grupo de volúmenes** (VG), del que salen **volúmenes lógicos** (LV).

```bash
pvcreate /dev/vdb1
vgcreate vgdatos /dev/vdb1
lvcreate -n lvweb -L 5G vgdatos
lvcreate -n lvlogs -L 1G vgdatos
lsblk -f /dev/vgdatos/lvweb
# Formatea únicamente este LV recién creado.
mkfs.xfs /dev/vgdatos/lvweb
mkdir -p /web
mount /dev/vgdatos/lvweb /web
pvs; vgs; lvs              # resumen
```

### Ampliar

```bash
lsblk -f /dev/vdc1
wipefs -n /dev/vdc1
# Tras confirmar que vdc1 pertenece al laboratorio y está vacía:
pvcreate /dev/vdc1
vgextend vgdatos /dev/vdc1          # añade un disco al grupo
lvextend -r -L +2G /dev/vgdatos/lvweb   # -r también amplía el sistema de ficheros
```

### Retirar

Comprueba con `findmnt /web` y `lvs -o vg_name,lv_name,devices` que el montaje y ambos LV corresponden al laboratorio. Los siguientes comandos borran sus datos. La secuencia presupone que añadiste el segundo PV.

```bash
umount /web
lvremove /dev/vgdatos/lvweb
lvremove /dev/vgdatos/lvlogs
vgreduce vgdatos /dev/vdc1
vgremove vgdatos
pvremove /dev/vdb1 /dev/vdc1
```

Para sacar un disco con datos del grupo, primero se mueven sus extensiones con `pvmove /dev/vdc1`. Las instantáneas se crean con `lvcreate -s`.

## Swap

Practica con una partición vacía dedicada, distinta de las usadas en los ejercicios anteriores. Comprueba con `lsblk -f /dev/vdb` y `wipefs -n /dev/vdb2` que la partición existe, no tiene datos y no está montada.

```bash
mkswap /dev/vdb2
swapon /dev/vdb2
swapon --show
```

En `/etc/fstab`:

```
UUID=5678-efgh  none  swap  defaults  0 0
```

Con un fichero en lugar de una partición:

```bash
dd if=/dev/zero of=/swapfile bs=1M count=2048
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
```

## Sistemas de ficheros virtuales

- `/proc` y `/sys`: datos del kernel y de los dispositivos.
- `tmpfs`: reside en memoria y desaparece al reiniciar.

```bash
mount -t tmpfs -o size=512M tmpfs /mnt/cache
```

## Almacenamiento remoto

**NFS**:

```bash
showmount -e servidor
mount -t nfs servidor:/export/datos /mnt/datos
```

```
servidor:/export/datos  /mnt/datos  nfs  defaults,_netdev  0 0
```

`_netdev` espera a la red antes de montar. **SMB/CIFS**: `mount -t cifs //servidor/recurso /mnt/smb -o credentials=/root/.smb`.

**Dispositivos de bloque en red**: un disco remoto aparece como local. Con iSCSI se usa `iscsiadm`; con NBD, `nbd-client servidor -N exportacion /dev/nbd0`. Después se formatea y se monta como cualquier disco.

## autofs

Monta bajo demanda y desmonta por inactividad.

```bash
dnf install autofs
```

```
# /etc/auto.master.d/datos.autofs
/remoto  /etc/auto.datos
```

```
# /etc/auto.datos
datos  -rw,sync  servidor:/export/datos
*      -rw,sync  servidor:/export/&
```

```bash
systemctl enable --now autofs
ls /remoto/datos       # se monta al acceder
```

El segundo ejemplo es un mapa con comodín: `*` toma el nombre pedido y `&` lo repite.

## Rendimiento

```bash
iostat -xz 2       # uso y espera por dispositivo (paquete sysstat)
vmstat 2           # memoria, swap, E/S y CPU
iotop              # procesos que más leen y escriben
sar -d             # histórico
```

En `iostat`, un `%util` cercano a 100 y una espera alta (`await`) indican un disco saturado.

## Fuentes

- [Documentación oficial de referencia](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/10/html/managing_storage_devices/index)
- [LVM en RHEL 10](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/10/html/configuring_and_managing_logical_volumes/index)
