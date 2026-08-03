import { auth } from '../lib/auth';
import { UserModel } from '../shared/models/user';
import { parseSetCookieHeader } from 'better-auth/cookies';

export interface ChangeAdminPasswordInput {
  oldPassword: string;
  newPassword: string;
}

export interface ChangeAdminPasswordResult {
  success: boolean;
  error?: string;
}

export async function changeAdminPassword(
  input: ChangeAdminPasswordInput
): Promise<ChangeAdminPasswordResult> {
  try {
    if (!process.env.BETTER_AUTH_SECRET) {
      return { success: false, error: 'BETTER_AUTH_SECRET is missing' };
    }

    // 1. Find admin user
    const adminUser = await UserModel.findFirstByRole('admin');

    if (!adminUser) {
      return { success: false, error: 'USER_NOT_FOUND' };
    }

    // 2. Verify old password by signing in (asResponse to get set-cookie headers)
    const signInResponse = await auth.api.signInEmail({
      headers: new Headers(),
      body: { email: adminUser.email, password: input.oldPassword },
      asResponse: true,
    });

    if (!signInResponse.ok) {
      return { success: false, error: 'INVALID_PASSWORD' };
    }

    // 3. Extract signed session cookie from response
    const setCookieHeader = signInResponse.headers.get('set-cookie') || '';
    const cookies = parseSetCookieHeader(setCookieHeader);
    const signedToken =
      cookies.get('better-auth.session_token')?.value ||
      cookies.get('__Secure-better-auth.session_token')?.value;

    if (!signedToken) {
      return { success: false, error: 'Failed to establish admin session' };
    }

    // 4. Set new password via admin plugin (setUserPassword)
    const sessionHeaders = new Headers();
    sessionHeaders.set('cookie', `better-auth.session_token=${signedToken}`);

    await auth.api.setUserPassword({
      headers: sessionHeaders,
      body: { newPassword: input.newPassword, userId: adminUser.id },
    });

    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  const [oldPassword, newPassword] = process.argv.slice(2);
  if (!oldPassword || !newPassword) {
    console.error('Usage: bun run scripts/change-admin-password.ts <oldPassword> <newPassword>');
    process.exit(1);
  }

  const result = await changeAdminPassword({ oldPassword, newPassword });

  if (result.success) {
    console.log('SUCCESS');
  } else {
    console.error(`ERROR: ${result.error}`);
    process.exit(1);
  }
}

if (require.main === module) main();
