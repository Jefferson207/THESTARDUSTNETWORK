<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

$manualToken = 'PEGA_AQUI_TU_TOKEN_LARGO';
$expectedToken = $manualToken;
$providedToken = isset($_POST['token']) && is_string($_POST['token']) ? $_POST['token'] : '';
if ($expectedToken === '' || $expectedToken === 'PEGA_AQUI_TU_TOKEN_LARGO') {
    http_response_code(503);
    echo json_encode(['error' => 'Configura el token dentro de upload.php.']);
    exit;
}
if (!hash_equals($expectedToken, $providedToken)) {
    http_response_code(401);
    echo json_encode(['error' => 'Acceso no autorizado.']);
    exit;
}
if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'No se recibió una imagen válida.']);
    exit;
}

$file = $_FILES['file'];
if ($file['size'] <= 0 || $file['size'] > 5 * 1024 * 1024) {
    http_response_code(400);
    echo json_encode(['error' => 'La imagen debe pesar como máximo 5 MB.']);
    exit;
}
$mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
$extensions = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
if (!isset($extensions[$mime])) {
    http_response_code(400);
    echo json_encode(['error' => 'Solo se permiten imágenes JPG, PNG o WebP.']);
    exit;
}

$uploadDirectory = dirname(__DIR__) . '/uploads/articulos';
if (!is_dir($uploadDirectory) && !mkdir($uploadDirectory, 0755, true)) {
    http_response_code(500);
    echo json_encode(['error' => 'No se pudo crear la carpeta de imágenes.']);
    exit;
}
$filename = date('Ymd') . '-' . bin2hex(random_bytes(12)) . '.' . $extensions[$mime];
if (!move_uploaded_file($file['tmp_name'], $uploadDirectory . '/' . $filename)) {
    http_response_code(500);
    echo json_encode(['error' => 'No se pudo guardar la imagen.']);
    exit;
}

$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$url = $scheme . '://' . $_SERVER['HTTP_HOST'] . '/uploads/articulos/' . $filename;
echo json_encode(['url' => $url], JSON_UNESCAPED_SLASHES);
