# Instalación en cPanel

1. En el Administrador de archivos abre `public_html`.
2. Crea la carpeta `api`.
3. Sube `upload.php` dentro de `public_html/api/`.
4. Abre `upload.php` y reemplaza `PEGA_AQUI_TU_TOKEN_LARGO` por un token largo y aleatorio.
5. No necesitas configurar variables ni modificar `.htaccess` en cPanel.
6. Comprueba que `https://tudominio.com/api/upload.php` responde. Un acceso directo debe devolver `Acceso no autorizado`.

En las variables del proyecto Next.js configura exactamente el mismo token que escribiste en `upload.php`:

```env
CPANEL_UPLOAD_URL=https://driatechinnovation.com/api/upload.php
CPANEL_UPLOAD_TOKEN=el-mismo-token-largo
```

Las imágenes se crearán automáticamente en:

```text
public_html/uploads/articulos/
```

Formatos permitidos: JPG, PNG y WebP. Tamaño máximo: 5 MB.
