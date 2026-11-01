# Fundamentos de Linux y la línea de comandos

## Qué es Linux

**Linux** es el núcleo (*kernel*): gestiona hardware, memoria, procesos y ficheros. Una **distribución** lo combina con herramientas GNU, un gestor de paquetes, un sistema de inicio (normalmente **systemd**) y soporte.

| Familia | Ejemplos | Paquetes | Uso típico |
|---|---|---|---|
| Red Hat | RHEL, Fedora, Rocky, AlmaLinux | RPM, `dnf` | Empresas, RHCSA |
| Debian | Debian, Ubuntu | DEB, `apt` | Servidores, cloud, escritorio |
| SUSE | SLES, openSUSE | RPM, `zypper` | Empresas |

Para practicar RHCSA usa una máquina virtual con RHEL (Red Hat ofrece una suscripción gratuita para desarrolladores) o con Rocky o AlmaLinux 10. Para LFCS, cualquier distribución general sirve, porque el examen no se centra en tareas de una distribución concreta.

## Jerarquía de directorios

En Linux todo cuelga de `/`, sin letras de unidad.

| Ruta | Contenido |
|---|---|
| `/etc` | Configuración del sistema |
| `/home` | Directorios personales |
| `/root` | Directorio personal de root |
| `/var` | Datos variables: logs, colas, bases de datos |
| `/usr` | Programas y bibliotecas instalados |
| `/tmp` | Temporales |
| `/boot` | Kernel y gestor de arranque |
| `/dev` | Dispositivos |
| `/proc`, `/sys` | Sistemas de ficheros virtuales con datos del kernel |
| `/mnt`, `/media` | Puntos de montaje |

## Moverse y trabajar con ficheros

```bash
pwd                       # directorio actual
ls -la                    # listado largo, incluidos ocultos
cd /etc; cd -; cd ~       # ir a una ruta, volver, ir a tu home
mkdir -p a/b/c            # crea también los directorios padre
touch fichero             # crea vacío o actualiza la fecha
cp -a origen destino      # copia conservando permisos y fechas
mv viejo nuevo            # mueve o renombra
rm fichero; rm -r dir     # borra (no hay papelera)
stat fichero              # metadatos completos
file fichero              # tipo real del contenido
```

Las rutas **absolutas** empiezan por `/`; las **relativas** parten del directorio actual (`.` es el actual y `..` el padre). Los comodines los expande el shell: `*` cualquier texto, `?` un carácter, `[abc]` uno de esos caracteres.

```bash
cat f; less f; head -n 5 f; tail -f /var/log/messages
wc -l f                   # cuenta líneas
```

## Enlaces

| | Enlace duro | Enlace simbólico |
|---|---|---|
| Comando | `ln origen nombre` | `ln -s origen nombre` |
| Qué es | Otro nombre para el mismo inodo | Un fichero que apunta a una ruta |
| Entre sistemas de ficheros | No | Sí |
| A directorios | No | Sí |
| Si se borra el original | Los datos siguen | Queda roto |

## Empaquetar y comprimir

```bash
tar -czf copia.tar.gz dir/      # crear con gzip
tar -cjf copia.tar.bz2 dir/     # crear con bzip2
tar -tf copia.tar.gz            # listar contenido
tar -xzf copia.tar.gz -C /destino   # extraer en otra ruta
gzip f; gunzip f.gz; bzip2 f; bunzip2 f.bz2
```

Letras de `tar`: `c` crear, `x` extraer, `t` listar, `f` fichero, `z` gzip, `j` bzip2, `J` xz, `v` detalle.

## Documentación

La RHCSA no permite Internet ni apuntes: aprende a encontrar la ayuda en el propio sistema.

```bash
man ls              # página de manual
man 5 crontab       # sección 5: formatos de fichero
man -k firewall     # busca por palabra clave (equivale a apropos)
info coreutils
ls /usr/share/doc   # documentación de los paquetes
comando --help
```

Secciones útiles de `man`: 1 comandos, 5 formatos de ficheros, 8 administración.

> `man 5 fstab`, `man nmcli-examples` y `man semanage-fcontext` traen ejemplos que puedes copiar durante un examen práctico.

## Conectarse y cambiar de usuario

```bash
ssh ana@servidor            # sesión remota
su - ana                    # cambia de usuario con su entorno
sudo comando                # ejecuta con privilegios
sudo -i                     # shell de root
exit                        # sale de la sesión
```

El guion de `su -` importa: sin él conservas el entorno del usuario anterior.
