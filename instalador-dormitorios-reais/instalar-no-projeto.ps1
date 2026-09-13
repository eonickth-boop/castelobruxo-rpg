param(
    [string]$Projeto = ""
)

$ErrorActionPreference = "Stop"
$PastaPacote = Split-Path -Parent $MyInvocation.MyCommand.Path

if ([string]::IsNullOrWhiteSpace($Projeto)) {
    $Projeto = Get-Location
}

$Projeto = (Resolve-Path $Projeto).Path
$PackageJson = Join-Path $Projeto "package.json"

if (-not (Test-Path $PackageJson)) {
    Write-Host "Nao encontrei package.json em: $Projeto" -ForegroundColor Red
    Write-Host "Abra o PowerShell na pasta castelobruxo-rpg ou execute:" -ForegroundColor Yellow
    Write-Host '.\instalar-no-projeto.ps1 -Projeto "C:\caminho\castelobruxo-rpg"'
    exit 1
}

$Data = Get-Date -Format "yyyyMMdd-HHmmss"
$Backup = Join-Path $Projeto "backup-dormitorios-$Data"
$Destino = Join-Path $Projeto "public\assets\dormitorios"
$Origem = Join-Path $PastaPacote "public\assets\dormitorios"

if (Test-Path $Destino) {
    New-Item -ItemType Directory -Path $Backup -Force | Out-Null
    Copy-Item $Destino (Join-Path $Backup "dormitorios") -Recurse -Force
    Write-Host "Backup criado em $Backup" -ForegroundColor Cyan
}

New-Item -ItemType Directory -Path $Destino -Force | Out-Null
Copy-Item (Join-Path $Origem "*") $Destino -Recurse -Force

Write-Host "Assets reais dos dormitorios instalados." -ForegroundColor Green

if (Test-Path (Join-Path $Projeto ".git")) {
    Push-Location $Projeto
    try {
        git add public/assets/dormitorios
        git commit -m "Adiciona assets reais dos dormitorios"
        git push
        Write-Host "Assets enviados ao GitHub. A Vercel publicara automaticamente." -ForegroundColor Green
    }
    catch {
        Write-Host "Os arquivos foram copiados, mas o envio ao GitHub falhou." -ForegroundColor Yellow
        Write-Host "Abra o GitHub Desktop ou execute git add/commit/push manualmente." -ForegroundColor Yellow
    }
    finally {
        Pop-Location
    }
} else {
    Write-Host "Projeto sem pasta .git. Os arquivos foram copiados localmente." -ForegroundColor Yellow
}
