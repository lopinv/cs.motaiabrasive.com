$dir = 'D:\Code\shopify\motai-static\src\i18n'
foreach ($f in (Get-ChildItem $dir -Filter '*.json')) {
  $c = Get-Content $f.FullName -Raw -Encoding UTF8
  $hits = @()
  if ($c -match '"(home)":\s*\{') { $hits += 'home' }
  $m = [regex]::Matches($c, '"(\w+(?:Page|Faq|faq)\w*)":\s*\{')
  $keys = $m | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
  Write-Output ($f.Name + ' :: ' + ($keys -join ', '))
}
