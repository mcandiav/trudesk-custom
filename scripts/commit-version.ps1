# Uso: .\scripts\commit-version.ps1 -Version "1.2.12" -Message "fix: descripcion breve"
# Crea commit con asunto [V1.2.12@abc1234] para que EasyPanel lo muestre en Deployment History.
# Actualiza VERSION (fuente de VERSION_APP), package.json y .git-commit (badge UI).

param(
    [Parameter(Mandatory = $true)]
    [string]$Version,

    [Parameter(Mandatory = $true)]
    [string]$Message
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$versionFile = Join-Path $root "VERSION"
$packageFile = Join-Path $root "package.json"
$gitCommitFile = Join-Path $root ".git-commit"
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)

# Always write VERSION without BOM (PS 5 Set-Content -Encoding UTF8 adds U+FEFF)
[System.IO.File]::WriteAllText($versionFile, $Version, $utf8NoBom)
git add $versionFile

if (Test-Path $packageFile) {
    $pkg = [System.IO.File]::ReadAllText($packageFile, $utf8NoBom)
    $pkg = $pkg -replace '("version"\s*:\s*")[^"]+(")', "`${1}$Version`${2}"
    [System.IO.File]::WriteAllText($packageFile, $pkg, $utf8NoBom)
    git add $packageFile
}

git diff --cached --quiet 2>$null
$cachedEmpty = ($LASTEXITCODE -eq 0)
git diff --quiet 2>$null
$workClean = ($LASTEXITCODE -eq 0)
if ($cachedEmpty -and $workClean) {
    Write-Error "No hay cambios para commitear. Haz git add de tus archivos antes."
}

# Incluye cambios ya staged + VERSION/package.json
git commit -m "[$Version] $Message"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$hash = (git rev-parse --short=7 HEAD).Trim()
[System.IO.File]::WriteAllText($gitCommitFile, $hash, [System.Text.ASCIIEncoding]::new())
git add $gitCommitFile

$subject = "[V$Version@$hash] $Message"
git commit --amend -m $subject
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "OK: $subject"
Write-Host "EasyPanel Deployment History mostrara este asunto."
Write-Host "Badge UI: $Version@$hash (archivo .git-commit)"
git log -1 --oneline
