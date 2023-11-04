$fileContents = Get-Content .\countryData.json
$json = $fileContents | ConvertFrom-Json
$sorted = $json | ForEach-Object {
	$_ | Add-Member -Force -Type NoteProperty -Name myUniqueId -Value ([guid]::NewGuid())
	$_
} | Sort-Object { $_.name.official }
$sorted.Length
250
$sorted | ConvertTo-Json | Set-Content .\countryData2.json
WARNING: Resulting JSON is truncated as serialization has exceeded the set depth of 2.
$sorted | ConvertTo-Json -Depth 20 | Set-Content .\countryData2.json
 