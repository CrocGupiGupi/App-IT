# Identidad, RBAC y gobernanza

## Microsoft Entra ID

Servicio de identidad en la nube (antes **Azure Active Directory**). Es distinto de Active Directory Domain Services local (que usa Kerberos/LDAP): Entra ID usa OAuth 2.0, OpenID Connect y SAML.

Conceptos:

- **Tenant**: instancia dedicada de Entra ID de una organización.
- **Usuarios, grupos** (seguridad o Microsoft 365; asignación fija o dinámica), **invitados** (B2B).
- **Dispositivos**: registrados, unidos (*joined*) o híbridos.
- **Aplicaciones**: registro de aplicación (identidad de la app) y **enterprise application** (instancia en el tenant).
- **Entra Connect**: sincroniza identidades desde AD local.

### Autenticación y acceso seguro

- **MFA** (autenticación multifactor), **SSPR** (restablecimiento de contraseña por autoservicio), métodos sin contraseña (FIDO2, Authenticator). La MFA es **obligatoria** en Azure para cuentas de usuario: en el portal desde 2024 y, desde octubre de 2025, para crear, cambiar o borrar recursos con CLI, PowerShell, IaC y API. Las identidades de carga de trabajo no se ven afectadas.
- **Conditional Access**: políticas "si (usuario, ubicación, dispositivo, riesgo) entonces (exigir MFA, bloquear…)". Requiere Entra ID P1.
- **Identity Protection** (riesgo de inicio de sesión), **PIM** (Privileged Identity Management: acceso *just-in-time* a roles) — P2.

### Identidades de carga de trabajo

| Tipo | Descripción |
|---|---|
| **Service principal** | Identidad de una aplicación, con secreto o certificado |
| **Managed identity** | Identidad gestionada por Azure, **sin secretos que custodiar** |
| ↳ asignada por el sistema | Ligada al ciclo de vida del recurso; una por recurso |
| ↳ asignada por el usuario | Recurso independiente, reutilizable por varios recursos |

> Regla de oro: si un recurso de Azure necesita acceder a otro (Key Vault, Storage, SQL), usa una **managed identity** y RBAC, no contraseñas.

## Control de acceso basado en roles (Azure RBAC)

Una **asignación de rol** = **principal** (quién) + **definición de rol** (qué) + **ámbito** (dónde: management group, suscripción, grupo de recursos o recurso). Se hereda hacia abajo.

| Rol integrado | Permisos |
|---|---|
| **Owner** | Todo, incluida la asignación de roles |
| **Contributor** | Crear y gestionar recursos; **no** asignar roles |
| **Reader** | Solo ver |
| **User Access Administrator** | Gestionar accesos, sin gestionar recursos |

Hay cientos de roles específicos (p. ej. *Storage Blob Data Contributor*) y se pueden crear roles personalizados.

```bash
az role assignment create --assignee ana@contoso.com --role "Reader" \
  --scope /subscriptions/<id>/resourceGroups/rg-demo
az role assignment list --resource-group rg-demo -o table
```

Azure RBAC (recursos de Azure) es distinto de los **roles de Entra ID** (administrar el directorio: Global Administrator, User Administrator…).

## Gobernanza

### Azure Policy

Evalúa recursos frente a reglas y puede impedir o corregir incumplimientos. Efectos habituales: `Audit`, `Deny`, `Append`, `Modify`, `DeployIfNotExists`. Se agrupan en **iniciativas** y se asignan a un ámbito. Ejemplo: solo permitir ciertas regiones o exigir una etiqueta.

*Policy* controla **qué se puede hacer con los recursos**; *RBAC* controla **qué puede hacer cada usuario**.

### Bloqueos de recursos

- `CanNotDelete`: se puede leer y modificar, no borrar.
- `ReadOnly`: solo lectura.
- Se heredan y prevalece el más restrictivo, incluso sobre Owner (hay que quitar el bloqueo primero).

### Etiquetas (tags)

Pares clave-valor para organizar y asignar costes. **No se heredan** automáticamente (se puede forzar con Policy).

### Otros

- **Microsoft Purview** (gobierno de datos y cumplimiento) y **Service Trust Portal** (informes de cumplimiento).
- **Azure Blueprints** se retira el 31 de enero de 2027; se sustituye por **Deployment Stacks** y **Template Specs**.
- **Azure Landing Zones**: arquitectura de referencia para organizar suscripciones y gobernanza a escala.
