import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, hashPassword } from "@/lib/auth"
import { getTrainerProfile } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { freeModel, visionModel } from "@/lib/ai"
import { generateText } from "ai"
import { z } from "zod"
import crypto from "crypto"

// Schema for AI-parsed MFIT data
const MfitStudentSchema = z.object({
  name: z.string(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional().nullable(),
  weight: z.number().optional().nullable(),
  height: z.number().optional().nullable(),
  goals: z.string().optional().nullable(),
  restrictions: z.array(z.string()).optional().nullable(),
  notes: z.string().optional().nullable(),
})

const MfitWorkoutSchema = z.object({
  studentName: z.string(),
  workoutName: z.string(),
  workoutType: z.string().optional().nullable(),
  exercises: z.array(
    z.object({
      name: z.string(),
      muscle: z.string().optional().nullable(),
      sets: z.number().optional().nullable(),
      reps: z.string().optional().nullable(),
      load: z.number().optional().nullable(),
      rest: z.number().optional().nullable(),
      notes: z.string().optional().nullable(),
    })
  ),
})

const MfitDataSchema = z.object({
  students: z.array(MfitStudentSchema),
  workouts: z.array(MfitWorkoutSchema),
  warnings: z.array(z.string()),
})

const MFIT_PARSE_PROMPT = `Voce e um especialista em migração de dados fitness.
Analise o conteudo abaixo que foi exportado do app MFIT (pode ser CSV, PDF extraido, ou texto copiado).

Extraia TODOS os dados que encontrar e organize no formato JSON solicitado.

REGRAS IMPORTANTES:
1. Nomes de alunos devem estar capitalizados corretamente (ex: "joao silva" → "João Silva")
2. Se o email nao existir, coloque null
3. Telefones devem estar no formato brasileiro (ex: "(85) 99999-9999")
4. Peso em kg (float), altura em cm (float)
5. Genero: "MALE", "FEMALE" ou "OTHER"
6. Para exercicios, tente identificar o grupo muscular (Peito, Costas, Ombros, Biceps, Triceps, Pernas, Gluteos, Core, Panturrilha, Antebraco)
7. Reps podem ser range como "10-12" ou numero fixo "10"
8. Carga em kg (float)
9. Descanso em segundos
10. Se algum dado estiver ambiguo ou incompleto, adicione em "warnings"
11. birthDate no formato "YYYY-MM-DD" se possivel extrair
12. Se encontrar dados de treino mas nao conseguir associar a um aluno, use o campo studentName como "Sem Aluno"
13. Extraia o maximo de informacao possivel, mesmo que parcial

Responda APENAS com JSON valido.`

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const trainer = await getTrainerProfile(session.userId)

    const body = await req.json()
    const { content, fileName } = body

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Conteúdo do arquivo é obrigatório" },
        { status: 400 }
      )
    }

    // Check if content is an image (base64)
    const isImage = content.startsWith("[IMAGE:")

    if (!isImage && content.length > 500_000) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Máximo 500KB de texto." },
        { status: 400 }
      )
    }

    // Step 1: Use AI to parse the MFIT data
    let rawText: string

    if (isImage) {
      // Image OCR — extract text from screenshot using Groq Vision (Llama 3.2 11B)
      const base64Data = content.slice(7, -1) // Remove "[IMAGE:" and "]"
      // base64Data is like "data:image/png;base64,iVBOR..." — need to extract just the base64 part
      const base64Only = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data
      const mimeMatch = base64Data.match(/data:([^;]+);/)
      const mimeType = mimeMatch ? mimeMatch[1] : "image/png"

      const { text } = await generateText({
        model: visionModel,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: `${MFIT_PARSE_PROMPT}\n\nA imagem abaixo é um screenshot/foto do app MFIT. Extraia TODOS os dados visíveis (alunos, treinos, exercícios, séries, cargas, etc.) e converta para o JSON solicitado. Responda APENAS com JSON válido.` },
              { type: "image", image: base64Only },
            ],
          },
        ],
      })
      rawText = text
    } else {
      // Text content — CSV, TXT, pasted text
      const { text } = await generateText({
        model: freeModel,
        prompt: `${MFIT_PARSE_PROMPT}\n\nNome do arquivo: ${fileName || "desconhecido"}\n\nCONTEÚDO:\n${content}`,
      })
      rawText = text
    }

    // Extract JSON from response (handles markdown code blocks)
    let parsedData: z.infer<typeof MfitDataSchema>
    try {
      const jsonStr = rawText.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim()
      const raw = JSON.parse(jsonStr)
      parsedData = MfitDataSchema.parse(raw)
    } catch {
      return NextResponse.json(
        { error: "Não foi possível extrair dados do arquivo. Verifique se o formato está correto." },
        { status: 422 }
      )
    }

    // Step 2: Preview mode — return parsed data without importing
    if (body.preview) {
      return NextResponse.json({
        parsed: parsedData,
        studentCount: parsedData.students.length,
        workoutCount: parsedData.workouts.length,
        warnings: parsedData.warnings,
      })
    }

    // Step 3: Import students + workouts into database
    const results = {
      studentsCreated: 0,
      studentsSkipped: 0,
      workoutsCreated: 0,
      exercisesMatched: 0,
      exercisesCreated: 0,
      errors: [] as string[],
      warnings: [...parsedData.warnings],
      credentials: [] as { name: string; email: string; password: string }[],
    }

    // Load all exercises for matching
    const allExercises = await prisma.exercise.findMany({
      select: { id: true, name: true, muscle: true },
    })

    // Map for student name → student id (for workout assignment)
    const studentMap = new Map<string, string>()

    // Import students
    for (const mfitStudent of parsedData.students) {
      try {
        // Generate email if missing
        const email =
          mfitStudent.email ||
          `${mfitStudent.name.toLowerCase().replace(/\s+/g, ".").normalize("NFD").replace(/[\u0300-\u036f]/g, "")}@importado.mfit`

        // Check if email already exists
        const existing = await prisma.user.findUnique({
          where: { email },
          select: { id: true, student: { select: { id: true } } },
        })

        if (existing) {
          // If student already belongs to this trainer, skip
          if (existing.student) {
            studentMap.set(mfitStudent.name.toLowerCase(), existing.student.id)
          }
          results.studentsSkipped++
          results.warnings.push(`Aluno "${mfitStudent.name}" já existe (${email}) — pulado`)
          continue
        }

        const password = crypto.randomBytes(4).toString("hex")
        const hashedPassword = await hashPassword(password)

        const student = await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              email,
              name: mfitStudent.name,
              phone: mfitStudent.phone || null,
              password: hashedPassword,
              role: "STUDENT",
              active: true,
            },
          })

          return tx.student.create({
            data: {
              userId: user.id,
              trainerId: trainer.id,
              birthDate: mfitStudent.birthDate ? new Date(mfitStudent.birthDate) : null,
              gender: mfitStudent.gender || null,
              weight: mfitStudent.weight || null,
              height: mfitStudent.height || null,
              goals: mfitStudent.goals || null,
              restrictions: mfitStudent.restrictions?.length
                ? mfitStudent.restrictions
                : undefined,
              notes: mfitStudent.notes
                ? `[Importado MFIT] ${mfitStudent.notes}`
                : "[Importado MFIT]",
              status: "ACTIVE",
            },
          })
        })

        studentMap.set(mfitStudent.name.toLowerCase(), student.id)
        results.studentsCreated++
        results.credentials.push({ name: mfitStudent.name, email, password })
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erro desconhecido"
        results.errors.push(`Erro ao importar "${mfitStudent.name}": ${msg}`)
      }
    }

    // Import workouts
    for (const mfitWorkout of parsedData.workouts) {
      try {
        const studentId = studentMap.get(mfitWorkout.studentName.toLowerCase())
        if (!studentId && mfitWorkout.studentName !== "Sem Aluno") {
          results.warnings.push(
            `Treino "${mfitWorkout.workoutName}" — aluno "${mfitWorkout.studentName}" não encontrado`
          )
        }

        // Match or create exercises
        const exerciseEntries: {
          exerciseId: string
          sets: number
          reps: string
          restSeconds: number
          loadKg: number | null
          notes: string | null
          order: number
        }[] = []

        for (let i = 0; i < mfitWorkout.exercises.length; i++) {
          const mfitEx = mfitWorkout.exercises[i]

          // Try to find existing exercise by name (fuzzy)
          const normalizedName = mfitEx.name.toLowerCase().trim()
          let match = allExercises.find(
            (e) => e.name.toLowerCase().trim() === normalizedName
          )

          // Partial match
          if (!match) {
            match = allExercises.find(
              (e) =>
                e.name.toLowerCase().includes(normalizedName) ||
                normalizedName.includes(e.name.toLowerCase())
            )
          }

          let exerciseId: string

          if (match) {
            exerciseId = match.id
            results.exercisesMatched++
          } else {
            // Create custom exercise
            const created = await prisma.exercise.create({
              data: {
                name: mfitEx.name,
                muscle: mfitEx.muscle || "Outro",
                equipment: "Outro",
                instructions: null,
                isCustom: true,
              },
            })
            exerciseId = created.id
            allExercises.push({ id: created.id, name: created.name, muscle: created.muscle })
            results.exercisesCreated++
          }

          exerciseEntries.push({
            exerciseId,
            sets: mfitEx.sets || 3,
            reps: mfitEx.reps || "10-12",
            restSeconds: mfitEx.rest || 60,
            loadKg: mfitEx.load || null,
            notes: mfitEx.notes || null,
            order: i + 1,
          })
        }

        // Create workout template
        const template = await prisma.workoutTemplate.create({
          data: {
            name: mfitWorkout.workoutName,
            type: mfitWorkout.workoutType || "Importado MFIT",
            trainerId: trainer.id,
            notes: `[Importado MFIT]${studentId ? "" : ` — Aluno: ${mfitWorkout.studentName}`}`,
            exercises: {
              create: exerciseEntries,
            },
          },
        })

        // Assign to student if found
        if (studentId) {
          // Find next available day
          const existingPlans = await prisma.studentWorkoutPlan.findMany({
            where: { studentId },
            select: { dayOfWeek: true },
          })
          const usedDays = new Set(existingPlans.map((p) => p.dayOfWeek))
          // Try weekdays first (1-5), then weekend (0, 6)
          const preferredDays = [1, 2, 3, 4, 5, 6, 0]
          const availableDay = preferredDays.find((d) => !usedDays.has(d))

          if (availableDay !== undefined) {
            await prisma.studentWorkoutPlan.create({
              data: {
                studentId,
                templateId: template.id,
                dayOfWeek: availableDay,
                active: true,
              },
            })
          }
        }

        results.workoutsCreated++
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erro desconhecido"
        results.errors.push(`Erro ao importar treino "${mfitWorkout.workoutName}": ${msg}`)
      }
    }

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error"
    const status =
      message === "Unauthorized" || message === "Forbidden" ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
