import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { enrichUserProfile, canAccessRoute, registerUserAccount, registerVesselAccount, syncUserRoleToFirestore } from './auth';
import { syncUserToFirestore, deleteUserFromFirestore } from './firebase';
import { ROUTE_ACCESS_MATRIX, AppRoute } from './rbac';
import { UserProfile, UserRole } from '../types';

describe('enrichUserProfile', () => {
  it('populates default fields for a minimal profile', () => {
    const minimal: Partial<UserProfile> = {
      email: 'sailor@solentmarina.co.uk',
      role: 'client'
    };

    const enriched = enrichUserProfile(minimal);

    assert.ok(enriched.id, 'Expected an auto-generated id');
    assert.match(enriched.id, /^usr-/, 'Expected id to begin with usr- prefix');
    assert.equal(enriched.name, 'sailor', 'Expected name to fall back to email username');
    assert.equal(enriched.email, 'sailor@solentmarina.co.uk');
    assert.equal(enriched.role, 'client');
    assert.equal(enriched.systemVoltage, '12V', 'Expected default 12V system voltage');
    assert.equal(enriched.vesselType, 'Sailing Yacht', 'Expected default vesselType');
    assert.deepEqual(enriched.vesselIds, []);
    assert.ok(enriched.environment, 'Expected environment code to be assigned');
  });

  it('preserves existing custom user attributes without overwriting', () => {
    const customProfile: UserProfile = {
      id: 'usr-custom-777',
      name: 'Captain Jack Aubrey',
      email: 'jack.aubrey@hms-surprise.co.uk',
      phone: '07700 900888',
      role: 'client',
      vesselName: 'HMS Surprise',
      vesselType: 'Frigate / Cruiser',
      marinaBerth: 'Portsmouth Historic Dockyard Berth 3',
      avatarUrl: 'https://images.example.com/avatars/jack.jpg',
      systemVoltage: '24V',
      vesselIds: ['vsl-surprise-01', 'vsl-tender-02']
    };

    const enriched = enrichUserProfile(customProfile);

    assert.equal(enriched.id, 'usr-custom-777');
    assert.equal(enriched.name, 'Captain Jack Aubrey');
    assert.equal(enriched.email, 'jack.aubrey@hms-surprise.co.uk');
    assert.equal(enriched.phone, '07700 900888');
    assert.equal(enriched.vesselName, 'HMS Surprise');
    assert.equal(enriched.vesselType, 'Frigate / Cruiser');
    assert.equal(enriched.marinaBerth, 'Portsmouth Historic Dockyard Berth 3');
    assert.equal(enriched.avatarUrl, 'https://images.example.com/avatars/jack.jpg');
    assert.equal(enriched.systemVoltage, '24V');
    assert.deepEqual(enriched.vesselIds, ['vsl-surprise-01', 'vsl-tender-02']);
  });

  it('correctly enriches Anthony Wrather admin email with workshop default credentials', () => {
    const anthonyProfiles: Partial<UserProfile>[] = [
      { email: 'anthonywrather@gmail.com', role: 'admin' },
      { email: 'ANTHONYWRATHER@GMAIL.COM', role: 'admin' },
      { email: 'admin@ajwmes.co.uk', role: 'admin' }
    ];

    for (const raw of anthonyProfiles) {
      const enriched = enrichUserProfile(raw);
      assert.equal(enriched.name, 'Anthony Wrather');
      assert.equal(enriched.phone, '07700 900551');
      assert.equal(enriched.vesselName, 'AJW Solent Response');
      assert.equal(enriched.vesselType, 'Workboat / Fast Tender');
      assert.equal(enriched.marinaBerth, 'Gosport Marina (HQ Workshop)');
    }
  });

  it('maps photoURL to avatarUrl when avatarUrl is missing', () => {
    const profileWithPhoto: Partial<UserProfile> = {
      email: 'photouser@example.com',
      role: 'guest',
      photoURL: 'https://lh3.googleusercontent.com/a/photo.png'
    };

    const enriched = enrichUserProfile(profileWithPhoto);
    assert.equal(enriched.avatarUrl, 'https://lh3.googleusercontent.com/a/photo.png');
  });

  it('preserves system supplied preset avatar relative paths', () => {
    const profileWithPreset: Partial<UserProfile> = {
      email: 'sailor.preset@solent.co.uk',
      role: 'client',
      avatarUrl: '/assets/images/marine_helm_navigation_1791400844235.jpg'
    };

    const enriched = enrichUserProfile(profileWithPreset);
    assert.equal(enriched.avatarUrl, '/assets/images/marine_helm_navigation_1791400844235.jpg');
  });

  it('preserves user uploaded base64 photo data URLs', () => {
    const mockDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...';
    const profileWithCustomPhoto: Partial<UserProfile> = {
      email: 'boatowner@solent.co.uk',
      role: 'client',
      avatarUrl: mockDataUrl
    };

    const enriched = enrichUserProfile(profileWithCustomPhoto);
    assert.equal(enriched.avatarUrl, mockDataUrl);
  });

  it('resolves demo fallback data for known team seed profiles', () => {
    const techUser: Partial<UserProfile> = {
      email: 'jack.tech@ajwmes.co.uk',
      role: 'technician'
    };

    const enriched = enrichUserProfile(techUser);
    assert.equal(enriched.name, 'Jack Henderson');
    assert.equal(enriched.phone, '07700 900882');
    assert.equal(enriched.vesselName, 'Solent Diagnostic Van 1');

    const postalUser: Partial<UserProfile> = {
      email: 'sarah.postal@ajwmes.co.uk',
      role: 'postal'
    };
    const enrichedPostal = enrichUserProfile(postalUser);
    assert.equal(enrichedPostal.name, 'Sarah Miller');
    assert.equal(enrichedPostal.phone, '07700 900663');
  });
});

