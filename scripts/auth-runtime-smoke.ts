import { prisma } from "../lib/prisma";
import { hashRefreshToken } from "../lib/auth/token-hash";
import { signAccessToken, signRefreshToken } from "../lib/auth/tokens";

const origin = process.env.AUTH_TEST_ORIGIN ?? "http://localhost:3100";
const email = `auth-runtime-${Date.now()}@example.invalid`;
const sevenDays = 7 * 24 * 60 * 60 * 1000;

type Role = "ADMIN" | "TEACHER" | "STUDENT";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function cookieHeader(access?: string, refresh?: string) {
  return [
    access && `access_token=${access}`,
    refresh && `refresh_token=${refresh}`,
  ].filter(Boolean).join("; ");
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

async function createSession(userId: string, role: Role) {
  const access = await signAccessToken(userId, role);
  const refresh = await signRefreshToken(userId, role);
  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashRefreshToken(refresh),
      expiresAt: new Date(Date.now() + sevenDays),
    },
  });
  return { access, refresh };
}

async function refresh(refreshToken: string, redirectTo: string) {
  return request(
    `/api/auth/refresh?redirectTo=${encodeURIComponent(redirectTo)}`,
    cookieHeader(undefined, refreshToken)
  );
}

async function main() {
  const user = await prisma.user.create({
    data: { email, name: "Auth runtime test", password: "not-used", role: "ADMIN" },
  });

  try {
    const primary = await createSession(user.id, "ADMIN");

    let response = await request("/login", cookieHeader(primary.access, primary.refresh), {
      "sec-fetch-dest": "document",
    });
    assert(response.status === 303 && location(response).endsWith("/Admin"), "valid access must leave /login");

    response = await request("/register", cookieHeader(primary.access, primary.refresh), {
      "sec-fetch-dest": "document",
    });
    assert(response.status === 303 && location(response).endsWith("/Admin"), "valid access must leave /register");

    for (const authRoute of ["/login", "/register"]) {
      const authRouteSession = await createSession(user.id, "ADMIN");
      response = await request(authRoute, cookieHeader(undefined, authRouteSession.refresh), {
        "sec-fetch-dest": "document",
      });
      assert(response.status === 303 && location(response).includes("/api/auth/refresh"), `${authRoute} must refresh a valid session`);

      const refreshResponse = await request(location(response), cookieHeader(undefined, authRouteSession.refresh));
      assert(refreshResponse.status === 303 && location(refreshResponse).endsWith("/Admin"), `${authRoute} refresh must reach role home`);
      assert(refreshResponse.headers.getSetCookie().length === 2, `${authRoute} refresh must rotate both cookies`);
    }

    const protectedResponse = await request("/Admin/dashboard", cookieHeader(undefined, primary.refresh), {
      "sec-fetch-dest": "document",
    });
    assert(protectedResponse.status === 303 && location(protectedResponse).includes("/api/auth/refresh"), "missing access must refresh protected document navigation");

    const rscResponse = await request("/Admin/dashboard", cookieHeader(undefined, primary.refresh), { rsc: "1" });
    assert(
      rscResponse.status === 303 && location(rscResponse).includes("/api/auth/refresh"),
      `missing access must refresh protected RSC navigation (got ${rscResponse.status} ${location(rscResponse)})`
    );

    response = await request("/Admin/dashboard", "", { "sec-fetch-dest": "document" });
    assert(response.status === 303 && location(response).includes("/login"), "missing credentials must redirect protected navigation to login");

    response = await request("/login", "", { "sec-fetch-dest": "document" });
    assert(response.status === 200, "no session must render login");

    const malformed = await request("/Admin/dashboard", cookieHeader("malformed", "malformed"), { "sec-fetch-dest": "document" });
    assert(malformed.status === 303 && location(malformed).includes("/api/auth/refresh"), "malformed access with a refresh cookie must attempt recovery");
    response = await request(location(malformed), cookieHeader(undefined, "malformed"));
    assert(response.status === 303 && location(response).endsWith("/login"), "malformed refresh must redirect to login");

    const revoked = await createSession(user.id, "ADMIN");
    await prisma.session.delete({ where: { tokenHash: hashRefreshToken(revoked.refresh) } });
    response = await refresh(revoked.refresh, "/Admin/dashboard");
    assert(response.status === 303 && location(response).endsWith("/login"), "revoked refresh must redirect to login");

    const concurrent = await createSession(user.id, "ADMIN");
    const [first, second] = await Promise.all([
      refresh(concurrent.refresh, "/Admin/dashboard"),
      refresh(concurrent.refresh, "/Admin/dashboard"),
    ]);
    const results = [first, second];
    assert(results.filter((result) => result.headers.getSetCookie().length === 2).length === 1, "exactly one concurrent refresh must issue replacement cookies");
    assert(results.filter((result) => result.headers.get("x-refresh-rotation") === "concurrent-request").length === 1, "exactly one concurrent refresh must lose safely");
    const old = await prisma.session.findUnique({ where: { tokenHash: hashRefreshToken(concurrent.refresh) } });
    assert(Boolean(old?.rotatedAt), "old concurrent refresh session must be tombstoned");

    const teacherToken = await signAccessToken(user.id, "TEACHER");
    response = await request("/Admin/dashboard", cookieHeader(teacherToken, primary.refresh), { "sec-fetch-dest": "document" });
    assert(response.status === 303 && location(response).endsWith("/Teacher"), "wrong token role must be redirected by proxy");

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
