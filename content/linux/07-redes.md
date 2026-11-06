# Redes

## Consultar la configuración

```bash
ip -br addr             # interfaces y direcciones
ip route                # tabla de rutas
ip -6 addr
ss -tulpn               # puertos en escucha y sus procesos
hostnamectl
resolvectl status       # DNS con systemd-resolved
```

## NetworkManager con nmcli

La herramienta estándar en RHEL. Los perfiles se guardan en `/etc/NetworkManager/system-connections/`.

```bash
nmcli device status
nmcli connection show
nmcli con add con-name lan ifname eth0 type ethernet \
  ipv4.method manual ipv4.addresses 192.168.1.10/24 \
  ipv4.gateway 192.168.1.1 ipv4.dns 192.168.1.53
nmcli con mod lan +ipv4.dns 1.1.1.1
nmcli con mod lan ipv6.method manual ipv6.addresses 2001:db8::10/64
nmcli con mod lan connection.autoconnect yes
nmcli con up lan
nmcli con reload
```

`man nmcli-examples` trae casos listos para adaptar. En Ubuntu, la configuración suele estar en `/etc/netplan/*.yaml` y se aplica con `netplan apply`.

### Rutas estáticas

```bash
ip route add 10.20.0.0/16 via 192.168.1.254          # hasta reiniciar
nmcli con mod lan +ipv4.routes "10.20.0.0/16 192.168.1.254"   # permanente
nmcli con up lan
```

### Bond y bridge

**Bond** une interfaces para tolerancia a fallos o más ancho de banda. **Bridge** actúa como un conmutador, por ejemplo para máquinas virtuales.

```bash
nmcli con add type bond con-name bond0 ifname bond0 bond.options "mode=active-backup"
nmcli con add type ethernet con-name bond0-p1 ifname eth1 controller bond0 port-type bond
nmcli con add type ethernet con-name bond0-p2 ifname eth2 controller bond0 port-type bond
nmcli con up bond0
cat /proc/net/bonding/bond0

nmcli con add type bridge con-name br0 ifname br0
nmcli con add type ethernet con-name br0-p1 ifname eth3 controller br0 port-type bridge
```

## Nombres y hora

```bash
hostnamectl set-hostname web1.ejemplo.test
getent hosts web1
dig ejemplo.test
```

`/etc/hosts` da nombres locales y `/etc/resolv.conf` los servidores DNS, normalmente gestionado por NetworkManager. El orden de consulta está en `/etc/nsswitch.conf`.

**Sincronizar la hora** con chrony:

```bash
timedatectl
timedatectl set-timezone Europe/Madrid
timedatectl set-ntp true
```

```
# /etc/chrony.conf
server hora.ejemplo.test iburst
```

```bash
systemctl restart chronyd
chronyc sources -v
chronyc tracking
```

En Ubuntu, el servicio se llama `chrony` y también puede usarse `systemd-timesyncd`.

## Diagnóstico

```bash
ping -c 3 192.168.1.1
tracepath destino
curl -I http://localhost
nc -zv servidor 443          # comprueba un puerto
tcpdump -ni eth0 port 53     # captura tráfico
```

Orden práctico: enlace (`ip link`), dirección (`ip addr`), ruta (`ip route`), nombre (`getent hosts`), puerto (`ss -tulpn`), cortafuegos y SELinux.

## OpenSSH

```bash
ssh-keygen -t ed25519
ssh-copy-id ana@servidor
ssh ana@servidor
scp fichero ana@servidor:/tmp/
sftp ana@servidor
rsync -avz dir/ ana@servidor:/srv/dir/
ssh -L 8080:localhost:80 ana@servidor   # túnel local
```

Cliente: `~/.ssh/config`. Permisos estrictos: `~/.ssh` en 700 y `authorized_keys` en 600.

Servidor: `/etc/ssh/sshd_config` o, mejor, un fichero en `/etc/ssh/sshd_config.d/`.

```
PasswordAuthentication no
PermitRootLogin no
AllowUsers ana
```

```bash
sshd -t                 # valida la configuración
systemctl reload sshd
```

Mantén abierta tu sesión al cambiarlo y prueba con otra: un error puede dejarte fuera.

## Cortafuegos con firewalld

```bash
firewall-cmd --state
firewall-cmd --get-active-zones
firewall-cmd --list-all
firewall-cmd --permanent --add-service=https
firewall-cmd --permanent --add-port=8080/tcp
firewall-cmd --permanent --remove-service=cockpit
firewall-cmd --reload
firewall-cmd --permanent --zone=internal --add-source=10.0.0.0/8
```

Sin `--permanent`, el cambio se pierde al recargar. Si lo haces solo con `--permanent`, no se aplica hasta `--reload`.

### Redirección de puertos y NAT

```bash
firewall-cmd --permanent --add-forward-port=port=80:proto=tcp:toport=8080
firewall-cmd --permanent --add-masquerade
firewall-cmd --reload
sysctl -w net.ipv4.ip_forward=1    # para enrutar entre interfaces
```

### nftables y ufw

```bash
nft list ruleset
nft add table inet filtro
nft add chain inet filtro entrada '{ type filter hook input priority 0; policy accept; }'
nft add rule inet filtro entrada tcp dport 22 accept
ufw allow 443/tcp          # en Ubuntu
ufw enable
```

Las reglas de `nft` se guardan en `/etc/nftables.conf` o en la ruta que use tu distribución.

## Proxy inverso y balanceo

Con nginx:

```nginx
upstream app {
    server 10.0.0.11:8080;
    server 10.0.0.12:8080;
}
server {
    listen 80;
    server_name app.ejemplo.test;
    location / {
        proxy_pass http://app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
nginx -t
systemctl reload nginx
```

Por defecto reparte en turno rotatorio; `least_conn` elige el servidor con menos conexiones. En RHEL, SELinux bloquea que nginx se conecte a la red hasta activar `setsebool -P httpd_can_network_connect on`.

## Fuentes

- [Documentación oficial de referencia](https://networkmanager.dev/docs/api/latest/nmcli.html)
