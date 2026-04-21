import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { prisma } from './prisma'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-secret-change-in-production'
)

// ─── Staff JWT ────────────────────────────────────────────

export async function signToken(payload: { id: number; role: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as { id: number; role: string }
  } catch {
    return null
  }
}

export async function getStaffFromRequest(request: Request) {
  const auth = request.headers.get('authorization')
  const token = auth?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

// ─── Parent cookie ────────────────────────────────────────

export async function getParentFromCookie() {
  const cookieStore = await cookies()
  const token = cookieStore.get('ninja_parent_token')?.value
  if (!token) return null

  return prisma.parent.findUnique({
    where: { bookingToken: token },
    select: {
      id: true,
      name: true,
      phone: true,
      bookingToken: true,
      preferredLang: true,
      students: {
        where: { active: true },
        select: {
          id: true,
          name: true,
          age: true,
          photoUrl: true,
          locations: {
            select: { location: { select: { id: true, name: true } } },
          },
          packages: {
            where: {
              package: {
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
              },
            },
            select: {
              isPrimary: true,
              package: {
                select: {
                  id: true,
                  creditType: true,
                  totalCredits: true,
                  usedCredits: true,
                  expiresAt: true,
                  groupLabel: true,
                },
              },
            },
          },
        },
      },
    },
  })
}

// ─── PIN utils ────────────────────────────────────────────

export const hashPin = (pin: string) => bcrypt.hash(pin, 12)
export const verifyPin = (pin: string, hash: string) => bcrypt.compare(pin, hash)
