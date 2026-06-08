$files = @(
  "src/pages/generator/GeneratorPage.tsx",
  "src/pages/admin/DatabaseExplorer.tsx",
  "src/pages/admin/AuditLog.tsx",
  "src/pages/admin/AdminUsers.tsx",
  "src/pages/admin/AdminSubscriptions.tsx",
  "src/pages/admin/AdminOverview.tsx",
  "src/pages/admin/AdminAnalytics.tsx",
  "src/components/auth/PaymentPage.tsx"
)
$search = "fetch('/api/"
$replace = "fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/"
foreach ($f in $files) {
  $c = Get-Content $f -Raw
  if ($c.Contains($search)) {
    $c = $c.Replace($search, $replace)
    Set-Content $f -Value $c -NoNewline
    Write-Host "Fixed: $f"
  }
}
