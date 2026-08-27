param(
  [string]$DataPath = 'data/scientists.yaml',
  [int]$ExpectedCount = 93
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $DataPath -PathType Leaf)) {
  Write-Error "FAIL: scientist data file does not exist: $DataPath"
  exit 1
}

$entries = [System.Collections.Generic.List[object]]::new()
$currentId = $null

foreach ($line in Get-Content -LiteralPath $DataPath) {
  if ($line -match '^([A-Za-z0-9_]+):\s*$') {
    $currentId = $Matches[1]
    continue
  }

  if ($line -match '^  cartoon:\s*"([^"]+)"') {
    $entries.Add([PSCustomObject]@{ Id = $currentId; Path = $Matches[1] })
  }
}

$failures = [System.Collections.Generic.List[string]]::new()
if ($entries.Count -ne $ExpectedCount) {
  $failures.Add("YAML references $($entries.Count) cartoons, expected $ExpectedCount")
}

$defaultCartoonPath = 'images/cartoons/default.png'
$duplicates = $entries | Group-Object Path | Where-Object { $_.Count -gt 1 -and $_.Name -ne $defaultCartoonPath }
foreach ($duplicate in $duplicates) {
  $failures.Add("duplicate cartoon path is referenced $($duplicate.Count) times: $($duplicate.Name)")
}

$validator = Join-Path $PSScriptRoot 'validate-cartoon-asset.ps1'
$passed = 0

foreach ($entry in $entries) {
  if (-not (Test-Path -LiteralPath $entry.Path -PathType Leaf)) {
    $failures.Add("$($entry.Id): missing file $($entry.Path)")
    continue
  }

  if ($entry.Path -eq $defaultCartoonPath) {
    $output = & pwsh -NoProfile -File $validator -Path $entry.Path -AllowSymbol 2>&1
  }
  else {
    $output = & pwsh -NoProfile -File $validator -Path $entry.Path 2>&1
  }
  if ($LASTEXITCODE -eq 0) {
    $passed++
    Write-Output "PASS [$($entry.Id)] $($entry.Path)"
  }
  else {
    $detail = ($output | ForEach-Object ToString) -join '; '
    $failures.Add("$($entry.Id): $detail")
  }
}

if ($failures.Count -gt 0) {
  foreach ($failure in $failures) {
    [Console]::Error.WriteLine("FAIL: $failure")
  }
  [Console]::Error.WriteLine("SET FAIL: $passed/$($entries.Count) live cartoons passed validation.")
  exit 1
}

Write-Output "SET PASS: all $passed cartoon references are present and valid; all non-default paths are unique."
