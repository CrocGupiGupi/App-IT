# Texto, redirecciones y scripts

## Flujos y redirecciones

Cada proceso tiene tres flujos: entrada estándar (0), salida estándar (1) y errores (2).

```bash
comando > salida.txt          # sobrescribe
comando >> salida.txt         # añade al final
comando 2> errores.txt        # solo errores
comando > todo.txt 2>&1       # salida y errores al mismo fichero
comando 2> /dev/null          # descarta los errores
comando < entrada.txt         # lee de un fichero
ls -l | grep conf | wc -l     # encadena con tuberías
comando | tee copia.txt       # muestra y guarda a la vez
```

El orden importa: en `> f 2>&1` los errores van al fichero; en `2>&1 > f`, no.

## Buscar texto con grep

```bash
grep root /etc/passwd
grep -i error app.log         # sin distinguir mayúsculas
grep -v '^#' fichero          # líneas que no coinciden
grep -r 'Listen' /etc/httpd/  # recursivo
grep -n patron f              # con número de línea
grep -E 'error|fallo' f       # regex extendida
```

| Regex | Significado |
|---|---|
| `^` y `$` | Inicio y final de línea |
| `.` | Cualquier carácter |
| `*` | Cero o más del anterior |
| `+`, `?` | Uno o más, cero o uno (con `-E`) |
| `[0-9]` | Un carácter del conjunto |
| `()`, alternativa con barra vertical | Grupos y opciones (con `-E`) |

Para quitar comentarios y líneas vacías: `grep -Ev '^(#|$)' fichero`.

## Transformar texto

```bash
sed 's/viejo/nuevo/g' f          # sustituye y muestra
sed -i 's/viejo/nuevo/g' f       # edita el fichero
sed -n '5,10p' f                 # imprime las líneas 5 a 10
awk -F: '{print $1, $7}' /etc/passwd   # campos 1 y 7
cut -d: -f1 /etc/passwd
sort -n numeros; sort -u lista
uniq -c                          # cuenta repetidos consecutivos
tr 'a-z' 'A-Z' < f
```

## Editar con vim

`vim` tiene modos. Pulsa `i` para insertar y `Esc` para volver al modo normal.

| Orden | Acción |
|---|---|
| `:w`, `:q`, `:wq`, `:q!` | Guardar, salir, ambas, salir sin guardar |
| `dd`, `yy`, `p` | Borrar línea, copiar línea, pegar |
| `u`, `Ctrl+r` | Deshacer, rehacer |
| `/texto`, `n` | Buscar, siguiente |
| `:%s/a/b/g` | Sustituir en todo el fichero |
| `gg`, `G` | Ir al inicio, ir al final |

## Encontrar ficheros

```bash
find / -name 'httpd.conf' 2>/dev/null
find /var -size +100M
find /home -user ana -type f
find . -mtime -1                       # modificados en el último día
find /tmp -type f -mtime +7 -delete
find / -perm -4000 2>/dev/null         # con SUID
find . -name '*.log' -exec gzip {} \;
locate fichero                         # usa una base de datos, tras updatedb
```

## Variables y sustitución

```bash
NOMBRE=ana                # sin espacios junto al =
echo "$NOMBRE"
export RUTA=/opt/app      # visible para procesos hijos
FECHA=$(date +%F)         # guarda la salida de un comando
echo $?                   # código de salida del último comando (0 = éxito)
```

Las comillas dobles expanden variables; las simples no.

## Scripts de shell

```bash
#!/bin/bash
# copia.sh: guarda un directorio con la fecha en el nombre
set -u

if [ $# -ne 1 ]; then
  echo "Uso: $0 directorio" >&2
  exit 1
fi

origen=$1
if [ ! -d "$origen" ]; then
  echo "No existe $origen" >&2
  exit 2
fi

destino="/tmp/$(basename "$origen")-$(date +%F).tar.gz"
tar -czf "$destino" "$origen" && echo "Creado $destino"
```

```bash
chmod +x copia.sh
./copia.sh /etc
```

- **Argumentos**: `$1`, `$2`, `$#` (cuántos), `$@` (todos), `$0` (nombre del script).
- **Comprobaciones**: `-f` fichero, `-d` directorio, `-e` existe, `-z` cadena vacía, `-eq`, `-ne`, `-gt`, `-lt` para números, `=` y `!=` para texto.

```bash
for f in /var/log/*.log; do
  echo "$f: $(wc -l < "$f") líneas"
done

while read -r usuario; do
  id "$usuario" >/dev/null 2>&1 || echo "Falta $usuario"
done < usuarios.txt

case "$1" in
  start) echo "Arrancando" ;;
  stop)  echo "Parando" ;;
  *)     echo "Uso: $0 {start|stop}" ;;
esac
```

> `&&` ejecuta lo siguiente si lo anterior funcionó; `||`, si falló. Entrecomilla siempre las variables para no romper rutas con espacios.
