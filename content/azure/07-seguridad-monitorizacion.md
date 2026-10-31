# Seguridad, monitorización y continuidad

## Defensa en profundidad

Capas: **física → identidad y acceso → perímetro → red → cómputo → aplicación → datos**. Modelo **Zero Trust**: verificar explícitamente, mínimo privilegio y asumir la brecha.

## Key Vault

Almacén seguro de **secretos, claves y certificados**.

- Acceso por **RBAC** (recomendado) o políticas de acceso; las apps usan **managed identity**.
- **Soft delete** y **purge protection** evitan borrados accidentales o maliciosos.
- Niveles: Standard (claves por software) y Premium (claves protegidas por HSM). *Managed HSM* para aislamiento dedicado.
- Las apps referencian secretos desde App Service/Functions con `@Microsoft.KeyVault(...)` sin tocar el valor.

```bash
az keyvault create -g rg-demo -n kv-demo-12345 --enable-rbac-authorization true
az keyvault secret set --vault-name kv-demo-12345 -n DbPassword --value 'S3creto!'
```

## Microsoft Defender for Cloud

- **CSPM**: evalúa la postura (recomendaciones, *Secure Score*, cumplimiento normativo).
- **CWP**: protección de cargas (servidores, contenedores, Storage, SQL, Key Vault…) con alertas de amenazas. Funciona también en AWS, GCP y on-premises.
- **Microsoft Sentinel**: SIEM + SOAR en la nube (recopilar, detectar, investigar y responder). Tras el 31/03/2027 solo estará disponible en el portal de Microsoft Defender, no en el de Azure.

## Cifrado

- **En reposo**: Storage, SQL y discos (SSE siempre activo, con claves de Microsoft o del cliente); **TDE** en SQL. Para cifrar también discos temporales y cachés usa **encryption at host**. **Azure Disk Encryption** se retira el 15/09/2028: no lo uses en VMs nuevas.
- **En tránsito**: TLS.
- **En uso**: *confidential computing*.

## Azure Monitor

Plataforma unificada de telemetría.

| Pieza | Función |
|---|---|
| **Métricas** | Números en series temporales, casi en tiempo real |
| **Registros (Logs)** | Eventos detallados en **Log Analytics workspace**, consultables con **KQL** |
| **Application Insights** | Monitorización de rendimiento de aplicaciones (APM): trazas, dependencias, excepciones |
| **Alertas** + **grupos de acciones** | Notificar (correo, SMS, webhook) o automatizar respuestas |
| **Diagnostic settings** | Enviar logs/métricas de un recurso a Log Analytics, Storage o Event Hubs |
| **Workbooks y dashboards** | Visualización |
| **Activity Log** | Operaciones del plano de control (quién hizo qué en ARM), 90 días |

```kusto
AzureActivity
| where TimeGenerated > ago(1d) and OperationNameValue endswith "delete"
| summarize n = count() by Caller
| order by n desc
```

Otros: **Azure Advisor** (recomendaciones de fiabilidad, seguridad, coste, rendimiento, excelencia operativa), **Service Health** (incidentes de Azure que te afectan), **Resource Health**.

## Continuidad y recuperación

- **Azure Backup**: copias de VMs, archivos, SQL en VM, Azure Files, blobs… en un **Recovery Services vault** (o Backup vault) con políticas de retención.
- **Azure Site Recovery**: replica VMs a otra región/entorno y permite la conmutación por error (DR) con planes de recuperación.
- Define **RPO/RTO**, usa **zonas de disponibilidad** y **regiones pareadas**.
- **Pruebas** de recuperación periódicas.

## Marco de buenas prácticas

**Azure Well-Architected Framework** — cinco pilares: Fiabilidad, Seguridad, Optimización de costes, Excelencia operativa y Eficiencia del rendimiento. **Cloud Adoption Framework** guía la estrategia de adopción.

## Cumplimiento

Azure ofrece certificaciones (ISO 27001, SOC, RGPD/GDPR…). El cliente sigue siendo responsable de configurar correctamente sus recursos (responsabilidad compartida). Los informes están en el **Service Trust Portal**.
