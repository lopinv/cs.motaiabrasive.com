$patterns = @(
  'Professional Abrasive',
  'partner behind',
  'next shipment',
  'next finish',
  'next order',
  'wholesale and OEM',
  'Wholesale and OEM',
  'confirmed in the quotation',
  'Wholesale enquiries',
  'wholesale enquiries',
  'Wholesale quotation',
  'wholesale quotation',
  'MoTai Abrasives.',
  'Abrasives. People.'
)
$file = 'D:\Code\shopify\motai-static\src\i18n\en.json'
$lines = Get-Content $file
for ($i = 0; $i -lt $lines.Count; $i++) {
  foreach ($p in $patterns) {
    if ($lines[$i] -like ("*" + $p + "*")) {
      Write-Output ("L" + ($i + 1) + " [" + $p + "] " + $lines[$i].Trim())
      break
    }
  }
}
