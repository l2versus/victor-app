import { PrismaClient } from "../src/generated/prisma/client.js"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Check all MASTER users
  const masters = await prisma.user.findMany({ where: { role: "MASTER" } })
  console.log("Current MASTER users:", masters.map(u => ({ id: u.id, email: u.email, name: u.name })))

  // Check if master@victorapp.com still exists
  const old = await prisma.user.findUnique({ where: { email: "master@victorapp.com" } })
  console.log("Old email exists?", !!old)

  // Check if master@app.com exists
  const newUser = await prisma.user.findUnique({ where: { email: "master@app.com" } })
  console.log("New email exists?", !!newUser)

  // Force create/update
  const hash = await bcrypt.hash("master2026", 10)

  if (old) {
    await prisma.user.update({ where: { id: old.id }, data: { email: "master@app.com" } })
    console.log("✓ Updated old email to master@app.com")
  } else if (!newUser) {
    await prisma.user.create({
      data: { email: "master@app.com", password: hash, name: "Emmanuel Bezerra", role: "MASTER" },
    })
    console.log("✓ Created new master@app.com user")
  } else {
    // Ensure password and role are correct
    await prisma.user.update({
      where: { email: "master@app.com" },
      data: { password: hash, role: "MASTER", name: "Emmanuel Bezerra" },
    })
    console.log("✓ Updated existing master@app.com password + role")
  }

  // Final verify
  const final = await prisma.user.findUnique({ where: { email: "master@app.com" }, select: { id: true, email: true, role: true, name: true } })
  console.log("\n✓ Final state:", JSON.stringify(final))

  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
