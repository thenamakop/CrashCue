
# CrashCue PowerShell Integration
# This script registers an idle event handler to check for non-zero exit codes.
# It plays a sound using the CrashCue notifier when a command fails.

$CrashCueNotifier = "{{NOTIFIER_PATH}}"

if (Test-Path $CrashCueNotifier) {
    # Initialize state tracking
    if (-not (Get-Variable -Name "CrashCueLastExit" -Scope Global -ErrorAction SilentlyContinue)) {
        $global:CrashCueLastExit = 0
    }

    # Remove existing subscriber to avoid duplicates on profile reload
    Unregister-Event -SourceIdentifier CrashCueOnIdle -ErrorAction SilentlyContinue

    # Register the idle event
    # We use -SupportEvent to hide it from standard Get-EventSubscriber (optional but cleaner)
    # But for visibility/debugging, maybe standard is better.
    # The prompt didn't specify, but "Must be reversible" suggests we should be able to remove it.
    # We'll use a SourceIdentifier so we can target it.
    Register-EngineEvent PowerShell.OnIdle -SourceIdentifier CrashCueOnIdle -Action {
        # Check if the last command failed and we haven't handled it yet
        if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $global:CrashCueLastExit) {
            try {
                # Invoke the notifier CLI directly with node
                # We pipe to Out-Null to suppress output and prevent it from interfering with the shell
                node $Event.MessageData | Out-Null
            } catch {
                # Silently fail if notifier crashes to not break the shell
            }
        }

        # Update tracking variable
        $global:CrashCueLastExit = $LASTEXITCODE
    } -MessageData $CrashCueNotifier | Out-Null
}
