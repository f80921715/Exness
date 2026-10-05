$wa = 'https://wa.me/18284475928?text=Hello%2C%20I%20would%20like%20to%20get%20in%20touch%20with%20support.'
$old = 'https://wa.me/'
$files = Get-ChildItem 'c:\Users\Destiny\Desktop\broker\dashboard' -Filter '*.html'
foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    if ($content.Contains($old)) {
        $updated = $content.Replace($old, $wa)
        [System.IO.File]::WriteAllText($file.FullName, $updated)
        Write-Host "Updated: $($file.Name)"
    } else {
        Write-Host "Skipped: $($file.Name)"
    }
}
