param([Parameter(Mandatory=$true)][string]$RunDirectory)
$ErrorActionPreference = 'Stop'
$resolvedRun = [System.IO.Path]::GetFullPath($RunDirectory)
$statePath = Join-Path $resolvedRun 'state.json'
$runState = Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
if ($runState.published -or $runState.stop -or $runState.automationStopped) { exit 0 }
$implementation = Join-Path $runState.worktreeRoot '08-prototype-validation'
$head = (& git -C $implementation rev-parse HEAD).Trim()
$registered = $runState.prs | Where-Object { $_.worktree -eq $implementation }
if (-not $registered -or $head -ne $registered.validatedHead -or (& git -C $implementation status --porcelain)) { exit 0 }
foreach ($file in @('babysitter.py', 'publish_prototype.py')) {
  $source = Join-Path $implementation "tools/prototype/$file"
  $destination = Join-Path $resolvedRun $file
  if (-not (Test-Path -LiteralPath $destination) -or (Get-FileHash -LiteralPath $source).Hash -ne (Get-FileHash -LiteralPath $destination).Hash) {
    Copy-Item -LiteralPath $source -Destination $destination
  }
}
$env:PAPERTRAILS_RUN_DIR = $resolvedRun
$python = (Get-Command python -CommandType Application | Select-Object -First 1).Source
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$process = Start-Process -FilePath $python -ArgumentList @('-u', ('"' + (Join-Path $resolvedRun 'babysitter.py') + '"')) -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $resolvedRun "watcher-$stamp.log") -RedirectStandardError (Join-Path $resolvedRun "watcher-$stamp-error.log")
$process.Id | Set-Content -LiteralPath (Join-Path $resolvedRun 'watcher.pid')
