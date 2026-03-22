const { Client } = require('pg')

async function main() {
  const c = new Client({ connectionString: process.env.DATABASE_URL })
  await c.connect()
  console.log('Connected to database')

  // Create enums
  const enums = [
    "CREATE TYPE \"PhotoCategory\" AS ENUM ('FRONT','BACK','SIDE_LEFT','SIDE_RIGHT','CUSTOM')",
    "CREATE TYPE \"ScheduleStatus\" AS ENUM ('SCHEDULED','CONFIRMED','COMPLETED','CANCELLED','NO_SHOW')",
    "CREATE TYPE \"ActivityType\" AS ENUM ('CARDIO','RUNNING','CYCLING','SWIMMING','YOGA','STRETCHING','HIIT','SPORT','OTHER')",
    "CREATE TYPE \"TemplateGoal\" AS ENUM ('HYPERTROPHY','STRENGTH','FAT_LOSS','ENDURANCE','GENERAL_FITNESS','REHABILITATION')",
    "CREATE TYPE \"TemplateLevel\" AS ENUM ('BEGINNER','INTERMEDIATE','ADVANCED')",
    "CREATE TYPE \"ReminderStatus\" AS ENUM ('PENDING','SENT','ACKNOWLEDGED')",
  ]

  for (const sql of enums) {
    try { await c.query(sql) } catch (e) {
      if (e.code === '42710') console.log('  enum already exists, skipping')
      else throw e
    }
  }
  console.log('Enums OK')

  // Create tables
  await c.query(`
    CREATE TABLE IF NOT EXISTS "ProgressPhoto" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "studentId" TEXT NOT NULL,
      "imageUrl" TEXT NOT NULL,
      "category" "PhotoCategory" NOT NULL DEFAULT 'FRONT',
      "weight" DOUBLE PRECISION,
      "bodyFat" DOUBLE PRECISION,
      "notes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ProgressPhoto_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "ProgressPhoto_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE
    )
  `)
  console.log('ProgressPhoto OK')

  await c.query(`
    CREATE TABLE IF NOT EXISTS "ScheduleSlot" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "trainerId" TEXT NOT NULL,
      "studentId" TEXT,
      "title" TEXT,
      "date" TIMESTAMP(3) NOT NULL,
      "duration" INTEGER NOT NULL DEFAULT 60,
      "status" "ScheduleStatus" NOT NULL DEFAULT 'SCHEDULED',
      "notes" TEXT,
      "recurring" BOOLEAN NOT NULL DEFAULT false,
      "color" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ScheduleSlot_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "ScheduleSlot_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile"("id"),
      CONSTRAINT "ScheduleSlot_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL
    )
  `)
  console.log('ScheduleSlot OK')

  await c.query(`
    CREATE TABLE IF NOT EXISTS "ExtraActivity" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "studentId" TEXT NOT NULL,
      "type" "ActivityType" NOT NULL,
      "name" TEXT NOT NULL,
      "durationMin" INTEGER,
      "caloriesBurned" INTEGER,
      "distance" DOUBLE PRECISION,
      "heartRateAvg" INTEGER,
      "notes" TEXT,
      "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ExtraActivity_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "ExtraActivity_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE
    )
  `)
  console.log('ExtraActivity OK')

  await c.query(`
    CREATE TABLE IF NOT EXISTS "WorkoutTemplateLibrary" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "goal" "TemplateGoal" NOT NULL,
      "level" "TemplateLevel" NOT NULL,
      "daysPerWeek" INTEGER NOT NULL,
      "exercises" JSONB NOT NULL,
      "isPublic" BOOLEAN NOT NULL DEFAULT true,
      "usageCount" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "WorkoutTemplateLibrary_pkey" PRIMARY KEY ("id")
    )
  `)
  console.log('WorkoutTemplateLibrary OK')

  await c.query(`
    CREATE TABLE IF NOT EXISTS "PaymentReminder" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "paymentId" TEXT NOT NULL,
      "channel" TEXT NOT NULL DEFAULT 'APP',
      "message" TEXT NOT NULL,
      "status" "ReminderStatus" NOT NULL DEFAULT 'PENDING',
      "sentAt" TIMESTAMP(3),
      "readAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "PaymentReminder_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "PaymentReminder_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE
    )
  `)
  console.log('PaymentReminder OK')

  // Create indexes
  const indexes = [
    'CREATE INDEX IF NOT EXISTS "ProgressPhoto_studentId_idx" ON "ProgressPhoto"("studentId")',
    'CREATE INDEX IF NOT EXISTS "ProgressPhoto_createdAt_idx" ON "ProgressPhoto"("createdAt")',
    'CREATE INDEX IF NOT EXISTS "ProgressPhoto_category_idx" ON "ProgressPhoto"("category")',
    'CREATE INDEX IF NOT EXISTS "ScheduleSlot_trainerId_idx" ON "ScheduleSlot"("trainerId")',
    'CREATE INDEX IF NOT EXISTS "ScheduleSlot_studentId_idx" ON "ScheduleSlot"("studentId")',
    'CREATE INDEX IF NOT EXISTS "ScheduleSlot_date_idx" ON "ScheduleSlot"("date")',
    'CREATE INDEX IF NOT EXISTS "ScheduleSlot_status_idx" ON "ScheduleSlot"("status")',
    'CREATE INDEX IF NOT EXISTS "ExtraActivity_studentId_idx" ON "ExtraActivity"("studentId")',
    'CREATE INDEX IF NOT EXISTS "ExtraActivity_date_idx" ON "ExtraActivity"("date")',
    'CREATE INDEX IF NOT EXISTS "ExtraActivity_type_idx" ON "ExtraActivity"("type")',
    'CREATE INDEX IF NOT EXISTS "WorkoutTemplateLibrary_goal_idx" ON "WorkoutTemplateLibrary"("goal")',
    'CREATE INDEX IF NOT EXISTS "WorkoutTemplateLibrary_level_idx" ON "WorkoutTemplateLibrary"("level")',
    'CREATE INDEX IF NOT EXISTS "WorkoutTemplateLibrary_usageCount_idx" ON "WorkoutTemplateLibrary"("usageCount")',
    'CREATE INDEX IF NOT EXISTS "PaymentReminder_paymentId_idx" ON "PaymentReminder"("paymentId")',
    'CREATE INDEX IF NOT EXISTS "PaymentReminder_status_idx" ON "PaymentReminder"("status")',
  ]

  for (const sql of indexes) {
    await c.query(sql)
  }
  console.log('Indexes OK')

  // Seed templates
  const templates = [
    { name: "Push Pull Legs — Hipertrofia Iniciante", description: "Divisão clássica PPL para quem está começando. 3 dias/semana.", goal: "HYPERTROPHY", level: "BEGINNER", daysPerWeek: 3, exercises: [{ name: "Supino Reto", sets: 3, reps: "10-12", restSeconds: 90 }, { name: "Desenvolvimento Militar", sets: 3, reps: "10-12", restSeconds: 90 }, { name: "Tríceps Corda", sets: 3, reps: "12-15", restSeconds: 60 }, { name: "Puxada Frontal", sets: 3, reps: "10-12", restSeconds: 90 }, { name: "Remada Curvada", sets: 3, reps: "10-12", restSeconds: 90 }, { name: "Rosca Direta", sets: 3, reps: "12-15", restSeconds: 60 }, { name: "Agachamento Livre", sets: 4, reps: "8-10", restSeconds: 120 }, { name: "Leg Press 45", sets: 3, reps: "10-12", restSeconds: 90 }, { name: "Cadeira Extensora", sets: 3, reps: "12-15", restSeconds: 60 }] },
    { name: "Upper Lower — Hipertrofia Intermediário", description: "Divisão superior/inferior 4x/semana.", goal: "HYPERTROPHY", level: "INTERMEDIATE", daysPerWeek: 4, exercises: [{ name: "Supino Reto", sets: 4, reps: "8-10", restSeconds: 120 }, { name: "Remada Cavalinho", sets: 4, reps: "8-10", restSeconds: 90 }, { name: "Desenvolvimento Halteres", sets: 3, reps: "10-12", restSeconds: 90 }, { name: "Agachamento Livre", sets: 4, reps: "6-8", restSeconds: 180 }, { name: "Stiff", sets: 4, reps: "8-10", restSeconds: 120 }, { name: "Leg Press 45", sets: 3, reps: "10-12", restSeconds: 90 }] },
    { name: "PPL 6x — Hipertrofia Avançado", description: "Push Pull Legs 6x/semana com alto volume.", goal: "HYPERTROPHY", level: "ADVANCED", daysPerWeek: 6, exercises: [{ name: "Supino Reto", sets: 4, reps: "6-8", restSeconds: 180 }, { name: "Supino Inclinado Halteres", sets: 4, reps: "8-10", restSeconds: 120 }, { name: "Puxada Frontal", sets: 4, reps: "8-10", restSeconds: 120 }, { name: "Remada Curvada", sets: 4, reps: "8-10", restSeconds: 120 }, { name: "Agachamento Livre", sets: 5, reps: "5-8", restSeconds: 180 }] },
    { name: "5x5 StrongLifts — Força Iniciante", description: "Programa clássico 5x5 com progressão linear.", goal: "STRENGTH", level: "BEGINNER", daysPerWeek: 3, exercises: [{ name: "Agachamento Livre", sets: 5, reps: "5", restSeconds: 180 }, { name: "Supino Reto", sets: 5, reps: "5", restSeconds: 180 }, { name: "Remada Curvada", sets: 5, reps: "5", restSeconds: 180 }, { name: "Desenvolvimento Militar", sets: 5, reps: "5", restSeconds: 180 }] },
    { name: "Wendler 5/3/1 — Força Intermediário", description: "Periodização ondulada com 4 lifts principais.", goal: "STRENGTH", level: "INTERMEDIATE", daysPerWeek: 4, exercises: [{ name: "Agachamento Livre", sets: 3, reps: "5/3/1", restSeconds: 240 }, { name: "Supino Reto", sets: 3, reps: "5/3/1", restSeconds: 240 }, { name: "Levantamento Terra", sets: 3, reps: "5/3/1", restSeconds: 300 }, { name: "Desenvolvimento Militar", sets: 3, reps: "5/3/1", restSeconds: 240 }] },
    { name: "Full Body — Emagrecimento Iniciante", description: "Circuito full body 3x/semana com descansos curtos.", goal: "FAT_LOSS", level: "BEGINNER", daysPerWeek: 3, exercises: [{ name: "Agachamento Livre", sets: 3, reps: "15", restSeconds: 45 }, { name: "Supino Reto", sets: 3, reps: "12", restSeconds: 45 }, { name: "Remada Curvada", sets: 3, reps: "12", restSeconds: 45 }, { name: "Cadeira Extensora", sets: 3, reps: "15", restSeconds: 30 }] },
    { name: "HIIT + Musculação — Emagrecimento Avançado", description: "Força e circuitos metabólicos 5x/semana.", goal: "FAT_LOSS", level: "ADVANCED", daysPerWeek: 5, exercises: [{ name: "Agachamento Livre", sets: 4, reps: "10", restSeconds: 60 }, { name: "Supino Reto", sets: 4, reps: "10", restSeconds: 60 }, { name: "Remada Curvada", sets: 4, reps: "10", restSeconds: 60 }, { name: "Stiff", sets: 3, reps: "12", restSeconds: 60 }] },
    { name: "Circuito Resistência — 3x/semana", description: "Reps altas e descansos mínimos.", goal: "ENDURANCE", level: "BEGINNER", daysPerWeek: 3, exercises: [{ name: "Agachamento Livre", sets: 3, reps: "20", restSeconds: 30 }, { name: "Flexão de Braço", sets: 3, reps: "15-20", restSeconds: 30 }, { name: "Puxada Frontal", sets: 3, reps: "15", restSeconds: 30 }] },
    { name: "Full Body Funcional — Condicionamento", description: "Treino funcional completo para saúde geral.", goal: "GENERAL_FITNESS", level: "BEGINNER", daysPerWeek: 3, exercises: [{ name: "Agachamento Livre", sets: 3, reps: "12", restSeconds: 60 }, { name: "Supino Reto", sets: 3, reps: "10", restSeconds: 60 }, { name: "Remada Curvada", sets: 3, reps: "10", restSeconds: 60 }] },
    { name: "Reabilitação Articular — Iniciante", description: "Exercícios de baixo impacto para recuperação.", goal: "REHABILITATION", level: "BEGINNER", daysPerWeek: 3, exercises: [{ name: "Cadeira Extensora", sets: 3, reps: "15", restSeconds: 60 }, { name: "Cadeira Flexora", sets: 3, reps: "15", restSeconds: 60 }, { name: "Leg Press 45", sets: 3, reps: "12", restSeconds: 90 }] },
  ]

  let seeded = 0
  for (const t of templates) {
    const exists = await c.query('SELECT id FROM "WorkoutTemplateLibrary" WHERE "name" = $1', [t.name])
    if (exists.rows.length > 0) { console.log('  skip: ' + t.name); continue }
    await c.query(
      'INSERT INTO "WorkoutTemplateLibrary" ("id","name","description","goal","level","daysPerWeek","exercises","isPublic","usageCount","createdAt","updatedAt") VALUES (gen_random_uuid()::text,$1,$2,$3,$4,$5,$6,true,0,NOW(),NOW())',
      [t.name, t.description, t.goal, t.level, t.daysPerWeek, JSON.stringify(t.exercises)]
    )
    seeded++
    console.log('  seeded: ' + t.name)
  }

  console.log('\nDone! ' + seeded + ' templates seeded.')

  // Verify
  const tables = await c.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")
  console.log('\nAll tables:')
  tables.rows.forEach(r => console.log('  ' + r.tablename))

  await c.end()
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1) })
