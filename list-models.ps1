<#
.SYNOPSIS
    Lists all available models for the configured Google Gemini API key.

.DESCRIPTION
    Runs list-models.mjs using node, retrieving the API key from 
    backend/appsettings.Development.json or backend/appsettings.json.
#>

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$JsScript = Join-Path $ScriptDir "list-models.mjs"

node $JsScript @args
