import { prisma } from "../lib/prisma";
import { signAuthToken } from "../lib/auth/tokens";

const origin = process.env.AUTH_TEST_ORIGIN ?? "http://localhost:3100";
const email = `auth-runtime-${Date.now()}@example.invalid`;

type Role = "ADMIN" | "TEACHER" | "STUDENT";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function cookieHeader(authToken?: string) {
  return authToken ? `auth_token=${authToken}` : "";
}

async function request(path: string, cookie = "", headers: HeadersInit = {}) {
  return fetch(`${origin}${path}`, {
    redirect: "manual",
    headers: { ...(cookie ? { cookie } : {}), ...headers },
  });
}

function location(response: Response) {
  return response.headers.get("location") ?? "";
}

async function createAuthToken(userId: string, role: Role) {
  return signAuthToken(userId, role);
}

async function main() {
  const user = await prisma.user.create({
    data: { email, name: "Auth runtime test", password: "not-used", role: "ADMIN" },
  });

  try {
    const authToken = await createAuthToken(user.id, "ADMIN");

    // Test 1: Valid auth token + /login should redirect to home
    let response = await request("/login", cookieHeader(authToken), {
      "sec-fetch-dest": "document",
    });
    assert(response.status === 303 && location(response).endsWith("/Admin"), "valid auth token must leave /login");

    // Test 2: Valid auth token + /register should redirect to home
    response = await request("/register", cookieHeader(authToken), {
      "sec-fetch-dest": "document",
    });
    assert(response.status === 303 && location(response).endsWith("/Admin"), "valid auth token must leave /register");

    // Test 3: Valid auth token + protected route should allow access
    response = await request("/Admin/dashboard", cookieHeader(authToken), {
      "sec-fetch-dest": "document",
    });
    assert(response.status === 200, "valid auth token must access protected routes");

    // Test 4: No auth token + protected route should redirect to login
    response = await request("/Admin/dashboard", "", { "sec-fetch-dest": "document" });
    assert(response.status === 303 && location(response).endsWith("/login"), "missing auth token must redirect to login");

    // Test 5: No auth token + /login should render login page
    response = await request("/login", "", { "sec-fetch-dest": "document" });
    assert(response.status === 200, "no auth token must render login");

    // Test 6: Malformed auth token + protected route should redirect to login
    const malformed = await request("/Admin/dashboard", cookieHeader("malformed"), { "sec-fetch-dest": "document" });
    assert(malformed.status === 303 && location(malformed).endsWith("/login"), "malformed auth token must redirect to login");

    // Test 7: Wrong role token should redirect to correct role home
    const studentToken = await signAuthToken(user.id, "STUDENT");
    response = await request("/Admin/dashboard", cookieHeader(studentToken), { "sec-fetch-dest": "document" });
    assert(response.status === 303 && location(response).endsWith("/Student"), "wrong role auth token must redirect to role home");

    // Test 8: RSC navigation with valid token should work
    response = await request("/Admin/dashboard", cookieHeader(authToken), { rsc: "1" });
    assert(response.status === 200, "valid auth token must access protected RSC navigation");

    // Test 9: RSC navigation without auth token should redirect to login
    response = await request("/Admin/dashboard", "", { rsc: "1" });
    assert(response.status === 303 && location(response).endsWith("/login"), "missing auth token must redirect RSC navigation to login");

    console.log("AUTH_RUNTIME_SMOKE: PASS");
  } finally {
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
  }
}

main().catch(async (error) => {
  console.error("AUTH_RUNTIME_SMOKE: FAIL", error instanceof Error ? error.message : "unknown error");
  await prisma.$disconnect();
  process.exitCode = 1;
});

