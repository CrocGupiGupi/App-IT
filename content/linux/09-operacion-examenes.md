# Contenedores, virtualización, Git y resolución de problemas

## Contenedores con Podman

RHEL usa **Podman**: sin demonio central y con contenedores sin root. Sus comandos son casi iguales a los de Docker.

```bash
podman search nginx
podman pull registry.access.redhat.com/ubi10/ubi
podman run -d --name web -p 8080:80 -v /srv/web:/usr/share/nginx/html:Z docker.io/library/nginx
podman ps -a
podman logs web
podman exec -it web sh
podman stop web; podman rm web
```

La opción `:Z` reetiqueta el volumen para SELinux de forma privada para ese contenedor; `:z` lo comparte entre contenedores. En sistemas con Docker, los comandos equivalentes empiezan por `docker`. Consulta el campo Docker de esta app para el detalle.

### Un contenedor como servicio con Quadlet

```ini
# ~/.config/containers/systemd/web.container
[Container]
Image=docker.io/library/nginx
PublishPort=8080:80

[Install]
WantedBy=default.target
```

```bash
systemctl --user daemon-reload
systemctl --user start web
loginctl enable-linger ana   # sigue activo sin sesión iniciada
```

Para todo el sistema, los ficheros van en `/etc/containers/systemd/`.

## Máquinas virtuales con libvirt

```bash
systemctl enable --now libvirtd     # o los servicios virtqemud y similares
virsh list --all
virsh start vm1
virsh shutdown vm1                  # apagado ordenado
virsh destroy vm1                   # apagado forzado, no borra
virsh autostart vm1
virsh dominfo vm1
virsh dumpxml vm1 > vm1.xml
virsh edit vm1
virsh setvcpus vm1 2 --config --maximum
virsh setmaxmem vm1 4G --config
virsh undefine vm1 --remove-all-storage

virt-install --name vm2 --memory 2048 --vcpus 2 \
  --disk size=10 --cdrom /srv/iso/instalador.iso --os-variant detect=on
```

Los cambios con `--config` se aplican en el siguiente arranque de la máquina.

## Git básico

```bash
git config --global user.name "Ana"
git config --global user.email ana@ejemplo.test
git init
git clone https://git.ejemplo.test/equipo/proyecto.git
git status
git add fichero
git commit -m "Ajusta la configuración"
git log --oneline
git diff
git branch cambios
git switch cambios
git merge cambios
git remote -v
git pull
git push origin main
```

## Metodología de resolución de problemas

1. Define el síntoma y desde cuándo ocurre.
2. Mira el estado: `systemctl status`, `journalctl -xeu servicio`.
3. Comprueba recursos: `df -h`, `df -i`, `free -h`, `uptime`, `top`.
4. Comprueba red: `ss -tulpn`, cortafuegos y DNS.
5. Comprueba permisos y SELinux: `ls -lZ`, `ausearch -m AVC -ts recent`.
6. Cambia una sola cosa y vuelve a probar.

| Síntoma | Dónde mirar |
|---|---|
| Servicio no arranca | `systemctl status`, `journalctl -u`, prueba de sintaxis del servicio |
| Disco lleno | `df -h`, `du`, `lsof +L1`, inodos con `df -i` |
| 403 en la web | Permisos, contexto de SELinux con `ls -Z` |
| Puerto cerrado desde fuera | `ss -tulpn`, `firewall-cmd --list-all`, `semanage port -l` |
| Carga alta | `top`, `vmstat`, `iostat -xz` |
| Fallo por demasiados ficheros abiertos | `LimitNOFILE`, `ulimit -n`, `/proc/PID/limits` |

**Límites de una aplicación**: consulta `/proc/PID/limits`, `systemctl show servicio` y los puertos que ya están ocupados.

## Recuperar un sistema

| Fallo | Acción |
|---|---|
| Error en `/etc/fstab` | Entra en emergencia con la contraseña de root, `mount -o remount,rw /`, corrige y reinicia |
| GRUB dañado | Arranca desde medio de rescate, entra con `chroot` y regenera con `grub2-mkconfig` |
| Sistema de ficheros dañado | Desmonta y ejecuta `xfs_repair` o `fsck` |
| Kernel nuevo que falla | Elige el anterior en GRUB y márcalo por defecto con `grubby` |
| Contraseña de root perdida | Usa `rd.break`, como en la lección de procesos y arranque |

Un arranque de rescate se pide añadiendo `systemd.unit=rescue.target` o `systemd.unit=emergency.target` a la línea del kernel en GRUB.

## Preparar los exámenes

**LFCS**: examen práctico de 2 horas por línea de comandos. Da prioridad a operaciones y redes, que suman el 50 %. Domina `man`, porque no tendrás tus apuntes.

**RHCSA**: examen práctico sobre RHEL 10. Todo debe **seguir funcionando tras reiniciar**.

- Lee todas las tareas antes de empezar y resuelve primero lo que bloquea a las demás, como la red o el acceso.
- Prefiere comandos persistentes: `--permanent`, `-P`, `fstab`, `enable`.
- Tras `fstab`, ejecuta `mount -a`. Tras el cortafuegos, `--reload`.
- Reinicia al final y comprueba cada tarea.
- Practica en una máquina virtual con una instantánea para volver atrás.
