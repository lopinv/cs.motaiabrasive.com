$ErrorActionPreference = 'Stop'
Set-Location D:\Code\shopify\motai-static

function Resolve($path) {
  $p = Join-Path .\dist $path
  if (Test-Path $p -PathType Leaf) { return $p }
  $i = Join-Path $p 'index.html'
  if (Test-Path $i -PathType Leaf) { return $i }
  return $null
}

$prod = Resolve 'en\products\533x75-abrasive-belt'
$p = Get-Content $prod -Raw
'=== EN PRODUCT PAGE ==='
'@types: ' + (([regex]::Matches($p,'"@type":\s*"\w+"') | ForEach-Object { $_.Value } | Sort-Object -Unique) -join '; ')
'hreflang count: ' + ([regex]::Matches($p,'hreflang="').Count)
'jsonld blocks: ' + ([regex]::Matches($p,'application/ld\+json').Count)
'og tags: ' + ([regex]::Matches($p,'property="og:').Count)
'twitter tags: ' + ([regex]::Matches($p,'name="twitter:').Count)
'remote cdn imgs: ' + ([regex]::Matches($p,'motaiabrasive\.com/cdn/shop').Count)
'B2B offer ld: ' + [bool]($p -match '"@type":\s*"Offer"')
'PreSale ld: ' + [bool]($p -match 'PreSale')
'no real price in ld: ' + (-not ($p -match '"price"'))
$canon = [regex]::Match($p, '<link rel="canonical" href="([^"]+)"').Groups[1].Value
'canonical (slash-terminated): ' + $canon
'canonical ends /: ' + [bool]$canon.EndsWith('/')
$offerUrl = [regex]::Match($p, '"@type":"Offer","url":"([^"]+)"').Groups[1].Value
'offer url: ' + $offerUrl
'offer url ends /: ' + [bool]$offerUrl.EndsWith('/')

$col = Resolve 'en\collections\all'
'collection ItemList ld: ' + [bool]((Get-Content $col -Raw) -match '"ItemList"')

$ar = Get-Content (Resolve 'ar') -Raw
'=== AR HOME ==='
'dir=rtl: ' + [bool]($ar -match 'dir="rtl"')
'html lang=ar: ' + [bool]($ar -match '<html lang="ar"')

$zh = Get-Content (Resolve 'zh') -Raw
'=== ZH HOME ==='
'html lang: ' + ([regex]::Match($zh,'<html lang="([^"]*)"').Groups[1].Value)

$root = Get-Content .\dist\index.html -Raw
'=== ROOT (/) ==='
if ($root -match '<title>([^<]+)</title>') { 'title: ' + $Matches[1] }
'root has hreflang en: ' + ([bool]($root -match 'hreflang="en"'))

$gloss = Get-Content (Resolve 'en\glossary') -Raw
'=== EN GLOSSARY ==='
'ItemList ld: ' + [bool]($gloss -match '"ItemList"')
'dt terms: ' + ([regex]::Matches($gloss,'<dt>').Count)

$qu = Get-Content (Resolve 'en\quote') -Raw
'=== EN QUOTE ==='
'quote form link: ' + [bool]($qu -match 'request-a-quote')
'wa link: ' + [bool]($qu -match 'wa\.me/8618118635597')

$fa = Get-Content (Resolve 'en\factory') -Raw
'=== EN FACTORY ==='
'youtube-nocookie refs: ' + ([regex]::Matches($fa,'youtube-nocookie\.com').Count)

$f = Get-Content .\dist\_redirects -Raw
'=== _redirects ==='
'lines: ' + ($f -split "`n").Count
$rules = $f -split "`n" | Where-Object { $_ -match '^\S' -and $_ -notmatch '^#' }
'301 rules: ' + ($rules | Measure-Object).Count
$bad = @($rules | Where-Object { ($_ -split '\s+')[2] -eq '301' -and -not ($_ -split '\s+')[1].EndsWith('/') })
'301 targets slash-terminated: ' + ($bad.Count -eq 0)
if ($bad.Count) { '  offending: ' + ($bad[0]) }

$csvPath = Join-Path $PSScriptRoot '..\dist\products.csv'
$raw = [IO.File]::ReadAllText($csvPath)
'=== FEED products.csv ==='
'items: ' + (($raw -split [char]10 | Where-Object { $_.Trim() } | Measure-Object).Count - 1)
'bom: ' + [bool]($raw.StartsWith([char]0xFEFF))
'preorder: ' + ([regex]::Matches($raw,'preorder').Count)

$sm = Get-Content .\dist\sitemap.xml -Raw
'=== SITEMAP ==='
'urls: ' + ([regex]::Matches($sm,'<loc>').Count)
'first url: ' + ([regex]::Match($sm,'<loc>([^<]+)</loc>').Groups[1].Value)
# GSC rejects the Google image-sitemap extension ("Failed to parse QName
# 'image:'"), so the sitemap must stay a plain sitemaps.org urlset.
'no image ns: ' + [bool](-not ($sm -match 'xmlns:image'))
'standard ns: ' + [bool]($sm -match 'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')

$rb = Get-Content .\dist\robots.txt -Raw
'=== ROBOTS ==='
'sitemap ref: ' + [bool]($rb -match 'Sitemap: https?://[^\r\n]+/sitemap\.xml')
'user-agent *: ' + [bool]($rb -match 'User-agent: \*')
