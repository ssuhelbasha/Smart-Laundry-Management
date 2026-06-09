$dollar = [char]36
Get-ChildItem -Path "C:\Users\Lenovo\.gemini\antigravity\scratch\SmartLaundryManagement" -Recurse -Include *.kt,*.xml | 
    Select-String -Pattern $dollar -SimpleMatch | 
    Select-Object Path, LineNumber, Line | 
    Format-Table -AutoSize
