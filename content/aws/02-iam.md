# IAM: identidades y permisos

**IAM (Identity and Access Management)** es global (no regional) y gratuito. Controla **quién** (autenticación) puede hacer **qué** (autorización) sobre **qué recursos**.

## Entidades

| Entidad | Descripción |
|---|---|
| **Usuario** | Persona o aplicación con credenciales a largo plazo (contraseña, claves de acceso) |
| **Grupo** | Colección de usuarios; se le asignan políticas. No admite grupos anidados |
| **Rol** | Identidad **asumible** temporalmente, con credenciales temporales (STS). Sin contraseña |
| **Política** | Documento JSON con permisos |

> Buenas prácticas modernas: para personas, usa **IAM Identity Center** (SSO) y credenciales temporales; para servicios (EC2, Lambda, ECS), usa **roles**, nunca claves de acceso incrustadas.

## Política de identidad

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:ListBucket"],
      "Resource": ["arn:aws:s3:::mi-bucket", "arn:aws:s3:::mi-bucket/*"],
      "Condition": { "IpAddress": { "aws:SourceIp": "203.0.113.0/24" } }
    }
  ]
}
```

Elementos: `Effect` (Allow/Deny), `Action`, `Resource` (ARN), `Condition`, y `Principal` (solo en políticas de recurso y de confianza). Un **ARN** es el identificador único: `arn:aws:servicio:región:cuenta:recurso`.

### Tipos de políticas

- **Basadas en identidad**: administradas por AWS, administradas por el cliente o *inline*.
- **Basadas en recursos**: adjuntas al recurso (bucket policy, cola SQS, clave KMS, política de confianza de un rol); permiten acceso **entre cuentas**.
- **Límites de permisos** (*permissions boundary*), **SCP** (Organizations), **políticas de sesión**.

## Lógica de evaluación

1. Por defecto **todo está denegado** (denegación implícita).
2. Un **Allow explícito** concede acceso.
3. Un **Deny explícito** siempre gana a cualquier Allow.
4. Los límites, SCP y políticas de sesión reducen el máximo posible: el permiso efectivo es la **intersección**.

## Roles y STS

Un rol tiene dos políticas: la de **permisos** (qué puede hacer) y la de **confianza** (quién puede asumirlo).

```bash
aws sts assume-role --role-arn arn:aws:iam::123456789012:role/Auditor --role-session-name sesion1
```

Usos habituales:

- **Perfil de instancia** de EC2 (rol adjunto a una instancia).
- **Roles de ejecución** de Lambda, de tarea de ECS, de servicio para CloudFormation.
- **Acceso entre cuentas** y **federación** (SAML, OIDC, GitHub Actions con OIDC).
- Credenciales temporales: caducan (15 min–12 h).

## Seguridad de credenciales

- **MFA** en la raíz y en todos los usuarios con acceso a consola.
- Política de contraseñas, rotación de claves, **Credential Report**, **Access Advisor** (último acceso por servicio) y **IAM Access Analyzer** (detecta recursos compartidos externamente y ayuda a generar políticas de mínimo privilegio).
- Nunca subas claves a repositorios; usa Secrets Manager o roles.

## IAM Identity Center

SSO centralizado para varias cuentas y aplicaciones (usuarios propios o de un IdP externo), con **conjuntos de permisos** que se asignan a cuentas y grupos.

## Casos típicos de examen

| Situación | Solución |
|---|---|
| Una EC2 necesita leer un bucket S3 | Rol IAM adjunto a la instancia |
| Acceso entre cuentas | Rol en la cuenta destino + confianza hacia la origen |
| Impedir que una cuenta de Organizations use cierta región o servicio | SCP |
| Limitar el máximo de permisos que un desarrollador puede delegar | Permissions boundary |
| Aplicación fuera de AWS que necesita acceso | Roles Anywhere / federación |
