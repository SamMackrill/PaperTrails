param(
  [Parameter(Mandatory = $true)]
  [string]$InputPath,

  [Parameter(Mandatory = $true)]
  [string]$OutputPath
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $InputPath -PathType Leaf)) {
  Write-Error "Input file does not exist: $InputPath"
  exit 1
}

$resolvedInput = (Resolve-Path -LiteralPath $InputPath).Path
$resolvedOutput = [IO.Path]::GetFullPath($OutputPath)

if ([StringComparer]::OrdinalIgnoreCase.Equals($resolvedInput, $resolvedOutput)) {
  Write-Error 'InputPath and OutputPath must refer to different files.'
  exit 1
}

$outputDirectory = [IO.Path]::GetDirectoryName($resolvedOutput)

if (-not (Test-Path -LiteralPath $outputDirectory -PathType Container)) {
  New-Item -ItemType Directory -Path $outputDirectory | Out-Null
}

Add-Type -AssemblyName System.Drawing

if (-not ('PaperTrails.CartoonAssetFinisher' -as [type])) {
  $drawingAssemblies = @(
    [System.Object].Assembly.Location
    [System.Drawing.Bitmap].Assembly.Location
    [System.Drawing.Color].Assembly.Location
    [System.Reflection.Assembly]::Load('System.Private.Windows.GdiPlus').Location
    [System.Reflection.Assembly]::Load('System.Private.Windows.Core').Location
  )
  Add-Type -ReferencedAssemblies $drawingAssemblies -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;

namespace PaperTrails
{
    public static class CartoonAssetFinisher
    {
        private static bool IsEdgeBackground(byte blue, byte green, byte red)
        {
            int minimum = Math.Min(red, Math.Min(green, blue));
            int maximum = Math.Max(red, Math.Max(green, blue));

            // Image-generation previews sometimes bake a very pale neutral
            // checkerboard into the RGB pixels. Only pixels connected to the
            // canvas edge are removed, so enclosed white details are retained.
            return minimum >= 210 && (maximum - minimum) <= 32;
        }

        public static int Finish(string inputPath, string outputPath)
        {
            using (var sourceFile = new Bitmap(inputPath))
            using (var source = new Bitmap(sourceFile.Width, sourceFile.Height, PixelFormat.Format32bppArgb))
            {
                using (Graphics graphics = Graphics.FromImage(source))
                {
                    graphics.CompositingMode = CompositingMode.SourceCopy;
                    graphics.DrawImageUnscaled(sourceFile, 0, 0);
                }

                int width = source.Width;
                int height = source.Height;
                var rectangle = new Rectangle(0, 0, width, height);
                BitmapData data = source.LockBits(rectangle, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
                int stride = Math.Abs(data.Stride);
                byte[] pixels = new byte[stride * height];
                Marshal.Copy(data.Scan0, pixels, 0, pixels.Length);

                var background = new bool[width * height];
                var queue = new int[width * height];
                int queueStart = 0;
                int queueEnd = 0;

                Action<int, int> enqueue = (x, y) =>
                {
                    int index = (y * width) + x;
                    if (background[index]) return;

                    int offset = (y * stride) + (x * 4);
                    if (!IsEdgeBackground(pixels[offset], pixels[offset + 1], pixels[offset + 2])) return;

                    background[index] = true;
                    queue[queueEnd++] = index;
                };

                // Portrait clothing is intentionally allowed to run out of the
                // lower frame. Never seed from the bottom edge: a pale shirt or
                // collar may touch it and must not become transparent.
                for (int x = 0; x < width; x++) enqueue(x, 0);

                for (int y = 1; y < height - 1; y++)
                {
                    enqueue(0, y);
                    enqueue(width - 1, y);
                }

                while (queueStart < queueEnd)
                {
                    int index = queue[queueStart++];
                    int x = index % width;
                    int y = index / width;

                    if (x > 0) enqueue(x - 1, y);
                    if (x + 1 < width) enqueue(x + 1, y);
                    if (y > 0) enqueue(x, y - 1);
                    if (y + 1 < height) enqueue(x, y + 1);
                }

                int removedPixels = 0;
                for (int y = 0; y < height; y++)
                {
                    for (int x = 0; x < width; x++)
                    {
                        if (!background[(y * width) + x]) continue;

                        int offset = (y * stride) + (x * 4);
                        pixels[offset] = 0;
                        pixels[offset + 1] = 0;
                        pixels[offset + 2] = 0;
                        pixels[offset + 3] = 0;
                        removedPixels++;
                    }
                }

                Marshal.Copy(pixels, 0, data.Scan0, pixels.Length);
                source.UnlockBits(data);

                using (var output = new Bitmap(1024, 1024, PixelFormat.Format32bppArgb))
                {
                    output.SetResolution(96, 96);
                    using (Graphics graphics = Graphics.FromImage(output))
                    {
                        graphics.Clear(Color.Transparent);
                        graphics.CompositingMode = CompositingMode.SourceCopy;
                        graphics.CompositingQuality = CompositingQuality.HighQuality;
                        graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
                        graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;
                        graphics.SmoothingMode = SmoothingMode.HighQuality;
                        graphics.DrawImage(source, new Rectangle(0, 0, 1024, 1024));
                    }

                    // Keep all canvas corners unambiguously outside the cutout.
                    output.SetPixel(0, 0, Color.Transparent);
                    output.SetPixel(output.Width - 1, 0, Color.Transparent);
                    output.SetPixel(0, output.Height - 1, Color.Transparent);
                    output.SetPixel(output.Width - 1, output.Height - 1, Color.Transparent);

                    output.Save(outputPath, ImageFormat.Png);
                }

                return removedPixels;
            }
        }
    }
}
'@
}

$removed = [PaperTrails.CartoonAssetFinisher]::Finish($resolvedInput, $resolvedOutput)
Write-Output "Finished $resolvedOutput (removed $removed edge-connected background pixels)."
