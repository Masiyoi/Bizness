$membersControllerPath = "Server\controllers\membersController.js"
$authControllerPath    = "Server\controllers\authController.js"
$registerComponentPath = "frontend\src\pages\Register.tsx"

function Show-Context {
    param($Path, $Anchor, $Label)
    Write-Host ""
    Write-Host "===== $Label ($Path) =====" -ForegroundColor Cyan
    if (-not (Test-Path $Path)) {
        Write-Host "FILE NOT FOUND" -ForegroundColor Red
        return
    }
    $lines = Get-Content -LiteralPath $Path
    $idx = ($lines | Select-String -Pattern $Anchor -SimpleMatch).LineNumber
    if (-not $idx) {
        Write-Host "ANCHOR '$Anchor' NOT FOUND IN FILE" -ForegroundColor Red
        return
    }
    foreach ($i in $idx) {
        $start = [Math]::Max(0, $i - 2)
        $end   = [Math]::Min($lines.Count - 1, $i + 25)
        Write-Host "--- match at line $i ---" -ForegroundColor Yellow
        for ($j = $start; $j -le $end; $j++) {
            Write-Host ("{0,4}: {1}" -f ($j+1), $lines[$j])
        }
    }
    $raw = Get-Content -Raw -LiteralPath $Path
    $hasCRLF = $raw -match "`r`n"
    if ($hasCRLF) { Write-Host "Line endings: CRLF" } else { Write-Host "Line endings: LF" }
}

Show-Context -Path $membersControllerPath -Anchor "awardOrderPoints" -Label "awardOrderPoints"
Show-Context -Path $authControllerPath -Anchor "googleAuth" -Label "googleAuth"
Show-Context -Path $registerComponentPath -Anchor "handleGoogleResponse" -Label "handleGoogleResponse"