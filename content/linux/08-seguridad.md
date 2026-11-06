# SELinux, certificados y seguridad

## Por qué SELinux

Los permisos habituales son **discrecionales**: el dueño decide. SELinux añade **control de acceso obligatorio** (MAC): aunque un proceso tenga permisos, la política debe autorizarlo. Si un servidor web comprometido intenta leer `/etc/shadow`, SELinux lo impide.

## Modos

| Modo | Efecto |
|---|---|
| `enforcing` | Aplica la política y registra |
| `permissive` | No bloquea, solo registra |
| `disabled` | Sin SELinux |

```bash
getenforce
setenforce 0              # permissive hasta reiniciar
setenforce 1              # enforcing hasta reiniciar
sestatus
```

Para hacerlo permanente, edita `SELINUX=enforcing` en `/etc/selinux/config`. Cambiar desde `disabled` exige reetiquetar: `touch /.autorelabel` y reiniciar.

## Contextos

Cada proceso y fichero tiene una etiqueta `usuario:rol:tipo:nivel`. En la política habitual, lo decisivo es el **tipo**: un proceso `httpd_t` puede leer ficheros `httpd_sys_content_t`.

```bash
ls -Z /var/www/html
ps -eZ | grep httpd
id -Z
```

## Contextos de ficheros

```bash
semanage fcontext -l | grep '/var/www'
semanage fcontext -a -t httpd_sys_content_t '/web(/.*)?'
restorecon -Rv /web
```

`semanage fcontext` guarda la regla y `restorecon` la aplica. `chcon` cambia la etiqueta al momento, pero un `restorecon` o un reetiquetado la deshacen.

> `mv` conserva la etiqueta de origen y `cp` toma la del destino. Es la causa típica de un error 403 tras mover ficheros a `/var/www/html`: se arregla con `restorecon`.

## Puertos

```bash
semanage port -l | grep http
semanage port -a -t http_port_t -p tcp 8088
semanage port -m -t http_port_t -p tcp 8088   # si el puerto ya tiene otro tipo
```

Además, abre el puerto en el cortafuegos.

## Booleanos

Interruptores de la política para activar comportamientos.

```bash
getsebool -a | grep httpd
semanage boolean -l | grep home
setsebool -P httpd_enable_homedirs on
```

Sin `-P`, el cambio se pierde al reiniciar.

## Diagnosticar denegaciones

```bash
ausearch -m AVC -ts recent
journalctl -t setroubleshoot
sealert -a /var/log/audit/audit.log
```

Método: reproduce el fallo, busca el AVC, y decide si falta un contexto, un puerto o un booleano. Poner `permissive` sirve para confirmar que SELinux es la causa, no como solución. El paquete `policycoreutils-python-utils` aporta `semanage`, y `setroubleshoot-server`, `sealert`.

## AppArmor

Ubuntu y SUSE usan **AppArmor**, otro sistema MAC basado en perfiles por ruta.

```bash
aa-status
aa-complain /usr/sbin/nginx
aa-enforce /usr/sbin/nginx
```

## Certificados TLS

```bash
openssl genrsa -out servidor.key 4096
openssl req -new -key servidor.key -out servidor.csr -subj "/CN=web.ejemplo.test"
openssl x509 -req -in servidor.csr -signkey servidor.key -out servidor.crt -days 365

openssl req -x509 -newkey rsa:4096 -nodes -keyout k.pem -out c.pem -days 365 \
  -subj "/CN=web.ejemplo.test" -addext "subjectAltName=DNS:web.ejemplo.test"
```

| Tarea | Comando |
|---|---|
| Ver un certificado | `openssl x509 -in c.crt -noout -text` |
| Ver caducidad | `openssl x509 -in c.crt -noout -enddate` |
| Probar un servidor | `openssl s_client -connect web:443 -servername web` |
| Verificar la cadena | `openssl verify -CAfile ca.crt c.crt` |
| Añadir una CA en RHEL | Copia a `/etc/pki/ca-trust/source/anchors/` y ejecuta `update-ca-trust` |
| Añadir una CA en Debian | Copia a `/usr/local/share/ca-certificates/` y ejecuta `update-ca-certificates` |

Los navegadores comprueban el nombre en `subjectAltName`, no en `CN`. Protege la clave privada con permisos 600.

## Lista de endurecimiento básico

- Sin acceso de root por contraseña y con claves SSH.
- Solo los servicios necesarios, comprobados con `ss -tulpn`.
- Cortafuegos activo y SELinux o AppArmor en modo de aplicación.
- Actualizaciones de seguridad al día.
- sudo con el mínimo necesario.
- Revisión de ficheros con SUID y de cuentas sin uso.

## Fuentes

- [Documentación oficial de referencia](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/10/html/using_selinux/index)
