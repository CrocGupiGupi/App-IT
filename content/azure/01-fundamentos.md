# Fundamentos cloud y jerarquía de Azure

## Conceptos de cloud

- **Modelo de consumo**: pagas por uso (OpEx) en lugar de invertir en hardware (CapEx).
- **Elasticidad y escalabilidad**: crecer o reducir recursos según la demanda (vertical = más potencia; horizontal = más instancias).
- **Alta disponibilidad** y **tolerancia a fallos**; **recuperación ante desastres**.
- **SLA**: disponibilidad comprometida (p. ej. 99,95 %). Servicios compuestos: el SLA combinado es el **producto** de los SLA de cada componente en serie.

### Modelos de servicio

| Modelo | Tú gestionas | Ejemplos Azure |
|---|---|---|
| **IaaS** | SO, runtime, apps | Virtual Machines |
| **PaaS** | Apps y datos | App Service, Azure SQL Database |
| **SaaS** | Solo usar | Microsoft 365 |
| **Serverless** | Solo el código | Azure Functions |

### Modelos de nube

**Pública**, **privada**, **híbrida** (Azure Arc, Azure Stack) y **multicloud**.

### Responsabilidad compartida

El proveedor siempre se encarga de la infraestructura física; el cliente siempre de sus **datos, identidades y dispositivos/cuentas**. El resto depende del modelo (más responsabilidad del cliente en IaaS, menos en SaaS).

## Infraestructura global

- **Región**: conjunto de centros de datos en una zona geográfica (West Europe, Spain Central…).
- **Pares de regiones** (*region pairs*): regiones separadas por cientos de km para recuperación ante desastres.
- **Zonas de disponibilidad (AZ)**: centros de datos físicamente separados dentro de una región (mínimo 3 en las regiones con soporte). Protegen frente a fallos de un centro de datos.
- **Availability set**: reparte VMs entre dominios de fallo y de actualización dentro de un centro de datos.
- **Geografías**, **regiones soberanas** (Azure Government, Azure China).

## Jerarquía de recursos

```
Tenant (Microsoft Entra ID)
 └── Grupo de administración (Management Group)
      └── Suscripción
           └── Grupo de recursos (Resource Group)
                └── Recurso
```

- **Suscripción**: límite de facturación y de acceso. **Un recurso pertenece a un único grupo de recursos**.
- **Grupo de recursos**: contenedor lógico para gestionar el ciclo de vida conjunto. Los recursos de un grupo pueden estar en regiones distintas.
- **Management Groups**: aplican políticas y RBAC a varias suscripciones; heredan hacia abajo (hasta 6 niveles).
- Borrar un grupo de recursos borra todo lo que contiene.

## Azure Resource Manager (ARM)

Capa de gestión única: portal, CLI, PowerShell, SDK y plantillas pasan por la misma API de ARM, lo que da coherencia, RBAC, políticas, etiquetas y despliegues declarativos.

## Herramientas

- **Azure Portal** (web), **Azure CLI** (`az`), **Azure PowerShell**, **Cloud Shell** (terminal en el navegador).
- **Azure Resource Explorer**, **Azure Mobile App**.

```bash
az login
az account list -o table
az group create -n rg-demo -l westeurope
az group list -o table
az group delete -n rg-demo --yes
```

## Costes

- Factores: tipo de recurso, región, tamaño, tiempo de uso, transferencia de datos de salida (la entrada es gratis).
- **Calculadora de precios** (estimar antes) y **Calculadora TCO** (comparar con on-premises).
- **Cost Management + Billing**: análisis, presupuestos y alertas.
- **Etiquetas (tags)** para asignar costes por proyecto/departamento.
- Ahorro: **Reservas** (1 o 3 años), **Savings Plan**, **Spot VMs**, **Azure Hybrid Benefit** (licencias existentes), apagar/desasignar lo no usado.
