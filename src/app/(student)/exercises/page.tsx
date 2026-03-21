import type { Metadata } from "next"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ExerciseLibrary } from "./exercise-library"

export const metadata: Metadata = {
  title: "Biblioteca de Exercícios",
  robots: { index: false, follow: false },
}

export default async function ExercisesPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const [exercises, muscleGroups] = await Promise.all([
    prisma.exercise.findMany({
      select: {
        id: true,
        name: true,
        muscle: true,
        equipment: true,
        instructions: true,
      },
      orderBy: [{ muscle: "asc" }, { name: "asc" }],
    }),
    prisma.exercise.findMany({
      select: { muscle: true },
      distinct: ["muscle"],
      orderBy: { muscle: "asc" },
    }),
  ])

  return (
    <ExerciseLibrary
      exercises={exercises}
      muscleGroups={muscleGroups.map(m => m.muscle)}
    />
  )
}
