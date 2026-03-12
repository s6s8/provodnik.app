$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$inputPath = Join-Path $root "docs\investor\provodnik-investor-one-pager.html"
$outputPdf = Join-Path $root "docs\investor\provodnik-investor-one-pager.pdf"
$outputPng = Join-Path $root "docs\investor\provodnik-investor-one-pager.png"

$browserCandidates = @(
  "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
  "C:\Program Files\Microsoft\Edge\Application\msedge.exe",
  "C:\Program Files\Google\Chrome\Application\chrome.exe",
  "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
)

$browser = $browserCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $browser) {
  throw "No supported browser found for headless PDF rendering."
}

python (Join-Path $PSScriptRoot "generate_investor_one_pager.py") | Out-Null

$fileUrl = "file:///" + ($inputPath -replace "\\", "/")

& $browser --headless=new --disable-gpu --hide-scrollbars --print-to-pdf-no-header --print-to-pdf="$outputPdf" "$fileUrl" | Out-Null
& $browser --headless=new --disable-gpu --hide-scrollbars --window-size=794,1123 --screenshot="$outputPng" "$fileUrl" | Out-Null

Write-Output "Rendered $outputPdf"
Write-Output "Rendered $outputPng"
