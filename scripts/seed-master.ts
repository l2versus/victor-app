import { PrismaClient } from "../src/generated/prisma/client.js"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  // 1. Create MASTER user
  const hash = await bcrypt.hash("master2026", 10)
  const existing = await prisma.user.findUnique({ where: { email: "master@victorapp.com" } })

  if (existing) {
    await prisma.user.update({ where: { id: existing.id }, data: { role: "MASTER" } })
    console.log("✓ Updated existing user to MASTER role")
  } else {
    await prisma.user.create({
      data: {
        email: "master@victorapp.com",
        password: hash,
        name: "Emmanuel (Master)",
        role: "MASTER",
      },
    })
    console.log("✓ Created MASTER user: master@victorapp.com / master2026")
  }

  // 2. Create Organization
  const org = await prisma.organization.upsert({
    where: { slug: "victor-personal" },
    update: {},
    create: {
      name: "Victor Personal",
      slug: "victor-personal",
      status: "ACTIVE",
      maxProfessionals: 5,
      maxStudents: 100,
      brandConfig: {
        primaryColor: "#dc2626",
        appName: "Victor App",
        trainerName: "Victor Oliveira",
      },
    },
  })
  console.log("✓ Organization:", org.name, `(${org.slug})`)

  // 3. Link trainer to org
  const trainer = await prisma.trainerProfile.findFirst()
  if (trainer && !trainer.organizationId) {
    await prisma.trainerProfile.update({
      where: { id: trainer.id },
      data: { organizationId: org.id },
    })
    console.log("✓ Linked trainer to org")
  } else {
    console.log("✓ Trainer already linked or not found")
  }

  // 4. Link students to org
  const updated = await prisma.student.updateMany({
    where: { organizationId: null },
    data: { organizationId: org.id },
  })
  console.log("✓ Linked", updated.count, "students to org")

  // 5. Verify
  const masterUser = await prisma.user.findUnique({
    where: { email: "master@victorapp.com" },
    select: { id: true, role: true, name: true },
  })
  console.log("\n✓ Master user:", JSON.stringify(masterUser))

  const orgCheck = await prisma.organization.findUnique({
    where: { slug: "victor-personal" },
    select: { id: true, name: true, status: true },
  })
  console.log("✓ Organization:", JSON.stringify(orgCheck))

  const studentsInOrg = await prisma.student.count({ where: { organizationId: org.id } })
  console.log("✓ Students in org:", studentsInOrg)

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
