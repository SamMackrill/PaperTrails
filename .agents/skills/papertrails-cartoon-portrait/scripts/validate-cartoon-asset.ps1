param(
  [Parameter(Mandatory = $true)]
  [string]$Path,

  [switch]$AllowSymbol
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
  Write-Error "FAIL: file does not exist: $Path"
  exit 1
}

$resolvedPath = (Resolve-Path -LiteralPath $Path).Path
$failures = [System.Collections.Generic.List[string]]::new()

if ([IO.Path]::GetExtension($resolvedPath) -ine '.png') {
  $failures.Add('file extension must be .png')
}

Add-Type -AssemblyName System.Drawing
$bitmap = [System.Drawing.Bitmap]::FromFile($resolvedPath)

try {
  if ($bitmap.Width -ne 1024 -or $bitmap.Height -ne 1024) {
    $failures.Add("dimensions are $($bitmap.Width)x$($bitmap.Height), expected 1024x1024")
  }

  $pixelFormat = $bitmap.PixelFormat.ToString()
  if ($pixelFormat -notmatch 'Argb|PArgb|Alpha') {
    $failures.Add("pixel format $pixelFormat has no alpha channel")
  }

  $topLeftAlpha = $bitmap.GetPixel(0, 0).A
  $topRightAlpha = $bitmap.GetPixel($bitmap.Width - 1, 0).A
  $bottomLeftAlpha = $bitmap.GetPixel(0, $bitmap.Height - 1).A
  $bottomRightAlpha = $bitmap.GetPixel($bitmap.Width - 1, $bitmap.Height - 1).A
  if ($topLeftAlpha -ne 0 -or $topRightAlpha -ne 0 -or $bottomLeftAlpha -ne 0 -or $bottomRightAlpha -ne 0) {
    $failures.Add("background corners are not fully transparent (alpha $topLeftAlpha, $topRightAlpha, $bottomLeftAlpha, and $bottomRightAlpha)")
  }

  $transparentSamples = 0
  $opaqueSamples = 0
  $sampleCount = 0
  $centralTransparentSamples = 0
  $centralSampleCount = 0
  for ($y = 0; $y -lt $bitmap.Height; $y += 32) {
    for ($x = 0; $x -lt $bitmap.Width; $x += 32) {
      $alpha = $bitmap.GetPixel($x, $y).A
      $sampleCount++
      if ($alpha -eq 0) { $transparentSamples++ }
      if ($alpha -ge 240) { $opaqueSamples++ }

      if (
        $x -ge ($bitmap.Width * 0.28) -and $x -le ($bitmap.Width * 0.72) -and
        $y -ge ($bitmap.Height * 0.60) -and $y -le ($bitmap.Height * 0.94)
      ) {
        $centralSampleCount++
        if ($alpha -eq 0) { $centralTransparentSamples++ }
      }
    }
  }

  if ($transparentSamples -lt [Math]::Ceiling($sampleCount * 0.30)) {
    $failures.Add('sampled canvas contains too little genuine transparency for a portrait cutout; check for an opaque disc, frame, or scenic backdrop')
  }

  if ($opaqueSamples -lt [Math]::Ceiling($sampleCount * 0.10)) {
    $failures.Add('sampled canvas contains too little opaque portrait content')
  }

  if (-not $AllowSymbol) {
    $centralTransparentRatio = $centralTransparentSamples / $centralSampleCount
    if ($centralTransparentRatio -gt 0.25) {
      $failures.Add("central bust region is $([Math]::Round($centralTransparentRatio * 100, 1))% fully transparent; inspect pale clothing for holes")
    }
    elseif ($centralTransparentRatio -gt 0.08) {
      [Console]::Error.WriteLine("WARN: central bust region is $([Math]::Round($centralTransparentRatio * 100, 1))% fully transparent; confirm intentional gaps on a contrasting background.")
    }
  }

  if ($failures.Count -gt 0) {
    foreach ($failure in $failures) {
      [Console]::Error.WriteLine("FAIL: $failure")
    }
    exit 1
  }

  $contentType = if ($AllowSymbol) { 'symbol' } else { 'portrait' }
  Write-Output "PASS: $resolvedPath is a 1024x1024 PNG with an alpha channel, transparent canvas background, and opaque $contentType content."
}
finally {
  $bitmap.Dispose()
}
