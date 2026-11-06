# Paquetes y repositorios

## Gestores de paquetes

| Tarea | Red Hat (`dnf`) | Debian y Ubuntu (`apt`) |
|---|---|---|
| Actualizar lista | `dnf check-update` | `apt update` |
| Instalar | `dnf install httpd` | `apt install apache2` |
| Quitar | `dnf remove httpd` | `apt remove apache2` |
| Actualizar todo | `dnf upgrade` | `apt upgrade` |
| Buscar | `dnf search texto` | `apt search texto` |
| Información | `dnf info httpd` | `apt show apache2` |
| Qué paquete da un fichero | `dnf provides '*/semanage'` | `apt-file search semanage` |
| Historial | `dnf history` | `/var/log/apt/history.log` |

Para instalar un conjunto de paquetes en Red Hat: `dnf group list` y `dnf group install "Nombre"`.

> `dnf provides` te salva cuando falta un comando: por ejemplo, `semanage` está en un paquete cuyo nombre no es evidente.

## Paquetes sueltos

```bash
dnf install ./paquete.rpm      # resuelve dependencias
rpm -qa                        # todo lo instalado
rpm -qi bash                   # información
rpm -ql bash                   # ficheros del paquete
rpm -qf /usr/bin/ls            # a qué paquete pertenece un fichero
rpm -qc openssh-server         # ficheros de configuración
rpm -V openssh-server          # verifica cambios frente al paquete

dpkg -i paquete.deb            # en Debian
dpkg -l; dpkg -L bash; dpkg -S /usr/bin/ls
```

Con `apt install ./paquete.deb` se resuelven dependencias, algo que `dpkg -i` no hace.

## Repositorios en Red Hat

Se definen en `/etc/yum.repos.d/*.repo`:

```ini
[appstream-local]
name=AppStream local
baseurl=http://repo.ejemplo.test/rhel10/AppStream
enabled=1
gpgcheck=1
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-redhat-release
```

```bash
dnf repolist                  # repositorios activos
dnf repolist --all
dnf config-manager --add-repo http://repo.ejemplo.test/rhel10/BaseOS
dnf config-manager --set-enabled crb
dnf clean all
rpm --import https://repo.ejemplo.test/clave.pub
```

`gpgcheck=1` valida las firmas: no lo desactives en producción.

Una imagen ISO puede servir de repositorio local: móntala en `/mnt/iso` y usa `baseurl=file:///mnt/iso/BaseOS`.

### Red Hat Content Delivery Network

Un sistema RHEL obtiene los repositorios oficiales al registrarse:

```bash
rhc connect                       # o subscription-manager register
subscription-manager repos --list-enabled
```

## Repositorios en Debian y Ubuntu

Las fuentes están en `/etc/apt/sources.list.d/`. Los ficheros `.sources` modernos declaran `URIs`, `Suites`, `Components` y `Signed-By`.

```
Types: deb
URIs: https://repo.ejemplo.test/debian
Suites: stable
Components: main
Signed-By: /etc/apt/keyrings/ejemplo.gpg
```

Tras añadir una fuente, ejecuta `apt update`.

## Flatpak

Flatpak instala aplicaciones de escritorio aisladas, con sus propias dependencias. El objetivo está en la RHCSA actual.

```bash
flatpak remotes
flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
flatpak search editor
flatpak install flathub org.gnome.Calculator
flatpak list
flatpak uninstall org.gnome.Calculator
flatpak update
```

Una instalación es de sistema por defecto; con `--user` queda solo para tu usuario.

## Mantener el sistema al día

```bash
dnf check-update
dnf upgrade --security        # solo actualizaciones de seguridad
dnf history undo 12           # revierte una transacción
needs-restarting -r           # indica si hace falta reiniciar
```

Para automatizar las actualizaciones existe `dnf-automatic` en Red Hat y `unattended-upgrades` en Debian y Ubuntu.

## Fuentes

- [Documentación oficial de referencia](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/10/html/managing_software_with_the_dnf_tool/index)
