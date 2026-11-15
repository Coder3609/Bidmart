Add-Type -AssemblyName System.Drawing
$file = Convert-Path "Shopping-Site\frontend\assets\auction_steps_banner.jpg"
$src = [System.Drawing.Image]::FromFile($file)
$width = [int]$src.Width
$height = [int]$src.Height
$w = [int]($width / 3)

Write-Host "Source image: $width x $height"

for ($i = 0; $i -lt 3; $i++) {
    $x = $i * $w
    $partW = if ($i -eq 2) { $width - $x } else { $w }
    $bmp = New-Object System.Drawing.Bitmap $partW, $height
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $srcRect = New-Object System.Drawing.Rectangle $x, 0, $partW, $height
    $destRect = New-Object System.Drawing.Rectangle 0, 0, $partW, $height
    $g.DrawImage($src, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $outPath = "Shopping-Site\frontend\assets\auction_step_$($i+1).jpg"
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Saved step $($i+1): $outPath"
}
$src.Dispose()
Write-Host "Banner slicing complete!"

