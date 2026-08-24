param(
  [string]$DataPath = 'data/scientists.yaml',
  [string]$OutputPath = 'docs/cartoon-redraw-review/all-92-small-crops.png',
  [int]$Columns = 10
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$entries = [System.Collections.Generic.List[object]]::new()
$currentId = $null
$currentName = $null

foreach ($line in Get-Content -LiteralPath $DataPath) {
  if ($line -match '^([A-Za-z0-9_]+):\s*$') {
    $currentId = $Matches[1]
    $currentName = $null
    continue
  }

  if ($line -match '^  name:\s*"([^"]+)"') {
    $currentName = $Matches[1]
    continue
  }

  if ($line -match '^  cartoon:\s*"([^"]+)"') {
    $entries.Add([PSCustomObject]@{
      Id = $currentId
      Name = $currentName
      Path = $Matches[1]
    })
  }
}

if ($entries.Count -eq 0) {
  throw "No cartoon entries found in $DataPath"
}

$tileWidth = 220
$tileHeight = 178
$margin = 28
$titleHeight = 76
$rows = [int][Math]::Ceiling($entries.Count / $Columns)
$canvasWidth = ($Columns * $tileWidth) + ($margin * 2)
$canvasHeight = ($rows * $tileHeight) + $titleHeight + $margin
$canvas = [System.Drawing.Bitmap]::new($canvasWidth, $canvasHeight, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$graphics = [System.Drawing.Graphics]::FromImage($canvas)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#f3efe6'))

$ink = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#16383a'))
$darkProof = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#234f54'))
$lightProof = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#e9c997'))
$grayProof = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#bbb7ae'))
$panel = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#e5dfd3'))
$border = [System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml('#173e40'), 2)
$titleFont = [System.Drawing.Font]::new('Arial', 23, [System.Drawing.FontStyle]::Bold)
$nameFont = [System.Drawing.Font]::new('Arial', 10, [System.Drawing.FontStyle]::Bold)
$smallFont = [System.Drawing.Font]::new('Arial', 8, [System.Drawing.FontStyle]::Regular)

$grayMatrix = [System.Drawing.Imaging.ColorMatrix]::new(@(
  [single[]]@(0.299, 0.299, 0.299, 0, 0),
  [single[]]@(0.587, 0.587, 0.587, 0, 0),
  [single[]]@(0.114, 0.114, 0.114, 0, 0),
  [single[]]@(0, 0, 0, 1, 0),
  [single[]]@(0, 0, 0, 0, 1)
))
$grayAttributes = [System.Drawing.Imaging.ImageAttributes]::new()
$grayAttributes.SetColorMatrix($grayMatrix)

function Draw-CircularCrop {
  param(
    [System.Drawing.Graphics]$Target,
    [System.Drawing.Image]$Image,
    [int]$X,
    [int]$Y,
    [int]$Size,
    [System.Drawing.Imaging.ImageAttributes]$Attributes = $null
  )

  $state = $Target.Save()
  $clip = [System.Drawing.Drawing2D.GraphicsPath]::new()
  try {
    $clip.AddEllipse($X, $Y, $Size, $Size)
    $Target.SetClip($clip)
    $destination = [System.Drawing.Rectangle]::new($X, $Y, $Size, $Size)
    if ($null -eq $Attributes) {
      $Target.DrawImage($Image, $destination)
    }
    else {
      $Target.DrawImage(
        $Image,
        $destination,
        0,
        0,
        $Image.Width,
        $Image.Height,
        [System.Drawing.GraphicsUnit]::Pixel,
        $Attributes
      )
    }
  }
  finally {
    $Target.Restore($state)
    $clip.Dispose()
  }
}

try {
  $graphics.DrawString(
    "All $($entries.Count) live cartoons — 92 px colour and 42 px grayscale circular-crop proof",
    $titleFont,
    $ink,
    $margin,
    22
  )

  for ($index = 0; $index -lt $entries.Count; $index++) {
    $entry = $entries[$index]
    if (-not (Test-Path -LiteralPath $entry.Path -PathType Leaf)) {
      throw "Cartoon does not exist: $($entry.Path)"
    }

    $column = $index % $Columns
    $row = [int][Math]::Floor($index / $Columns)
    $x = $margin + ($column * $tileWidth)
    $y = $titleHeight + ($row * $tileHeight)
    $graphics.FillRectangle($panel, $x + 5, $y + 5, $tileWidth - 10, $tileHeight - 10)
    $graphics.DrawRectangle($border, $x + 5, $y + 5, $tileWidth - 10, $tileHeight - 10)

    $label = if ($entry.Name) { $entry.Name } else { $entry.Id }
    $layout = [System.Drawing.RectangleF]::new($x + 14, $y + 13, $tileWidth - 28, 23)
    $format = [System.Drawing.StringFormat]::new()
    try {
      $format.Trimming = [System.Drawing.StringTrimming]::EllipsisCharacter
      $format.FormatFlags = [System.Drawing.StringFormatFlags]::NoWrap
      $graphics.DrawString($label, $nameFont, $ink, $layout, $format)
    }
    finally {
      $format.Dispose()
    }

    $image = [System.Drawing.Image]::FromFile((Resolve-Path -LiteralPath $entry.Path).Path)
    try {
      $colourX = $x + 20
      $colourY = $y + 47
      $colourSize = 92
      $graphics.FillEllipse($darkProof, $colourX, $colourY, $colourSize / 2, $colourSize)
      $graphics.FillEllipse($lightProof, $colourX + ($colourSize / 2), $colourY, $colourSize / 2, $colourSize)
      Draw-CircularCrop -Target $graphics -Image $image -X $colourX -Y $colourY -Size $colourSize
      $graphics.DrawEllipse($border, $colourX, $colourY, $colourSize, $colourSize)

      $grayX = $x + 145
      $grayY = $y + 72
      $graySize = 42
      $graphics.FillEllipse($grayProof, $grayX, $grayY, $graySize, $graySize)
      Draw-CircularCrop -Target $graphics -Image $image -X $grayX -Y $grayY -Size $graySize -Attributes $grayAttributes
      $graphics.DrawEllipse($border, $grayX, $grayY, $graySize, $graySize)

      $graphics.DrawString('92 colour', $smallFont, $ink, $colourX + 18, $colourY + $colourSize + 7)
      $graphics.DrawString('42 gray', $smallFont, $ink, $grayX - 1, $grayY + $graySize + 7)
    }
    finally {
      $image.Dispose()
    }
  }

  $resolvedOutput = [IO.Path]::GetFullPath($OutputPath)
  $outputDirectory = [IO.Path]::GetDirectoryName($resolvedOutput)
  if (-not (Test-Path -LiteralPath $outputDirectory -PathType Container)) {
    New-Item -ItemType Directory -Path $outputDirectory | Out-Null
  }
  $canvas.Save($resolvedOutput, [System.Drawing.Imaging.ImageFormat]::Png)
  Write-Output "Created $resolvedOutput"
}
finally {
  $grayAttributes.Dispose()
  $smallFont.Dispose()
  $nameFont.Dispose()
  $titleFont.Dispose()
  $border.Dispose()
  $panel.Dispose()
  $grayProof.Dispose()
  $lightProof.Dispose()
  $darkProof.Dispose()
  $ink.Dispose()
  $graphics.Dispose()
  $canvas.Dispose()
}
