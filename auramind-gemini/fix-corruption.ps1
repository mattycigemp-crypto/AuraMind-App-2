$files = Get-ChildItem -Path "src" -Recurse -Include *.tsx,*.ts

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Fix import/export keywords
    $content = $content -replace 'imrort', 'import'
    $content = $content -replace 'exrort', 'export'
    
    # Fix type keyword
    $content = $content -replace 'import tyre', 'import type'
    
    # Fix FCP type annotations
    $content = $content -replace 'React\.FCP', 'React.FC<'
    $content = $content -replace 'SettingsPageProps>', 'SettingsPageProps>'
    
    # Fix className patterns - the w, t, f, p characters are replacing quotes
    # Pattern: className="w...w> should be className="..."
    $content = $content -replace 'className="w([^"]*)"w>', 'className="$1"'
    $content = $content -replace 'className="t([^"]*)"t>', 'className="$1"'
    $content = $content -replace 'className="f([^"]*)"f>', 'className="$1"'
    $content = $content -replace 'className="p([^"]*)"p>', 'className="$1"'
    
    # Fix specific patterns
    $content = $content -replace 'javascrirt', 'javascript'
    
    # Fix useStateP patterns
    $content = $content -replace 'useStateP', 'useState<'
    $content = $content -replace 'useRefP', 'useRef<'
    
    # Fix wlex -> flex (corrupted className)
    $content = $content -replace 'wlex', 'flex'
    
    # Fix ChangeEventP -> ChangeEvent<
    $content = $content -replace 'ChangeEventP', 'ChangeEvent<'
    
    # Fix interface property syntax (missing colon)
    $content = $content -replace '(\w+)  (\w+);', '$1: $2;'
    
    Set-Content $file.FullName $content
}

Write-Host "Fixed corruption in all files"