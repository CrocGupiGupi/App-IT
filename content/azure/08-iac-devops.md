# Infraestructura como código y DevOps

## Por qué IaC

Definir la infraestructura en ficheros versionados: despliegues **repetibles**, revisables, probados y auditables, sin cambios manuales ("snowflakes").

## Plantillas ARM y Bicep

- **ARM template**: JSON declarativo (verboso).
- **Bicep**: lenguaje específico de dominio que se compila a ARM; más legible. Es la opción recomendada en Azure.
- Los despliegues son **idempotentes**: repetirlos deja el estado deseado.

```bicep
param location string = resourceGroup().location
param storageName string

resource sa 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageName
  location: location
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  properties: {
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
  }
}

output endpoint string = sa.properties.primaryEndpoints.blob
```

```bash
az deployment group what-if -g rg-demo -f main.bicep -p storageName=stdemo12345
az deployment group create -g rg-demo -f main.bicep -p storageName=stdemo12345
```

- **Modo incremental** (por defecto): añade/actualiza sin borrar lo demás. **Modo completo**: elimina los recursos que no estén en la plantilla.
- **what-if** muestra los cambios antes de aplicarlos.
- **Módulos** reutilizables, **parámetros**, **variables**, `dependsOn` (implícito por referencias), bucles y condiciones.
- **Template specs** y **Deployment stacks** para publicar y gestionar conjuntos.

## Terraform

Herramienta multinube de HashiCorp (proveedor `azurerm`/`azapi`), con estado remoto (p. ej. en un Blob con bloqueo) y `plan` / `apply`. Muy usada en empresas con varios proveedores.

## Azure CLI y PowerShell

Automatización imperativa; se pueden combinar en scripts. Convenciones de la CLI: `az <grupo> <subgrupo> <acción>` con `--query` (JMESPath) y `-o table|json|tsv`.

```bash
az vm list --query "[].{nombre:name, tamaño:hardwareProfile.vmSize}" -o table
az resource list --tag entorno=dev -o table
```

## CI/CD

| Herramienta | Descripción |
|---|---|
| **Azure DevOps** | Repos, Boards, **Pipelines** (YAML), Test Plans, Artifacts |
| **GitHub Actions** | Workflows YAML en GitHub; acción oficial `azure/login` |

Buenas prácticas:

- **Autenticación federada OIDC** (identidad federada) entre GitHub/Azure DevOps y Entra ID: **sin secretos** almacenados.
- Entornos (dev/test/prod) con **aprobaciones**; despliegues por *slots* o *blue-green*.
- Análisis de seguridad (SAST, dependencias, escaneo de imágenes) en el pipeline.

```yaml
# .github/workflows/deploy.yml (extracto)
permissions:
  id-token: write
  contents: read
steps:
  - uses: actions/checkout@v4
  - uses: azure/login@v2
    with:
      client-id: ${{ secrets.AZURE_CLIENT_ID }}
      tenant-id: ${{ secrets.AZURE_TENANT_ID }}
      subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
  - run: az deployment group create -g rg-demo -f main.bicep
```

## Estrategias de despliegue

Rolling, **blue-green** (dos entornos y conmutación), **canary** (porcentaje creciente de tráfico), **slots de App Service** (staging + swap), **feature flags** (Azure App Configuration).

## Ruta de certificación sugerida

1. **AZ-900**: visión general de conceptos y servicios.
2. **AZ-104**: administración de identidad, redes, cómputo, almacenamiento y monitorización (práctica intensa).
3. **AZ-204** (desarrollo) o **AZ-305** (arquitectura) o **AZ-400** (DevOps), según tu perfil.

## Consejos de estudio

- Crea una **suscripción gratuita** y haz laboratorios de cada lección.
- Usa los **Microsoft Learn sandboxes** y los exámenes de práctica oficiales.
- Aprende a decidir *qué servicio* usar y *por qué*: los exámenes plantean escenarios.
- Controla el coste: borra los grupos de recursos al terminar y configura **presupuestos con alertas**.
