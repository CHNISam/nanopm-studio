param(
    [switch]$Remove,
    [string]$CommandPath
)

$ErrorActionPreference = "Stop"
$programs = [Environment]::GetFolderPath("Programs")
$studioShortcut = Join-Path $programs "NanoPM Studio.lnk"

if ($Remove) {
    if (Test-Path -LiteralPath $studioShortcut) {
        Remove-Item -LiteralPath $studioShortcut
    }
    Write-Output "Removed NanoPM Studio from the Start menu."
    exit 0
}

$resolvedCommand = if ($CommandPath) {
    if (-not (Test-Path -LiteralPath $CommandPath)) {
        throw "NanoPM Studio command does not exist: $CommandPath"
    }
    (Get-Item -LiteralPath $CommandPath).FullName
} else {
    (Get-Command "nanopm-studio.cmd" -ErrorAction SilentlyContinue).Source
}
if (-not $resolvedCommand) {
    throw "nanopm-studio.cmd is not installed. Run npm link or npm install -g nanopm-studio first."
}

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($studioShortcut)
$shortcut.TargetPath = $resolvedCommand
$shortcut.WorkingDirectory = $env:USERPROFILE
$shortcut.Description = "Open NanoPM Studio with the last Product workspace"
$shortcut.Save()

$obsolete = @(
    (Join-Path $programs "NanoPM Viewer.lnk"),
    (Join-Path ([Environment]::GetFolderPath("Desktop")) "NanoPM Viewer.lnk")
)
foreach ($candidate in $obsolete) {
    if (-not (Test-Path -LiteralPath $candidate)) { continue }
    $oldShortcut = $shell.CreateShortcut($candidate)
    $expectedViewer = $oldShortcut.TargetPath -match "nanopm-cross-platform-viewer[\\/]dist[\\/]win-unpacked[\\/]NanoPM Viewer\.exe$"
    if ($expectedViewer) {
        Remove-Item -LiteralPath $candidate
        Write-Output "Removed obsolete shortcut: $candidate"
    }
}

Write-Output "Installed Start menu shortcut: $studioShortcut"
