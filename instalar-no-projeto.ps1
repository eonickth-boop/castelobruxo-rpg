$ErrorActionPreference = "Stop"

$raizInstalador = Split-Path -Parent $MyInvocation.MyCommand.Path
$destinoProjeto = Get-Location

if (-not (Test-Path (Join-Path $destinoProjeto "package.json"))) {
    Write-Host "ERRO: execute este script na pasta raiz do castelobruxo-rpg." -ForegroundColor Red
    exit 1
}

$origemAssets = Join-Path $raizInstalador "public\assets\decoracao-vintage"
$destinoAssets = Join-Path $destinoProjeto "public\assets\decoracao-vintage"

$origemResolvida = [System.IO.Path]::GetFullPath($origemAssets).TrimEnd('\')
$destinoResolvido = [System.IO.Path]::GetFullPath($destinoAssets).TrimEnd('\')

if (-not (Test-Path $origemAssets)) {
    Write-Host "ERRO: a pasta de assets não foi encontrada junto do instalador." -ForegroundColor Red
    exit 1
}

if ($origemResolvida -ieq $destinoResolvido) {
    Write-Host "Os assets já estão na pasta correta do projeto." -ForegroundColor Green
}
else {
    if (Test-Path $destinoAssets) {
        $backup = Join-Path $destinoProjeto ("backup-decoracao-vintage-" + (Get-Date -Format "yyyyMMdd-HHmmss"))
        New-Item -ItemType Directory -Force -Path $backup | Out-Null
        Copy-Item $destinoAssets -Destination $backup -Recurse -Force
        Write-Host "Backup criado em: $backup" -ForegroundColor DarkYellow
    }

    New-Item -ItemType Directory -Force -Path $destinoAssets | Out-Null
    Copy-Item (Join-Path $origemAssets "*") -Destination $destinoAssets -Recurse -Force
    Write-Host "Assets copiados para o projeto." -ForegroundColor Green
}

$mapaInterno = Join-Path $destinoAssets "mapas\mapa-interno.png"
$mapaExterno = Join-Path $destinoAssets "mapas\mapa-externo.png"

if (-not (Test-Path $mapaInterno)) {
    Write-Host "ERRO: mapa-interno.png não foi encontrado." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $mapaExterno)) {
    Write-Host "ERRO: mapa-externo.png não foi encontrado." -ForegroundColor Red
    exit 1
}

$quantidade = (Get-ChildItem $destinoAssets -File -Recurse).Count
Write-Host ""
Write-Host "Instalação validada com sucesso." -ForegroundColor Green
Write-Host "Arquivos encontrados: $quantidade" -ForegroundColor Cyan
Write-Host "Mapa interno: OK" -ForegroundColor Green
Write-Host "Mapa externo: OK" -ForegroundColor Green
Write-Host ""
Write-Host "Agora execute:" -ForegroundColor Yellow
Write-Host "git add -f public/assets/decoracao-vintage"
Write-Host 'git commit -m "Adiciona decoração vintage oficial"'
Write-Host "git push origin main"
