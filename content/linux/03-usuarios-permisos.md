# Usuarios, grupos y permisos

## Cuentas locales

| Fichero | Contenido |
|---|---|
| `/etc/passwd` | Usuario, UID, GID, directorio y shell |
| `/etc/shadow` | Hash de la contraseña y caducidad |
| `/etc/group` | Grupos y miembros |
| `/etc/login.defs`, `/etc/skel` | Valores por defecto y plantilla del home |

```bash
useradd -m -s /bin/bash ana       # crea con home y shell
passwd ana                        # fija la contraseña
usermod -aG wheel ana             # añade a un grupo sin quitar los demás
usermod -s /sbin/nologin servicio # impide iniciar sesión
userdel -r ana                    # borra con su home
groupadd -g 2000 devs
groupmod -n desarrollo devs
gpasswd -d ana devs               # quita a ana del grupo
id ana; groups ana
```

Sin `-a`, `usermod -G` **sustituye** los grupos secundarios: es un error clásico.

### Caducidad de contraseñas

```bash
chage -l ana               # muestra la política
chage -M 90 -m 1 -W 7 ana  # máximo 90 días, mínimo 1, aviso 7 días antes
chage -d 0 ana             # obliga a cambiarla en el próximo inicio
chage -E 2027-12-31 ana    # la cuenta caduca en esa fecha
```

Para cuentas nuevas, los valores por defecto están en `/etc/login.defs`.

## sudo

Edita siempre con `visudo`, que valida la sintaxis. En Red Hat, los miembros de `wheel` pueden usar sudo; en Debian y Ubuntu, los de `sudo`.

```bash
visudo -f /etc/sudoers.d/operadores
```

```
%operadores ALL=(ALL) /usr/bin/systemctl restart httpd
ana ALL=(ALL) NOPASSWD: ALL
```

Formato: quién, en qué máquinas, como qué usuario y qué comandos.

## Permisos ugo/rwx

`-rwxr-x---` son el tipo y los permisos de usuario (u), grupo (g) y otros (o).

| Permiso | Valor | En un fichero | En un directorio |
|---|---|---|---|
| `r` | 4 | Leer | Listar |
| `w` | 2 | Modificar | Crear y borrar dentro |
| `x` | 1 | Ejecutar | Entrar y acceder |

```bash
chmod 640 f                # rw-r-----
chmod u+x,g-w,o= f         # forma simbólica
chmod -R g+rX dir          # X: solo directorios y ejecutables
chown ana:devs f
chown -R ana dir
chgrp devs f
```

Para borrar un fichero necesitas `w` y `x` en el **directorio**, no permisos sobre el fichero.

### Permisos especiales

| Permiso | Valor | Efecto |
|---|---|---|
| SUID | 4000 | Un ejecutable corre como su propietario (`/usr/bin/passwd`) |
| SGID | 2000 | En un directorio, lo nuevo hereda su grupo |
| Sticky | 1000 | En un directorio, solo el dueño borra sus ficheros (`/tmp`) |

```bash
chmod 2770 /srv/equipo    # directorio compartido con herencia de grupo
chmod +t /srv/publico
```

### umask

Resta permisos a lo nuevo. Con `umask 022`, los ficheros nacen en 644 y los directorios en 755; con `027`, en 640 y 750. Para hacerlo permanente, añádelo a `~/.bashrc` o, para todos, a un fichero en `/etc/profile.d/`.

## ACL

Las ACL dan permisos a usuarios o grupos concretos sin cambiar propietario ni grupo.

```bash
setfacl -m u:ana:rw informe.txt
setfacl -m g:auditores:rX -R /srv/datos
setfacl -d -m g:devs:rwx /srv/equipo   # por defecto para lo nuevo
setfacl -x u:ana informe.txt           # quita una entrada
setfacl -b informe.txt                 # quita todas
getfacl informe.txt
```

Un `+` al final de los permisos en `ls -l` indica que hay ACL. La **máscara** limita los permisos efectivos de usuarios con nombre y grupos: compruébala con `getfacl` si algo no cuadra.

## Entorno y límites

- `/etc/profile` y `/etc/profile.d/*.sh`: entorno de **todos** en los shells de inicio de sesión.
- `~/.bash_profile`: de un usuario, al iniciar sesión.
- `~/.bashrc`: de un usuario, en cada shell interactivo.

Los límites de recursos se fijan en `/etc/security/limits.conf` o `/etc/security/limits.d/`:

```
ana    soft  nofile  4096
ana    hard  nofile  8192
@devs  hard  nproc   500
```

```bash
ulimit -a        # límites de la sesión actual
```

Estos límites actúan en sesiones de usuario. Para un servicio de systemd se usan directivas como `LimitNOFILE=` en su unidad.

## Usuarios de LDAP

Para que Linux use cuentas de un directorio se configura **SSSD**, que se conecta al servidor LDAP.

```bash
dnf install sssd sssd-ldap oddjob-mkhomedir
vim /etc/sssd/sssd.conf                  # dominio, URI y base de búsqueda
chmod 600 /etc/sssd/sssd.conf            # SSSD no arranca con otros permisos
authselect select sssd with-mkhomedir --force
systemctl enable --now sssd oddjobd
getent passwd ana                        # comprueba que se resuelve
```

`getent` consulta las fuentes de `/etc/nsswitch.conf`, así que muestra tanto cuentas locales como de LDAP. En Debian y Ubuntu, el equivalente de `authselect` es `pam-auth-update`.
