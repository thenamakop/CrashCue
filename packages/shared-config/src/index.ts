import path from 'path';
import fs from 'fs';
import os from 'os';
import { DEFAULT_SOUND_PATH, resolveSoundPath } from '@crashcue/shared-assets';

export interface CrashCueConfig {
    sound?: string;
    muted?: boolean;
}

export class ConfigLoader {
    private static getGlobalConfigPath(): string {
        const userProfile = process.env.USERPROFILE || os.homedir();
        return path.join(userProfile, '.config', 'crashcue', 'config.json');
    }

    private static getWorkspaceConfigPath(): string {
        return path.join(process.cwd(), '.crashcue.json');
    }

    public static loadConfig(): CrashCueConfig {
        let config: CrashCueConfig = {};

        // Load Global Config
        const globalPath = this.getGlobalConfigPath();
        if (fs.existsSync(globalPath)) {
            try {
                const globalConfig = JSON.parse(fs.readFileSync(globalPath, 'utf8'));
                config = { ...config, ...globalConfig };
            } catch (e) {
                // Ignore parsing errors
            }
        }

        // Load Workspace Config (Precedence)
        const workspacePath = this.getWorkspaceConfigPath();
        if (fs.existsSync(workspacePath)) {
            try {
                const workspaceConfig = JSON.parse(fs.readFileSync(workspacePath, 'utf8'));
                config = { ...config, ...workspaceConfig };
            } catch (e) {
                // Ignore parsing errors
            }
        }

        return config;
    }

    public static resolveSound(configSound?: string): string {
        if (configSound === 'default') {
            return DEFAULT_SOUND_PATH;
        }
        
        // Use resolveSoundPath from shared-assets which handles validation and fallback
        return resolveSoundPath(configSound);
    }
}
