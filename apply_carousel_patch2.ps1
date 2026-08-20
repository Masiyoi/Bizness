# apply_carousel_patch2.ps1
$path = "frontend/src/pages/Reviews.tsx"

if (-not (Test-Path $path)) {
    Write-Host "X File not found: $path" -ForegroundColor Red
    exit 1
}

Copy-Item $path "$path.bak2" -Force
Write-Host "[OK] Backup created: $path.bak2"

$lines = Get-Content -Path $path -Encoding UTF8

# Confirm the anchor is still where we expect before touching anything
if ($lines[678] -notmatch "review\.media && review\.media\.length > 0") {
    Write-Host "X Line 679 does not match expected anchor. Aborting - no changes made." -ForegroundColor Red
    Write-Host "Line 679 actually contains:" -ForegroundColor Yellow
    Write-Host $lines[678]
    exit 1
}

if ($lines[708] -notmatch '^\s*\)\}\s*$') {
    Write-Host "X Line 709 does not match expected closing '){'. Aborting - no changes made." -ForegroundColor Red
    Write-Host "Line 709 actually contains:" -ForegroundColor Yellow
    Write-Host $lines[708]
    exit 1
}

# Lines 679-709 (1-indexed) = indices 678-708 (0-indexed) — replace with one line
$replacement = "                          <MediaCarousel media={review.media || []} />"

$newLines = @()
$newLines += $lines[0..677]        # lines 1-678 unchanged
$newLines += $replacement           # replaces lines 679-709
$newLines += $lines[709..($lines.Length - 1)]  # line 710 onward unchanged

Set-Content -Path $path -Value $newLines -Encoding UTF8
Write-Host "[OK] Replaced lines 679-709 with MediaCarousel call"
Write-Host "Done. Saved: $path" -ForegroundColor Cyan