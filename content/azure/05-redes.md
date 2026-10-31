# Redes

## Virtual Network (VNet)

Red privada aislada en Azure dentro de una región y una suscripción.

- Espacio de direcciones CIDR privado (`10.0.0.0/16`), dividido en **subredes**.
- Azure reserva **5 direcciones** por subred (la primera, la última y tres más).
- Las VNets **no se solapan** si quieres conectarlas.
- **Las subredes nuevas son privadas por defecto**: en las VNets nuevas creadas con APIs posteriores al 31/03/2026, y en el portal, las VMs necesitan un método de salida explícito. El recomendado es **NAT Gateway**; también valen un Load Balancer Standard con reglas de salida, una IP pública en la VM o un firewall con UDR. Las VNets existentes no cambian.
- La entrada desde Internet requiere IP pública y reglas que la permitan.

```bash
az network vnet create -g rg-demo -n vnet-demo --address-prefixes 10.0.0.0/16 \
  --subnet-name web --subnet-prefixes 10.0.1.0/24
```

## Control del tráfico

- **NSG (Network Security Group)**: reglas de permitir/denegar por prioridad (100–4096, la menor se evalúa primero), origen/destino, puerto y protocolo. Se asocia a **subred** o **NIC**. Reglas por defecto: permitir tráfico dentro de la VNet y salida a Internet, denegar el resto de entrada.
- **ASG (Application Security Group)**: agrupa VMs por rol para usarlas en reglas NSG.
- **Azure Firewall**: firewall gestionado de red y aplicación (FQDN, inteligencia de amenazas), centralizado.
- **UDR (rutas definidas por el usuario)**: tablas de rutas para forzar el tráfico (p. ej. a un firewall).
- **Azure Bastion**: acceso RDP/SSH a VMs desde el portal sin IP pública.

## Conectividad entre redes

| Opción | Descripción |
|---|---|
| **VNet peering** | Conecta VNets por la red troncal de Microsoft, baja latencia. **No es transitivo**. Global peering entre regiones |
| **VPN Gateway** | Túnel IPsec/IKE cifrado por Internet: **Site-to-Site**, **Point-to-Site**, VNet-to-VNet |
| **ExpressRoute** | Conexión **privada dedicada** con un proveedor; no pasa por Internet público |
| **Virtual WAN** | Hub gestionado para conectar muchas sedes y VNets |

## Acceso privado a servicios PaaS

- **Service endpoints**: la subred llega al servicio PaaS (Storage, SQL…) por la red troncal; el servicio sigue teniendo IP pública.
- **Private Endpoint / Private Link**: crea una **IP privada** del servicio dentro de tu VNet. Es la opción más segura (requiere zona DNS privada).

## DNS

- **Azure DNS**: hospedaje de zonas públicas y **privadas**.
- Las VNets usan por defecto el DNS de Azure; se puede apuntar a servidores propios.

## Balanceo de carga

| Servicio | Capa | Alcance | Uso |
|---|---|---|---|
| **Load Balancer** | L4 (TCP/UDP) | Regional | Balanceo de VMs, interno o público |
| **Application Gateway** | L7 (HTTP/S) | Regional | Enrutamiento por URL/host, terminación TLS, **WAF** |
| **Front Door** | L7 | **Global** | Entrada global, CDN, WAF, conmutación por error entre regiones |
| **Traffic Manager** | DNS | Global | Reparto por DNS (prioridad, ponderado, rendimiento, geográfico) |

> Regla mnemotécnica: ¿global o regional? ¿HTTP o no HTTP? → Front Door / Traffic Manager (global) frente a Application Gateway / Load Balancer (regional).

Load Balancer **Standard** usa sondeos de estado (health probes), zonas de disponibilidad y exige NSG para permitir el tráfico. El SKU **Basic se retiró** el 30/09/2025.

## IPs públicas

SKU **Standard** (estática, zona-redundante, cerrada por defecto hasta que un NSG permita el tráfico). El SKU **Basic se retiró** el 30/09/2025. Una IP pública es opcional para una VM; mejor usar Bastion o balanceadores.

## Otros

- **NAT Gateway**: salida a Internet con IP fija y escalable para una subred.
- **DDoS Protection**: básica incluida; protección avanzada de pago.
- **Network Watcher**: diagnóstico (comprobar conectividad, *IP flow verify*, *next hop*, captura de paquetes, NSG flow logs).
