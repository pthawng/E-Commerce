import { Injectable, Logger } from '@nestjs/common';

export interface RiskContext {
  ip: string;
  userAgent: string;
  fingerprint?: string;
}

@Injectable()
export class RiskScoreService {
  private readonly logger = new Logger(RiskScoreService.name);

  /**
   * Calculates a risk score between 0 and 1.
   * 0: Low Risk (Trusted)
   * 1: Critical Risk (Compromised)
   */
  async calculateRisk(current: RiskContext, baseline?: RiskContext): Promise<number> {
    if (!baseline) return 0; // First login or first token in chain

    let risk = 0;

    // 1. IP CIDR Consistency check (Weight: 0.4)
    if (current.ip !== baseline.ip) {
      if (!this.isSameSubnet(current.ip, baseline.ip)) {
        risk += 0.4;
      } else {
        risk += 0.1; // Minor shift within same subnet
      }
    }

    // 2. User-Agent Consistency (Weight: 0.3)
    if (current.userAgent !== baseline.userAgent) {
      risk += 0.3;
    }

    // 3. Browser Fingerprint Consistency (Weight: 0.6)
    // Most reliable signal. If this changes while UA is same, high risk.
    if (
      current.fingerprint &&
      baseline.fingerprint &&
      current.fingerprint !== baseline.fingerprint
    ) {
      risk += 0.6;
    }

    // Normalize
    const finalScore = Math.min(risk, 1);

    if (finalScore > 0.7) {
      this.logger.warn(`High risk activity detected from IP ${current.ip}. Score: ${finalScore}`);
    }

    return finalScore;
  }

  private isSameSubnet(ip1: string, ip2: string): boolean {
    const parts1 = ip1.split('.');
    const parts2 = ip2.split('.');
    if (parts1.length < 3 || parts2.length < 3) return false;
    return parts1[0] === parts2[0] && parts1[1] === parts2[1];
  }
}
