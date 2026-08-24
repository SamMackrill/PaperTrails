param(
  [Parameter(Mandatory = $true)]
  [string]$ScientistIds,

  [string]$CandidateDirectory = 'docs/cartoon-style-test',

  [Parameter(Mandatory = $true)]
  [string]$OutputPath
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$scientistIdList = @($ScientistIds.Split(',', [System.StringSplitOptions]::RemoveEmptyEntries))

$panelWidth = 680
$panelHeight = 600
$gap = 28
$margin = 52
$titleHeight = 100
$rowLabelHeight = 54
$rowGap = 34
$rowHeight = $rowLabelHeight + $panelHeight + $rowGap
$canvasWidth = ($margin * 2) + ($panelWidth * 3) + ($gap * 2)
$canvasHeight = $titleHeight + ($scientistIdList.Count * $rowHeight) + $margin

$canvas = [System.Drawing.Bitmap]::new($canvasWidth, $canvasHeight, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$graphics = [System.Drawing.Graphics]::FromImage($canvas)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#f3efe6'))

$titleFont = [System.Drawing.Font]::new('Arial', 30, [System.Drawing.FontStyle]::Bold)
$headingFont = [System.Drawing.Font]::new('Arial', 20, [System.Drawing.FontStyle]::Bold)
$labelFont = [System.Drawing.Font]::new('Arial', 22, [System.Drawing.FontStyle]::Bold)
$smallFont = [System.Drawing.Font]::new('Arial', 14, [System.Drawing.FontStyle]::Bold)
$ink = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#16383a'))
$mutedInk = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#496164'))
$borderPen = [System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml('#173e40'), 4)
$lightPanel = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#ddd8cd'))
$darkProof = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#234f54'))
$lightProof = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#e9c997'))

function Draw-ContainedImage {
  param(
    [System.Drawing.Graphics]$Target,
    [System.Drawing.Image]$Image,
    [System.Drawing.Rectangle]$Bounds,
    [int]$Padding = 12
  )

  $availableWidth = $Bounds.Width - ($Padding * 2)
  $availableHeight = $Bounds.Height - ($Padding * 2)
  $scale = [Math]::Min($availableWidth / $Image.Width, $availableHeight / $Image.Height)
  $width = [int][Math]::Round($Image.Width * $scale)
  $height = [int][Math]::Round($Image.Height * $scale)
  $x = $Bounds.X + [int](($Bounds.Width - $width) / 2)
  $y = $Bounds.Y + [int](($Bounds.Height - $height) / 2)
  $Target.DrawImage($Image, [System.Drawing.Rectangle]::new($x, $y, $width, $height))
}

function Get-ScientistAssets {
  param([string]$ScientistId)

  $inEntry = $false
  $name = $null
  $photo = $null
  $cartoon = $null

  foreach ($line in Get-Content -LiteralPath 'data/scientists.yaml') {
    if ($line -match '^([A-Za-z0-9_]+):\s*$') {
      if ($inEntry) { break }
      $inEntry = $Matches[1] -ieq $ScientistId
      continue
    }

    if (-not $inEntry) { continue }
    if ($line -match '^  name:\s*"([^"]+)"') { $name = $Matches[1] }
    if ($line -match '^  photo:\s*"([^"]+)"') { $photo = $Matches[1] }
    if ($line -match '^  cartoon:\s*"([^"]+)"') { $cartoon = $Matches[1] }
  }

  if (-not $name -or -not $photo -or -not $cartoon) {
    throw "Could not resolve name, photo, and cartoon for scientist id: $ScientistId"
  }

  [PSCustomObject]@{ Name = $name; Photo = $photo; Cartoon = $cartoon }
}

try {
  $graphics.DrawString('Paper Trails cartoon review — proposed candidates', $titleFont, $ink, $margin, 28)

  $headings = @('ORIGINAL PHOTO / PORTRAIT', 'BEFORE', 'AFTER — PROPOSED')
  for ($column = 0; $column -lt 3; $column++) {
    $x = $margin + ($column * ($panelWidth + $gap))
    $size = $graphics.MeasureString($headings[$column], $headingFont)
    $graphics.DrawString($headings[$column], $headingFont, $mutedInk, $x + (($panelWidth - $size.Width) / 2), 67)
  }

  for ($row = 0; $row -lt $scientistIdList.Count; $row++) {
    $id = $scientistIdList[$row].Trim()
    $assets = Get-ScientistAssets -ScientistId $id
    $displayName = $assets.Name
    $rowTop = $titleHeight + ($row * $rowHeight)
    $graphics.DrawString($displayName, $labelFont, $ink, $margin, $rowTop + 10)

    $paths = @(
      $assets.Photo,
      $assets.Cartoon,
      (Join-Path $CandidateDirectory "$id-v2-validated.png")
    )

    for ($column = 0; $column -lt 3; $column++) {
      if (-not (Test-Path -LiteralPath $paths[$column] -PathType Leaf)) {
        throw "Review image does not exist: $($paths[$column])"
      }

      $x = $margin + ($column * ($panelWidth + $gap))
      $y = $rowTop + $rowLabelHeight
      $panel = [System.Drawing.Rectangle]::new($x, $y, $panelWidth, $panelHeight)

      if ($column -eq 2) {
        $leftHalf = [System.Drawing.Rectangle]::new($x, $y, [int]($panelWidth / 2), $panelHeight)
        $rightHalf = [System.Drawing.Rectangle]::new($x + [int]($panelWidth / 2), $y, [int]($panelWidth / 2), $panelHeight)
        $graphics.FillRectangle($darkProof, $leftHalf)
        $graphics.FillRectangle($lightProof, $rightHalf)
      }
      else {
        $graphics.FillRectangle($lightPanel, $panel)
      }

      $image = [System.Drawing.Image]::FromFile((Resolve-Path -LiteralPath $paths[$column]).Path)
      try {
        Draw-ContainedImage -Target $graphics -Image $image -Bounds $panel
      }
      finally {
        $image.Dispose()
      }

      $graphics.DrawRectangle($borderPen, $panel)
      if ($column -eq 2) {
        $graphics.DrawString('dark/light proof background', $smallFont, [System.Drawing.Brushes]::White, $x + 16, $y + 14)
      }
    }
  }

  $resolvedOutput = [IO.Path]::GetFullPath($OutputPath)

  $inputPaths = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
  foreach ($id in $scientistIdList) {
    $assets = Get-ScientistAssets -ScientistId $id.Trim()
    $inputPaths.Add([IO.Path]::GetFullPath($assets.Photo)) | Out-Null
    $inputPaths.Add([IO.Path]::GetFullPath($assets.Cartoon)) | Out-Null
    $candidatePath = Join-Path $CandidateDirectory "$($id.Trim())-v2-validated.png"
    $inputPaths.Add([IO.Path]::GetFullPath($candidatePath)) | Out-Null
  }

  if ($inputPaths.Contains($resolvedOutput)) {
    throw "Output path '$resolvedOutput' collides with one of the input source files. Choose a different output path."
  }

  $outputDirectory = [IO.Path]::GetDirectoryName($resolvedOutput)
  if (-not (Test-Path -LiteralPath $outputDirectory -PathType Container)) {
    New-Item -ItemType Directory -Path $outputDirectory | Out-Null
  }

  $canvas.Save($resolvedOutput, [System.Drawing.Imaging.ImageFormat]::Png)
  Write-Output "Created $resolvedOutput"
}
finally {
  $darkProof.Dispose()
  $lightProof.Dispose()
  $lightPanel.Dispose()
  $borderPen.Dispose()
  $ink.Dispose()
  $mutedInk.Dispose()
  $titleFont.Dispose()
  $headingFont.Dispose()
  $labelFont.Dispose()
  $smallFont.Dispose()
  $graphics.Dispose()
  $canvas.Dispose()
}
