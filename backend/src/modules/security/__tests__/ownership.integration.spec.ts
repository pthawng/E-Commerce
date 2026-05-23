import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IOwnable } from 'src/common/interfaces/ownable.interface';
import { Principal, PrincipalType } from 'src/common/types/principal.types';
import { OwnershipRegistry } from '../ownership.registry';
import { SecurityEventBus, SecurityEventType } from '../security-event-bus.service';

describe('OwnershipRegistry Integration', () => {
  let registry: OwnershipRegistry;
  let eventBus: SecurityEventBus;
  let jwtService: JwtService;

  const mockJwtService = {
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OwnershipRegistry,
        SecurityEventBus,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    registry = module.get<OwnershipRegistry>(OwnershipRegistry);
    eventBus = module.get<SecurityEventBus>(SecurityEventBus);
  });

  const userA: Principal = { id: 'user-a', type: PrincipalType.USER };
  const userB: Principal = { id: 'user-b', type: PrincipalType.USER };

  class MockResource implements IOwnable {
    constructor(private owners: Principal[]) {}
    getOwners(): Principal[] {
      return this.owners;
    }
  }

  it('should allow access when the principal is the owner', () => {
    const resource = new MockResource([userA]);
    expect(() => registry.verify(userA, resource)).not.toThrow();
  });

  it('should allow access when the principal is one of multiple owners', () => {
    const resource = new MockResource([userB, userA]);
    expect(() => registry.verify(userA, resource)).not.toThrow();
  });

  it('should reject access and fire a security event when the principal is NOT the owner (IDOR)', async () => {
    const resource = new MockResource([userB]);
    const emitSpy = jest.spyOn(eventBus, 'emit');

    expect(() => registry.verify(userA, resource, 'TestContext')).toThrow(ForbiddenException);

    expect(emitSpy).toHaveBeenCalledWith(
      SecurityEventType.OWNERSHIP_VIOLATION,
      userA,
      expect.objectContaining({ context: 'TestContext', owners: [userB] }),
    );
  });

  describe('createPrincipal', () => {
    it('should create a USER principal from user data', () => {
      const user = { id: 'u1', roles: ['ADMIN'] };
      const principal = registry.createPrincipal(user);
      expect(principal).toEqual({
        id: 'u1',
        type: PrincipalType.USER,
        roles: ['ADMIN'],
      });
    });

    it('should create a GUEST principal from sessionId', () => {
      const principal = registry.createPrincipal(null, 'session-123');
      expect(principal).toEqual({
        id: 'session-123',
        type: PrincipalType.GUEST,
      });
    });

    it('should create an anonymous GUEST principal if no info provided', () => {
      const principal = registry.createPrincipal();
      expect(principal).toEqual({
        id: 'anonymous',
        type: PrincipalType.GUEST,
      });
    });
  });
});
