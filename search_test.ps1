Get-ChildItem -Path "." -Recurse | 
    Where-Object { $_.Extension -eq ".kt" -or $_.Extension -eq ".xml" } | 
    Select-Object -ExpandProperty FullName
