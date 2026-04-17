import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * L8 Feature Gating Service.
 * Enables controlled releases and traffic splitting without redeployment.
 */
@Injectable()
export class FeatureFlagService {
    private readonly logger = new Logger(FeatureFlagService.name);
    private readonly flags = new Map<string, boolean>();

    constructor(private configService: ConfigService) {
        this.initializeFlags();
    }

    private initializeFlags() {
        // In a real L8 system, this would fetch from Redis or a Flag provider (LaunchDarkly/Flagsmith)
        // For now, we seed from Environment Variables to establish the contract.
        const rawFlags = this.configService.get<string>('FEATURE_FLAGS') || '';
        rawFlags.split(',').forEach(flag => {
            const [key, value] = flag.split(':');
            if (key) this.flags.set(key.trim(), value?.trim() === 'true');
        });
    }

    isEnabled(flagName: string): boolean {
        // Default to false if not found (fail-safe)
        return this.flags.get(flagName) || false;
    }

    /**
     * Staff+ Tip: Implement "Sticky" Canary or percentage-based rollouts here.
     */
    isUserEnabled(flagName: string, userId: string): boolean {
        if (!this.isEnabled(flagName)) return false;

        // Simple hash-based percentage rollout (Deterministic per user)
        // Example: allow flag if hash(userId) % 100 < 10 (10% rollout)
        return true; // Simplified for now
    }
}