describe('canAccessRoute', () => {
  const ALL_ROLES: UserRole[] = ['guest', 'client', 'technician', 'postal', 'admin', 'site'];
  const ALL_ROUTES: AppRoute[] = [
    'home',
    'store',
    'tracker',
    'designer',
    'replica',
    'portal',
    'technician',
    'postal',
    'admin'
  ];

  describe('Admin Role (Full System Access)', () => {
    it('grants admin access to all application routes without exception', () => {
      for (const route of ALL_ROUTES) {
        assert.equal(
          canAccessRoute('admin', route),
          true,
          `Expected admin to have access to "${route}"`
        );
      }
    });
  });

  describe('Guest Role (Public Services Only)', () => {
    const allowedForGuest: AppRoute[] = ['home', 'store', 'tracker', 'designer', 'replica'];
    const forbiddenForGuest: AppRoute[] = ['portal', 'technician', 'postal', 'admin'];

    it('allows guest to access store, design visualizers, and public tracking', () => {
      for (const route of allowedForGuest) {
        assert.equal(
          canAccessRoute('guest', route),
          true,
          `Expected guest to have access to "${route}"`
        );
      }
    });

    it('strictly denies guest access to private vessel portal and workshop operations', () => {
      for (const route of forbiddenForGuest) {
        assert.equal(
          canAccessRoute('guest', route),
          false,
          `Expected guest to be denied access to "${route}"`
        );
      }
    });
  });

  describe('Client Role (Boat Owner)', () => {
    const allowedForClient: AppRoute[] = ['home', 'store', 'tracker', 'designer', 'replica', 'portal'];
    const forbiddenForClient: AppRoute[] = ['technician', 'postal', 'admin'];

    it('allows client to access vessel portal and public services', () => {
      for (const route of allowedForClient) {
        assert.equal(
          canAccessRoute('client', route),
          true,
          `Expected client to have access to "${route}"`
        );
      }
    });

    it('denies client access to technician workstation, postal fulfillment, and master admin', () => {
      for (const route of forbiddenForClient) {
        assert.equal(
          canAccessRoute('client', route),
          false,
          `Expected client to be denied access to "${route}"`
        );
      }
    });
  });

  describe('Technician Role (Field Diagnostics)', () => {
    const allowedForTechnician: AppRoute[] = ['home', 'store', 'tracker', 'technician'];
    const forbiddenForTechnician: AppRoute[] = ['designer', 'replica', 'portal', 'postal', 'admin'];

    it('allows technician to access field diagnostic workstation and public rates', () => {
      for (const route of allowedForTechnician) {
        assert.equal(
          canAccessRoute('technician', route),
          true,
          `Expected technician to have access to "${route}"`
        );
      }
    });

    it('denies technician access to panel designer, client portal, postal dispatch, and admin', () => {
      for (const route of forbiddenForTechnician) {
        assert.equal(
          canAccessRoute('technician', route),
          false,
          `Expected technician to be denied access to "${route}"`
        );
      }
    });
  });

  describe('Postal Role (Workshop Fulfillment)', () => {
    const allowedForPostal: AppRoute[] = ['home', 'store', 'tracker', 'postal'];
    const forbiddenForPostal: AppRoute[] = ['designer', 'replica', 'portal', 'technician', 'admin'];

    it('allows postal role to access postal dispatch station and store', () => {
      for (const route of allowedForPostal) {
        assert.equal(
          canAccessRoute('postal', route),
          true,
          `Expected postal role to have access to "${route}"`
        );
      }
    });

    it('denies postal role access to diagnostic tools, client portal, panel designer, and admin', () => {
      for (const route of forbiddenForPostal) {
        assert.equal(
          canAccessRoute('postal', route),
          false,
          `Expected postal role to be denied access to "${route}"`
        );
      }
    });
  });

  describe('Site Administrator Role (Platform Infrastructure & Storefront)', () => {
    const allowedForSite: AppRoute[] = ['home', 'store', 'tracker', 'designer', 'replica'];
    const forbiddenForSite: AppRoute[] = ['portal', 'technician', 'postal', 'admin'];

    it('allows site admin to access public storefront and custom panel visualizers', () => {
      for (const route of allowedForSite) {
        assert.equal(
          canAccessRoute('site', route),
          true,
          `Expected site role to have access to "${route}"`
        );
      }
    });

    it('denies site admin access to private client portal, technician jobs, postal fulfillment, and workshop admin', () => {
      for (const route of forbiddenForSite) {
        assert.equal(
          canAccessRoute('site', route),
          false,
          `Expected site role to be denied access to "${route}"`
        );
      }
    });
  });

  describe('Edge cases and Matrix Conformance', () => {
    it('returns false for unrecognized routes', () => {
      for (const role of ALL_ROLES) {
        assert.equal(
          canAccessRoute(role, 'unknown_route' as AppRoute),
          false,
          `Expected unknown_route to return false for role ${role}`
        );
        assert.equal(
          canAccessRoute(role, '' as AppRoute),
          false,
          `Expected empty route to return false for role ${role}`
        );
      }
    });

    it('matches ROUTE_ACCESS_MATRIX permissions exactly for every role and route combination', () => {
      for (const route of ALL_ROUTES) {
        const matrixRule = ROUTE_ACCESS_MATRIX[route];
        assert.ok(matrixRule, `Expected ROUTE_ACCESS_MATRIX rule to exist for ${route}`);

        for (const role of ALL_ROLES) {
          const expected = matrixRule.allowedRoles.includes(role);
          const actual = canAccessRoute(role, route);
          assert.equal(
            actual,
            expected,
            `Matrix mismatch for route "${route}" and role "${role}": expected ${expected}, got ${actual}`
          );
        }
      }
    });
  });
});

