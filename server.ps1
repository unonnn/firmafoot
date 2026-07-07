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
        
        # Intercepta rotas de API para o Banco de Dados Local (Firmafoot Auth & Cloud Saves)
        if ($urlPath.StartsWith("/api/")) {
            $response.ContentType = "application/json; charset=utf-8"
            
            # Habilita CORS para requisições locais
            $response.AddHeader("Access-Control-Allow-Origin", "*")
            $response.AddHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            $response.AddHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
            
            if ($request.HttpMethod -eq "OPTIONS") {
                $response.StatusCode = 200
                $response.Close()
                continue
            }
            
            # Lê o corpo da requisição (JSON)
            $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
            $reqBody = $reader.ReadToEnd()
            $reader.Close()
            
            $dbFolder = [System.IO.Path]::Combine($folder, "database")
            $savesFolder = [System.IO.Path]::Combine($dbFolder, "saves")
            if (-not (Test-Path $dbFolder)) { New-Item -ItemType Directory -Path $dbFolder | Out-Null }
            if (-not (Test-Path $savesFolder)) { New-Item -ItemType Directory -Path $savesFolder | Out-Null }
            
            $usersFile = [System.IO.Path]::Combine($dbFolder, "users.json")
            if (-not (Test-Path $usersFile)) { Set-Content -Path $usersFile -Value "[]" }
            
            [array]$users = @()
            if (Test-Path $usersFile) {
                $rawUsers = Get-Content -Raw -Path $usersFile
                if ($rawUsers) {
                    $users = @(ConvertFrom-Json $rawUsers)
                }
            }
            
            $resData = $null
            $statusCode = 200
            
            if ($urlPath -eq "/api/auth/google" -and $request.HttpMethod -eq "POST") {
                $data = $reqBody | ConvertFrom-Json
                $username = "convidado_dev"
                $displayName = "Treinador Convidado"
                
                # Se for token real, decodifica o JWT do Google
                if ($null -ne $data.credential -and $data.credential -ne "mock_token") {
                    try {
                        $parts = $data.credential.Split(".")
                        if ($parts.Length -ge 2) {
                            $payloadBase64 = $parts[1]
                            while ($payloadBase64.Length % 4 -ne 0) { $payloadBase64 += "=" }
                            $decodedBytes = [System.Convert]::FromBase64String($payloadBase64)
                            $decodedJson = [System.Text.Encoding]::UTF8.GetString($decodedBytes)
                            $googleProfile = $decodedJson | ConvertFrom-Json
                            
                            if ($null -ne $googleProfile.email) {
                                $username = $googleProfile.email.Trim().ToLower()
                                if ($null -ne $googleProfile.name) {
                                    $displayName = $googleProfile.name
                                } else {
                                    $displayName = $googleProfile.email.Split("@")[0]
                                }
                            }
                        }
                    } catch {
                        Write-Host "Falha ao decodificar token do Google: $_"
                    }
                }
                elseif ($null -ne $data.mockUsername) {
                    $username = $data.mockUsername.Trim().ToLower()
                    $displayName = $data.mockDisplayName
                }

                # Cria usuário se não existir
                $user = $null
                if ($users.Count -gt 0 -or $users.Length -gt 0) {
                    $user = $users | Where-Object { $_.username -eq $username }
                }
                
                if (-not $user) {
                    $newUser = @{
                        username = $username
                        password = "oauth_managed"
                        displayName = $displayName
                        reputacao = 50
                        titulos = 0
                        saldo = 0
                        time = "Nenhum"
                    }
                    $users += $newUser
                } else {
                    # Atualiza o nome de exibição caso tenha mudado no perfil Google
                    foreach ($u in $users) {
                        if ($u.username -eq $username) {
                            $u.displayName = $displayName
                        }
                    }
                }
                
                $users | ConvertTo-Json -Depth 5 | Set-Content -Path $usersFile
                
                $resData = @{ 
                    success = $true
                    token = "token_$username"
                    username = $username
                    displayName = $displayName
                }
            }
            elseif ($urlPath -eq "/api/save" -and $request.HttpMethod -eq "POST") {
                $authHeader = $request.Headers["Authorization"]
                if ($authHeader -match "Bearer token_(.+)") {
                    $username = $Matches[1]
                    $userSaveFile = [System.IO.Path]::Combine($savesFolder, "$username.json")
                    $reqBody | Set-Content -Path $userSaveFile
                    
                    # Extrai dados do save para atualizar o ranking
                    $saveObj = $reqBody | ConvertFrom-Json
                    $userTeam = $saveObj.times | Where-Object { $_.id -eq $saveObj.timeUsuarioId }
                    $titulosCount = 0
                    if ($null -ne $saveObj.historicoCampeoes) {
                        $titulosCount = $saveObj.historicoCampeoes.Count
                    }
                    
                    [array]$updated = @()
                    foreach ($u in $users) {
                        $rep = 50
                        $titulos = 0
                        $saldo = 0
                        $time = "Nenhum"
                        $dispName = $u.displayName
                        if ($null -eq $dispName) { $dispName = $u.username }
                        
                        if ($u.username -eq $username) {
                            $rep = $userTeam.rep
                            $titulos = $titulosCount
                            $saldo = $userTeam.saldo
                            $time = $userTeam.nome
                        } else {
                            if ($null -ne $u.reputacao) { $rep = $u.reputacao }
                            if ($null -ne $u.titulos) { $titulos = $u.titulos }
                            if ($null -ne $u.saldo) { $saldo = $u.saldo }
                            if ($null -ne $u.time) { $time = $u.time }
                        }
                        
                        $updatedUser = @{
                            username = $u.username
                            password = $u.password
                            displayName = $dispName
                            reputacao = $rep
                            titulos = $titulos
                            saldo = $saldo
                            time = $time
                        }
                        $updated = $updated + $updatedUser
                    }
                    $updated | ConvertTo-Json -Depth 5 | Set-Content -Path $usersFile
                    $resData = @{ success = $true }
                } else {
                    $statusCode = 401
                    $resData = @{ error = "Token de autenticação inválido!" }
                }
            }
            elseif ($urlPath -eq "/api/save" -and $request.HttpMethod -eq "GET") {
                $authHeader = $request.Headers["Authorization"]
                if ($authHeader -match "Bearer token_(.+)") {
                    $username = $Matches[1]
                    $userSaveFile = [System.IO.Path]::Combine($savesFolder, "$username.json")
                    if (Test-Path $userSaveFile) {
                        $resData = Get-Content -Raw -Path $userSaveFile | ConvertFrom-Json
                    } else {
                        $statusCode = 404
                        $resData = @{ error = "Nenhum save na nuvem encontrado!" }
                    }
                } else {
                    $statusCode = 401
                    $resData = @{ error = "Não autorizado!" }
                }
            }
            elseif ($urlPath -eq "/api/leaderboard" -and $request.HttpMethod -eq "GET") {
                $resData = @()
                if ($users.Count -gt 0 -or $users.Length -gt 0) {
                    $ranked = $users | Sort-Object -Property @{Expression="titulos";Descending=$true}, @{Expression="reputacao";Descending=$true}, @{Expression="saldo";Descending=$true}
                    $resData = $ranked | ForEach-Object {
                        @{
                            username = $_.username
                            time = $_.time
                            titulos = $_.titulos
                            reputacao = $_.reputacao
                            saldo = $_.saldo
                        }
                    }
                }
            }
            else {
                $statusCode = 404
                $resData = @{ error = "Endpoint de API não encontrado!" }
            }
            
            $response.StatusCode = $statusCode
            $jsonStr = $resData | ConvertTo-Json -Depth 10
            $resBytes = [System.Text.Encoding]::UTF8.GetBytes($jsonStr)
            $response.ContentLength64 = $resBytes.Length
            $response.OutputStream.Write($resBytes, 0, $resBytes.Length)
            $response.Close()
            Write-Host "[API RESPONSE] $urlPath ($statusCode)"
            continue
        }

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
