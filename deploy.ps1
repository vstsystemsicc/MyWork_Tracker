# Publishes the app to a GitHub Pages repository.
#
#   .\deploy.ps1 -Remote https://github.com/<user>/mywork-tracker.git
#
# First run: creates the commit and pushes. Later runs: rebuilds, commits and
# pushes whatever changed. Your GitHub sign-in happens once, in the browser
# (Git Credential Manager), and is stored by Windows.
param(
  [string]$Remote = "",
  [string]$Message = "Update MyWork Tracker"
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$site = Join-Path $root 'site'

Push-Location $root
try {
  Write-Host 'Building dist/ ...' -ForegroundColor Magenta
  npm run build

  Write-Host 'Syncing site/ ...' -ForegroundColor Magenta
  node tools/sync-pages.mjs

  if (-not (Test-Path (Join-Path $site '.git'))) {
    Write-Host 'Creating the site git repository ...' -ForegroundColor Magenta
    git -C $site init | Out-Null
    git -C $site branch -M main
    git -C $site config credential.helper manager
  }

  if ($Remote) {
    $existing = git -C $site config --get remote.origin.url
    if ($LASTEXITCODE -eq 0 -and $existing) {
      if ($existing -ne $Remote) { git -C $site remote set-url origin $Remote }
    } else {
      git -C $site remote add origin $Remote
    }
  }

  git -C $site add -A
  $changes = git -C $site status --porcelain
  if ($changes) {
    git -C $site commit -m $Message | Out-Null
    Write-Host 'Committed.' -ForegroundColor DarkGray
  } else {
    Write-Host 'No changes since the last commit.' -ForegroundColor DarkGray
  }

  $origin = git -C $site config --get remote.origin.url
  if ($LASTEXITCODE -ne 0 -or -not $origin) {
    Write-Host ''
    Write-Host 'The site is committed locally but has no remote yet.' -ForegroundColor Yellow
    Write-Host 'Create an empty public repo on GitHub, then run once:'
    Write-Host ''
    Write-Host '  .\deploy.ps1 -Remote https://github.com/<your-user>/mywork-tracker.git'
    Write-Host ''
    exit 1
  }

  Write-Host "Pushing to $origin ..." -ForegroundColor Magenta
  git -C $site push -u origin main

  Write-Host ''
  Write-Host 'Done. In GitHub: Settings -> Pages -> Deploy from a branch -> main / (root) -> Save.' -ForegroundColor Green
  Write-Host 'The site appears at https://<your-user>.github.io/<repo>/ within a minute.'
} finally {
  Pop-Location
}