describe('registerUserAccount', () => {
  it('creates a client profile without requiring vessel details', async () => {
    const uniqueEmail = `test.client.${Date.now()}.${Math.random().toString(36).substring(2, 7)}@solent-test.co.uk`;
    const profile = await registerUserAccount({
      name: 'Oliver Queen',
      email: uniqueEmail,
      password: 'password123',
      phone: '07700 900333'
    });

    assert.ok(profile.id, 'Expected an auto-generated id');
    assert.equal(profile.name, 'Oliver Queen');
    assert.equal(profile.email, uniqueEmail);
    assert.equal(profile.phone, '07700 900333');
    assert.equal(profile.role, 'client');
    assert.equal(profile.vesselName, '', 'Expected vesselName to default to empty string');
    assert.equal(profile.vesselType, '', 'Expected vesselType to default to empty string');
    assert.equal(profile.marinaBerth, '', 'Expected marinaBerth to default to empty string');
    assert.deepEqual(profile.vesselIds, []);
  });

  it('rejects registration with empty or blank email', async () => {
    await assert.rejects(
      async () => {
        await registerUserAccount({
          name: 'Anonymous Sailor',
          email: '   '
        });
      },
      {
        message: 'Please enter a valid email address.'
      }
    );
  });

  it('rejects duplicate registration when email already exists', async () => {
    const existingEmail = `dup.${Date.now()}.${Math.random().toString(36).substring(2, 7)}@solent-test.co.uk`;
    await registerUserAccount({
      name: 'First User',
      email: existingEmail
    });

    await assert.rejects(
      async () => {
        await registerUserAccount({
          name: 'Second User',
          email: existingEmail
        });
      },
      {
        message: 'An account with this email address already exists. Please sign in with your password.'
      }
    );
  });

  it('registerVesselAccount backward-compatible alias functions identically', async () => {
    const uniqueEmail = `alias.${Date.now()}.${Math.random().toString(36).substring(2, 7)}@solent-test.co.uk`;
    const aliasedProfile = await registerVesselAccount({
      name: 'Arthur Dent',
      email: uniqueEmail,
      phone: '07700 900444'
    });

    assert.equal(aliasedProfile.name, 'Arthur Dent');
    assert.equal(aliasedProfile.email, uniqueEmail);
    assert.equal(aliasedProfile.role, 'client');
  });
});

describe('User Accounts Firestore Synchronization Handlers (Issue #57)', () => {
  it('syncUserToFirestore rejects on network timeout so callers can catch and display errors', async () => {
    const testUser: UserProfile = {
      id: 'usr-test-async-01',
      name: 'Async Test User',
      email: 'async.test@ajwmes.co.uk',
      role: 'client'
    };
    await assert.rejects(
      async () => {
        await syncUserToFirestore(testUser);
      },
      /syncUserToFirestore timeout/
    );
  });

  it('syncUserRoleToFirestore rejects on network timeout so callers can catch and display errors', async () => {
    await assert.rejects(
      async () => {
        await syncUserRoleToFirestore('usr-test-async-01', 'technician');
      },
      /syncUserRoleToFirestore timeout/
    );
  });

  it('deleteUserFromFirestore rejects on network timeout so callers can catch and display errors', async () => {
    await assert.rejects(
      async () => {
        await deleteUserFromFirestore('usr-test-async-01');
      },
      /deleteUserFromFirestore timeout/
    );
  });
});

// Ensure process exits promptly once all tests complete despite background Firebase SDK timers
after(() => {
  setTimeout(() => {
    process.exit(process.exitCode ?? 0);
  }, 50);
});
