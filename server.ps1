# Servidor Web Leve em PowerShell para o Brasfoot Browser (Com Logs Detalhados)
$port = 8080
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

try {
    $listener.Start()
    Write-Host "============================================="
    Write-Host " Servidor local rodando com sucesso!"
    Write-Host " Acesse no seu navegador: http://localhost:$port/"
    Write-Host " Pressione Ctrl+C no terminal para encerrar."
    Write-Host "============================================="
    
    $folder = "C:\Users\rafael.ferraz\brasfoot-game"
    
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $urlPath = $request.Url.LocalPath
        if ($urlPath -eq "/") { 
            $urlPath = "/index.html" 
        }
        
        # Combina de forma segura o caminho físico do arquivo
        $cleanPath = $urlPath.TrimStart('/')
        $filePath = [System.IO.Path]::Combine($folder, $cleanPath)
        
        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            
            # Define o Content-Type correto para evitar erros do navegador com módulos ES6
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = "text/plain"
            switch ($ext) {
                ".html" { $contentType = "text/html; charset=utf-8" }
                ".css"  { $contentType = "text/css; charset=utf-8" }
                ".js"   { $contentType = "text/javascript; charset=utf-8" }
                ".json" { $contentType = "application/json; charset=utf-8" }
                ".png"  { $contentType = "image/png" }
                ".jpg"  { $contentType = "image/jpeg" }
                ".svg"  { $contentType = "image/svg+xml" }
                ".ico"  { $contentType = "image/x-icon" }
            }
            
            $response.ContentType = $contentType
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            Write-Host "[SERVIDO] $urlPath ($contentType)"
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("Erro 404: Arquivo nao encontrado")
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
            Write-Host "[404 NOT FOUND] $urlPath"
        }
        $response.Close()
    }
} catch {
    Write-Host "Erro ao iniciar o servidor: $_"
} finally {
    $listener.Close()
}
