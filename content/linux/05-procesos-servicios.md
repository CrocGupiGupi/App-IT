# Procesos, servicios y arranque

## Procesos

```bash
ps aux --sort=-%cpu | head        # los que más CPU usan
ps -ef | grep sshd
pgrep -a nginx
top                               # P ordena por CPU, M por memoria, k mata, q sale
free -h                           # memoria
uptime                            # carga media
kill PID                          # SIGTERM: pide terminar
kill -9 PID                       # SIGKILL: fuerza el final
pkill -u ana                      # por usuario
```

**Prioridad**: el valor *nice* va de -20 (más prioridad) a 19 (menos). Solo root puede bajarlo.

```bash
nice -n 10 tar -czf copia.tgz /srv
renice -n 5 -p 1234
```

**Trabajos**: `comando &` lo lanza en segundo plano, `jobs` los lista, `fg` y `bg` los mueven y `Ctrl+z` suspende.

## systemd

```bash
systemctl status sshd
systemctl start|stop|restart|reload sshd
systemctl enable --now sshd        # activa en el arranque y arranca ya
systemctl disable sshd
systemctl is-enabled sshd
systemctl mask httpd               # impide arrancarlo
systemctl list-units --type=service --state=failed
systemctl daemon-reload            # tras cambiar ficheros de unidad
systemctl show sshd -p LimitNOFILE
```

### Crear un servicio

Las unidades propias van en `/etc/systemd/system/`.

```ini
# /etc/systemd/system/miapp.service
[Unit]
Description=Mi aplicación
After=network-online.target

[Service]
ExecStart=/usr/local/bin/miapp
User=miapp
Restart=on-failure
LimitNOFILE=4096

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
systemctl enable --now miapp
systemctl edit sshd       # crea un drop-in sin tocar la unidad del paquete
```

## Targets

| Target | Equivale a |
|---|---|
| `multi-user.target` | Texto, varios usuarios y red |
| `graphical.target` | Con entorno gráfico |
| `rescue.target` | Mantenimiento de un solo usuario |
| `emergency.target` | Mínimo, con la raíz en solo lectura |

```bash
systemctl get-default
systemctl set-default multi-user.target
systemctl isolate rescue.target
systemctl reboot; systemctl poweroff
```

## Tareas programadas

```bash
at now + 10 minutes     # escribe los comandos y termina con Ctrl+d
atq; atrm 3
crontab -e              # cron del usuario
crontab -l
crontab -u ana -e       # como root, para otro usuario
```

Formato de cron: minuto, hora, día del mes, mes, día de la semana y comando.

```
30 2 * * 1-5 /usr/local/bin/copia.sh     # 02:30 de lunes a viernes
*/15 * * * * /usr/local/bin/comprueba.sh # cada 15 minutos
```

Las tareas de sistema van en `/etc/cron.d/` y en esos ficheros, además, hay que indicar el usuario tras los cinco campos de tiempo.

### Temporizadores de systemd

```ini
# /etc/systemd/system/copia.timer
[Timer]
OnCalendar=*-*-* 02:30:00
Persistent=true

[Install]
WantedBy=timers.target
```

Activa una unidad `copia.service` con el mismo nombre. `Persistent=true` recupera ejecuciones perdidas si el equipo estaba apagado.

```bash
systemctl enable --now copia.timer
systemctl list-timers
systemd-analyze calendar '*-*-* 02:30:00'
```

## Logs

```bash
journalctl -u sshd --since today
journalctl -p err -b           # errores desde el último arranque
journalctl -f                  # en vivo
journalctl --list-boots
journalctl -b -1               # arranque anterior
ls /var/log                    # messages, secure, syslog, auth.log
```

**Conservar el journal tras reiniciar**:

```bash
mkdir -p /etc/systemd/journald.conf.d
printf '[Journal]\nStorage=persistent\n' > /etc/systemd/journald.conf.d/persistente.conf
systemctl restart systemd-journald
```

## Perfiles de tuned

```bash
systemctl enable --now tuned
tuned-adm list
tuned-adm active
tuned-adm recommend
tuned-adm profile throughput-performance
```

## Parámetros del kernel

```bash
sysctl net.ipv4.ip_forward              # consulta
sysctl -w net.ipv4.ip_forward=1         # hasta reiniciar
echo 'net.ipv4.ip_forward = 1' > /etc/sysctl.d/90-red.conf
sysctl --system                         # aplica los ficheros
```

Los mismos valores aparecen en `/proc/sys`, con los puntos convertidos en barras.

## Cargador de arranque

Los ajustes persistentes en Red Hat se aplican con `grubby`:

```bash
grubby --info=DEFAULT
grubby --update-kernel=ALL --args="quiet"
grubby --set-default=/boot/vmlinuz-VERSION
```

La opción general es editar `/etc/default/grub` y regenerar: `grub2-mkconfig -o /boot/grub2/grub.cfg`, o `update-grub` en Debian y Ubuntu.

## Recuperar el acceso de root

1. Reinicia y, en el menú de GRUB, pulsa `e` sobre la entrada.
2. Al final de la línea `linux`, añade `rd.break` y arranca con `Ctrl+x`.
3. Ejecuta estos comandos:

```bash
mount -o remount,rw /sysroot
chroot /sysroot
passwd root
touch /.autorelabel     # SELinux reetiqueta en el siguiente arranque
exit
exit
```

> Sin `/.autorelabel`, el nuevo `/etc/shadow` puede quedar con una etiqueta de SELinux incorrecta e impedir el inicio de sesión.
