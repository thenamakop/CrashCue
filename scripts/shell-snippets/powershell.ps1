# CrashCue PowerShell Integration
$Global:CrashCue_LastExitCode = 0

function Global:CrashCue-CheckExitCode {
    $currentExitCode = $LASTEXITCODE
    
    # Check if the last command failed (non-zero exit code)
    if ($currentExitCode -ne 0 -and $currentExitCode -ne $Global:CrashCue_LastExitCode) {
        # Check if crashcue is available
        if (Get-Command crashcue -ErrorAction SilentlyContinue) {
            # Run crashcue notify with the current exit code context if needed, 
            # or just trigger it. The notifier itself doesn't need the code, 
            # it just plays the sound.
            # We run it in background or detached if possible, but for now simple execution.
            # Use Start-Process to avoid blocking? Or just direct call.
            # Direct call is simpler.
            crashcue run --command "previous_command_failed" --exitCode $currentExitCode
        }
    }
    $Global:CrashCue_LastExitCode = $currentExitCode
}

# Hook into the prompt function
# Save original prompt
if (Test-Path function:prompt) {
    $Global:CrashCue_OriginalPrompt = Get-Content function:prompt
} else {
    $Global:CrashCue_OriginalPrompt = "{ 'PS ' + $(Get-Location) + '> ' }"
}

# Define new prompt
function prompt {
    # Check exit code first
    CrashCue-CheckExitCode
    
    # Invoke original prompt logic
    # This is a bit tricky in PS. Simplest way is to just run the original block.
    Invoke-Expression $Global:CrashCue_OriginalPrompt
}
