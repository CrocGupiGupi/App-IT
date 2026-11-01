# Revisión de contenidos (31/10/2026)

Contraste de las lecciones con fuentes oficiales. No es una revisión línea a línea de cada lección: se han comprobado los exámenes y los datos con más riesgo de haber caducado (límites, servicios retirados, valores por defecto y comandos).

## Exámenes

| Campo | Cambio | Fuente |
|---|---|---|
| Azure | AZ-204 retirado el 31/07/2026 y AZ-500 el 31/08/2026; se añaden AI-200 y SC-500 | [Exámenes retirados](https://learn.microsoft.com/en-us/credentials/support/retired-certification-exams), [AI-200](https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-cloud-developer-associate/), [SC-500](https://learn.microsoft.com/en-us/credentials/certifications/cloud-and-ai-security-engineer-associate/) |
| AWS | SysOps pasa a CloudOps (SOA-C03); DVA-C03, SAP-C03 y SCS-C03 | [Exámenes AWS](https://aws.amazon.com/certification/exams/), [SOA-C03](https://aws.amazon.com/blogs/training-and-certification/exam-update-and-new-name-for-operations-certification/) |
| Kubernetes | v1.37, pesos de CKA y CKAD | [CKA](https://training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/), [CKAD](https://training.linuxfoundation.org/certification/certified-kubernetes-application-developer-ckad/), [CKS](https://training.linuxfoundation.org/certification/certified-kubernetes-security-specialist/), [versiones](https://kubernetes.io/releases/) |
| Docker | DCA: formato y vigencia | [Mirantis](https://training.mirantis.com/dca-certification-exam/) |

## Docker

- `docker rm -v`, `docker volume prune` y `docker system prune --volumes`: solo afectan a volúmenes anónimos ([rm](https://docs.docker.com/reference/cli/docker/container/rm/), [volume prune](https://docs.docker.com/reference/cli/docker/volume/prune/), [system prune](https://docs.docker.com/reference/cli/docker/system/prune/)).
- Docker Content Trust en retirada: Notary v1 se apaga el 08/12/2026 ([DCT](https://docs.docker.com/engine/security/trust/)).
- Límites de Docker Hub ([uso](https://docs.docker.com/docker-hub/usage/)), licencia de Desktop ([licencia](https://docs.docker.com/subscription/desktop-license/)), containerd image store ([storage](https://docs.docker.com/engine/storage/drivers/select-storage-driver/)), `--link` ([obsoleto](https://docs.docker.com/engine/deprecated/)), Compose 5 y `version` ([Compose](https://docs.docker.com/reference/compose-file/version-and-name/)).

## Kubernetes

- Ingress congelado, Gateway API recomendada ([Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/)); retirada de `ingress-nginx` ([anuncio](https://kubernetes.io/blog/2025/11/11/ingress-nginx-retirement/)).
- Sidecars nativos ([sidecars](https://kubernetes.io/docs/concepts/workloads/pods/sidecar-containers/)), in-place resize ([resize](https://kubernetes.io/docs/tasks/configure-pod-container/resize-container-resources/)), modos de kube-proxy ([virtual IPs](https://kubernetes.io/docs/reference/networking/virtual-ips/)), Endpoints obsoleta ([Service](https://kubernetes.io/docs/concepts/services-networking/service/)).
- Upgrade con kubeadm ([upgrade](https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubeadm-upgrade/)), swap ([instalación](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/install-kubeadm/)), `ETCDCTL_API` y `etcdutl` ([etcd](https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/)).
- Helm 4 ([versiones](https://helm.sh/docs/topics/version_skew/)) y cambio de catálogo de Bitnami ([aviso](https://github.com/bitnami/charts/issues/35164)).

## Azure

- Subredes privadas por defecto ([salida](https://learn.microsoft.com/en-us/azure/virtual-network/ip-services/default-outbound-access)); Basic retirado en [Load Balancer](https://learn.microsoft.com/en-us/azure/load-balancer/skus) e [IP pública](https://learn.microsoft.com/en-us/azure/virtual-network/ip-services/public-ip-addresses).
- Planes de [Functions](https://learn.microsoft.com/en-us/azure/azure-functions/functions-scale), niveles de [AKS](https://learn.microsoft.com/en-us/azure/aks/free-standard-pricing-tiers), [kubenet y CNI](https://learn.microsoft.com/en-us/azure/aks/concepts-network-cni-overview), [availability sets](https://learn.microsoft.com/en-us/azure/virtual-machines/availability-set-overview).
- [Niveles de blob](https://learn.microsoft.com/en-us/azure/storage/blobs/access-tiers-overview), [redundancia](https://learn.microsoft.com/en-us/azure/storage/common/storage-redundancy), [regiones sin par](https://learn.microsoft.com/en-us/azure/reliability/regions-paired).
- Retiradas: [Blueprints](https://learn.microsoft.com/en-us/azure/governance/blueprints/overview), [Azure Cache for Redis](https://learn.microsoft.com/en-us/azure/azure-cache-for-redis/cache-overview), [Azure Disk Encryption](https://learn.microsoft.com/en-us/azure/virtual-machines/disk-encryption-overview), [Sentinel en el portal de Azure](https://learn.microsoft.com/en-us/azure/sentinel/overview).
- [MFA obligatoria](https://learn.microsoft.com/en-us/entra/identity/authentication/concept-mandatory-multifactor-authentication) y [Azure Local](https://learn.microsoft.com/en-us/azure/azure-local/overview).

## AWS

- Límites: [SQS](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/quotas-messages.html), [S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/qfacts.html), [Lambda](https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html), [Aurora](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/CHAP_Limits.html).
- Sin clientes nuevos: [S3 Select](https://docs.aws.amazon.com/AmazonS3/latest/userguide/selecting-content-from-objects.html), [Snowball Edge](https://docs.aws.amazon.com/snowball/latest/developer-guide/whatisedge.html), [App Runner](https://docs.aws.amazon.com/apprunner/latest/dg/what-is-apprunner.html).
- [Capa gratuita](https://aws.amazon.com/free/), [planes de soporte](https://aws.amazon.com/premiumsupport/plans/), [IPv4 públicas](https://aws.amazon.com/vpc/pricing/), [7 R](https://docs.aws.amazon.com/prescriptive-guidance/latest/large-migration-guide/migration-strategies.html).
- [NAT regional](https://docs.aws.amazon.com/vpc/latest/userguide/nat-gateways-regional.html), [Multi-AZ](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.html), [DynamoDB](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/capacity-mode.html), [Security Hub CSPM](https://docs.aws.amazon.com/securityhub/latest/userguide/what-is-securityhub.html).

## Precios de examen (01/11/2026)

- Docker: [Mirantis](https://training.mirantis.com/dca-certification-exam/).
- Kubernetes: páginas de cada examen en [Linux Foundation](https://training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/); indican el precio con el signo $.
- Azure: precio para España que muestra [Microsoft Learn](https://learn.microsoft.com/es-es/credentials/certifications/azure-administrator/), sin impuestos.
- AWS: tabla de precios de [AWS](https://aws.amazon.com/certification/policies/before-testing/) para Europa, sin impuestos.

## Contraste de preguntas (01/11/2026)

Las preguntas son de elaboración propia. Se contrastaron con fuentes oficiales las afirmaciones con más riesgo: cifras, valores por defecto, retiradas de servicios y comandos concretos. Las preguntas de conceptos básicos se releyeron, pero no se comprobaron una a una.

- Docker: [system prune](https://docs.docker.com/reference/cli/docker/system/prune/), [reinicio](https://docs.docker.com/engine/containers/start-containers-automatically/), [Dockerfile](https://docs.docker.com/reference/dockerfile/), [proyecto de Compose](https://docs.docker.com/compose/how-tos/project-name/), [Swarm](https://docs.docker.com/engine/swarm/admin_guide/), [docker run](https://docs.docker.com/reference/cli/docker/container/run/).
- Kubernetes: [Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/), [NetworkPolicy](https://kubernetes.io/docs/concepts/services-networking/network-policies/), [disrupciones](https://kubernetes.io/docs/concepts/workloads/pods/disruptions/), [Pod Security](https://kubernetes.io/docs/concepts/security/pod-security-admission/), [QoS](https://kubernetes.io/docs/concepts/workloads/pods/pod-qos/), [recursos](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/).
- Azure: [bloqueos](https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/lock-resources), [etiquetas](https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/tag-resources), [VNet](https://learn.microsoft.com/en-us/azure/virtual-network/virtual-networks-faq), [registro de actividad](https://learn.microsoft.com/en-us/azure/azure-monitor/platform/activity-log), [disponibilidad](https://learn.microsoft.com/en-us/azure/virtual-machines/availability), [NAT Gateway](https://learn.microsoft.com/en-us/azure/nat-gateway/nat-overview), [Cosmos DB](https://learn.microsoft.com/en-us/azure/cosmos-db/consistency-levels), [cifrado de discos](https://learn.microsoft.com/en-us/azure/virtual-machines/disk-encryption-overview), [deployment stacks](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/deployment-stacks).
- AWS: [SCP](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html), [replicación S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/replication-requirements.html), [Step Functions](https://docs.aws.amazon.com/step-functions/latest/dg/choosing-workflow-type.html), [Savings Plans](https://docs.aws.amazon.com/savingsplans/latest/userguide/what-is-savings-plans.html), [CloudTrail](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/view-cloudtrail-events.html), [soporte](https://aws.amazon.com/premiumsupport/plans/), [Lambda](https://docs.aws.amazon.com/lambda/latest/dg/provisioned-concurrency.html).
- Linux: [systemd.timer](https://man7.org/linux/man-pages/man5/systemd.timer.5.html), [journald.conf](https://man7.org/linux/man-pages/man5/journald.conf.5.html), [chage](https://man7.org/linux/man-pages/man1/chage.1.html), [systemctl](https://man7.org/linux/man-pages/man1/systemctl.1.html), [systemd.mount](https://man7.org/linux/man-pages/man5/systemd.mount.5.html), [xfs_growfs](https://man7.org/linux/man-pages/man8/xfs_growfs.8.html), [firewall-cmd](https://firewalld.org/documentation/man-pages/firewall-cmd.html), [Quadlet](https://docs.podman.io/en/latest/markdown/podman-systemd.unit.5.html), [Flatpak](https://docs.flatpak.org/en/latest/using-flatpak.html), [SELinux en RHEL 10](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/10/html-single/using_selinux/index).

## Pendiente de confirmar

- **Preguntas**: que `chcon` sea temporal no aparece en la parte leída de la guía de SELinux de RHEL 10. Tampoco se confirmaron en fuente oficial el nivel `Session` por defecto de Cosmos DB, los modos de Storage Gateway ni los comandos de Docker Scout en su versión actual.
- **DCA**: dominios y pesos de la guía oficial (el PDF no se pudo leer).
- **`ingress-nginx`**: la fecha de marzo de 2026 no se pudo leer en el texto de la página oficial.
- **AI-200 y SC-500**: su temario no está cubierto por completo en este curso.
- **SOA-C03**: el historial de versiones de la guía era incoherente entre páginas (v1.1 y v1.2).
- **Exámenes en español**: varios se retiran tras el 31/12/2026; compruébalo antes de reservar.
