import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

interface ExerciseSeed {
  name: string;
  muscle: string;
  equipment: string;
  instructions: string;
}

const exercises: ExerciseSeed[] = [
  // ═══════════════════════════════════════
  // CHEST (20)
  // ═══════════════════════════════════════
  {
    name: "Flat Barbell Bench Press",
    muscle: "Chest",
    equipment: "Barbell",
    instructions:
      "Lie on a flat bench, grip the bar slightly wider than shoulder-width, lower it to your mid-chest, then press up until arms are fully extended.",
  },
  {
    name: "Incline Barbell Bench Press",
    muscle: "Chest",
    equipment: "Barbell",
    instructions:
      "Set the bench to 30-45 degrees, grip the bar slightly wider than shoulder-width, lower to upper chest, and press up to full extension.",
  },
  {
    name: "Decline Barbell Bench Press",
    muscle: "Chest",
    equipment: "Barbell",
    instructions:
      "Lie on a decline bench with feet secured, lower the bar to your lower chest, then press up to full lockout.",
  },
  {
    name: "Flat Dumbbell Bench Press",
    muscle: "Chest",
    equipment: "Dumbbell",
    instructions:
      "Lie flat holding dumbbells above your chest, lower them to chest level with elbows at 45 degrees, then press back up.",
  },
  {
    name: "Incline Dumbbell Bench Press",
    muscle: "Chest",
    equipment: "Dumbbell",
    instructions:
      "Set the bench to 30-45 degrees, press dumbbells from shoulder level to full extension above your upper chest.",
  },
  {
    name: "Decline Dumbbell Bench Press",
    muscle: "Chest",
    equipment: "Dumbbell",
    instructions:
      "Lie on a decline bench holding dumbbells, lower them to your lower chest, then press up to full extension.",
  },
  {
    name: "Dumbbell Fly",
    muscle: "Chest",
    equipment: "Dumbbell",
    instructions:
      "Lie flat with arms extended above chest, lower the dumbbells in a wide arc with a slight elbow bend until you feel a stretch, then squeeze back up.",
  },
  {
    name: "Incline Dumbbell Fly",
    muscle: "Chest",
    equipment: "Dumbbell",
    instructions:
      "Set bench to 30-45 degrees, perform a fly motion by lowering dumbbells out to the sides, then bring them back together above your chest.",
  },
  {
    name: "Cable Crossover",
    muscle: "Chest",
    equipment: "Cable",
    instructions:
      "Stand between cable stations with pulleys set high, step forward and bring handles together in front of your chest in a hugging motion.",
  },
  {
    name: "Low Cable Crossover",
    muscle: "Chest",
    equipment: "Cable",
    instructions:
      "Set cable pulleys to the lowest position, step forward and bring handles up and together in front of your upper chest.",
  },
  {
    name: "Machine Chest Press",
    muscle: "Chest",
    equipment: "Machine",
    instructions:
      "Sit in the chest press machine, grip the handles at chest height, push forward until arms are extended, then slowly return.",
  },
  {
    name: "Pec Deck Fly",
    muscle: "Chest",
    equipment: "Machine",
    instructions:
      "Sit with your back against the pad, place forearms on the pads, and bring them together in front of your chest by squeezing your pecs.",
  },
  {
    name: "Push-Up",
    muscle: "Chest",
    equipment: "Bodyweight",
    instructions:
      "Start in a plank position, lower your body until your chest nearly touches the floor, then push back up to full arm extension.",
  },
  {
    name: "Incline Push-Up",
    muscle: "Chest",
    equipment: "Bodyweight",
    instructions:
      "Place your hands on an elevated surface, keep your body straight, lower your chest toward the surface, then push back up.",
  },
  {
    name: "Dip (Chest)",
    muscle: "Chest",
    equipment: "Bodyweight",
    instructions:
      "Lean forward on parallel bars, lower your body by bending elbows until you feel a chest stretch, then press back up.",
  },
  {
    name: "Decline Dumbbell Fly",
    muscle: "Chest",
    equipment: "Dumbbell",
    instructions:
      "Lie on a decline bench, extend arms above chest with dumbbells, lower them in a wide arc, then squeeze them back together.",
  },
  {
    name: "Svend Press",
    muscle: "Chest",
    equipment: "Other",
    instructions:
      "Squeeze two weight plates together at chest level, extend your arms forward while maintaining pressure, then bring them back.",
  },
  {
    name: "Cable Chest Press",
    muscle: "Chest",
    equipment: "Cable",
    instructions:
      "Set cables at chest height, step forward, and press the handles together in front of your chest, then control the return.",
  },
  {
    name: "Landmine Press",
    muscle: "Chest",
    equipment: "Barbell",
    instructions:
      "Hold the end of a barbell anchored at the floor, press it up and forward from chest level until your arm is fully extended.",
  },
  {
    name: "Deficit Push-Up",
    muscle: "Chest",
    equipment: "Bodyweight",
    instructions:
      "Place hands on elevated blocks or plates, lower your chest below hand level for a deeper stretch, then push back up.",
  },

  // ═══════════════════════════════════════
  // BACK (20)
  // ═══════════════════════════════════════
  {
    name: "Wide-Grip Lat Pulldown",
    muscle: "Back",
    equipment: "Cable",
    instructions:
      "Sit at the pulldown machine, grip the bar wider than shoulder-width, pull it down to your upper chest while squeezing your lats.",
  },
  {
    name: "Close-Grip Lat Pulldown",
    muscle: "Back",
    equipment: "Cable",
    instructions:
      "Use a close-grip V-bar attachment, pull it down to your chest while keeping your torso slightly leaned back.",
  },
  {
    name: "Reverse-Grip Lat Pulldown",
    muscle: "Back",
    equipment: "Cable",
    instructions:
      "Grip the bar with palms facing you at shoulder width, pull down to your upper chest, focusing on squeezing the lower lats.",
  },
  {
    name: "Seated Cable Row",
    muscle: "Back",
    equipment: "Cable",
    instructions:
      "Sit with feet on the platform, pull the handle toward your lower chest while keeping your back straight, then slowly extend.",
  },
  {
    name: "Barbell Bent-Over Row",
    muscle: "Back",
    equipment: "Barbell",
    instructions:
      "Hinge at the hips with knees slightly bent, pull the barbell to your lower chest, squeeze your shoulder blades, then lower.",
  },
  {
    name: "Dumbbell Single-Arm Row",
    muscle: "Back",
    equipment: "Dumbbell",
    instructions:
      "Place one hand and knee on a bench, row the dumbbell to your hip with the other arm, squeezing at the top.",
  },
  {
    name: "T-Bar Row",
    muscle: "Back",
    equipment: "Barbell",
    instructions:
      "Straddle the T-bar, grip the handles, hinge forward and pull the weight to your chest while keeping your back flat.",
  },
  {
    name: "Machine Row",
    muscle: "Back",
    equipment: "Machine",
    instructions:
      "Sit at the row machine, grip the handles, pull toward your torso squeezing shoulder blades together, then return slowly.",
  },
  {
    name: "Cable Face Pull",
    muscle: "Back",
    equipment: "Cable",
    instructions:
      "Set the cable at face height with a rope attachment, pull toward your face while externally rotating your shoulders.",
  },
  {
    name: "Pull-Up",
    muscle: "Back",
    equipment: "Bodyweight",
    instructions:
      "Hang from a bar with an overhand grip wider than shoulder-width, pull your chin above the bar, then lower with control.",
  },
  {
    name: "Chin-Up",
    muscle: "Back",
    equipment: "Bodyweight",
    instructions:
      "Hang from a bar with palms facing you at shoulder width, pull your chin above the bar emphasizing the biceps and lats.",
  },
  {
    name: "Neutral-Grip Pull-Up",
    muscle: "Back",
    equipment: "Bodyweight",
    instructions:
      "Use parallel handles with palms facing each other, pull your chin above bar level, engaging lats and biceps evenly.",
  },
  {
    name: "Inverted Row",
    muscle: "Back",
    equipment: "Bodyweight",
    instructions:
      "Lie under a bar set at waist height, grip it overhand, pull your chest to the bar while keeping your body straight.",
  },
  {
    name: "Straight-Arm Pulldown",
    muscle: "Back",
    equipment: "Cable",
    instructions:
      "Stand facing a high cable, grip the bar with straight arms, push it down to your thighs by engaging your lats.",
  },
  {
    name: "Meadows Row",
    muscle: "Back",
    equipment: "Barbell",
    instructions:
      "Stand perpendicular to a landmine, grab the end of the barbell with one hand, row it toward your hip with an arcing motion.",
  },
  {
    name: "Pendlay Row",
    muscle: "Back",
    equipment: "Barbell",
    instructions:
      "From a dead stop on the floor, explosively row the barbell to your lower chest, then lower it back to the ground each rep.",
  },
  {
    name: "Seal Row",
    muscle: "Back",
    equipment: "Dumbbell",
    instructions:
      "Lie face down on an elevated bench, let dumbbells hang below, row them to the bench level by squeezing your shoulder blades.",
  },
  {
    name: "Chest-Supported Row",
    muscle: "Back",
    equipment: "Dumbbell",
    instructions:
      "Lie face down on an incline bench, row dumbbells to hip level while keeping your chest pressed against the pad.",
  },
  {
    name: "Helms Row",
    muscle: "Back",
    equipment: "Dumbbell",
    instructions:
      "Lie chest-down on an incline bench, row dumbbells with elbows close to the body, focusing on mid-back contraction.",
  },
  {
    name: "Kayak Row",
    muscle: "Back",
    equipment: "Cable",
    instructions:
      "Sit at a cable row station, alternate pulling each hand in a rowing motion that mimics paddling a kayak.",
  },

  // ═══════════════════════════════════════
  // SHOULDERS (16)
  // ═══════════════════════════════════════
  {
    name: "Barbell Overhead Press",
    muscle: "Shoulders",
    equipment: "Barbell",
    instructions:
      "Stand with the bar at shoulder level, press it overhead until arms are fully extended, then lower back to shoulders.",
  },
  {
    name: "Dumbbell Shoulder Press",
    muscle: "Shoulders",
    equipment: "Dumbbell",
    instructions:
      "Sit or stand with dumbbells at shoulder height, press them overhead until arms are fully extended, then lower with control.",
  },
  {
    name: "Arnold Press",
    muscle: "Shoulders",
    equipment: "Dumbbell",
    instructions:
      "Start with dumbbells in front of your shoulders palms facing you, rotate and press overhead so palms face forward at the top.",
  },
  {
    name: "Machine Shoulder Press",
    muscle: "Shoulders",
    equipment: "Machine",
    instructions:
      "Sit in the shoulder press machine, grip the handles at shoulder level, press overhead to full extension, then lower.",
  },
  {
    name: "Dumbbell Lateral Raise",
    muscle: "Shoulders",
    equipment: "Dumbbell",
    instructions:
      "Stand with dumbbells at your sides, raise them out to the sides until arms are parallel to the floor, then lower slowly.",
  },
  {
    name: "Cable Lateral Raise",
    muscle: "Shoulders",
    equipment: "Cable",
    instructions:
      "Stand sideways to a low cable, grab the handle with the far hand, raise your arm out to shoulder height, then lower.",
  },
  {
    name: "Dumbbell Front Raise",
    muscle: "Shoulders",
    equipment: "Dumbbell",
    instructions:
      "Hold dumbbells in front of your thighs, raise one or both arms forward to shoulder height, then lower with control.",
  },
  {
    name: "Dumbbell Rear Delt Fly",
    muscle: "Shoulders",
    equipment: "Dumbbell",
    instructions:
      "Bend forward at the hips, hold dumbbells below you, raise them out to the sides by squeezing your rear delts.",
  },
  {
    name: "Cable Rear Delt Fly",
    muscle: "Shoulders",
    equipment: "Cable",
    instructions:
      "Set cables at shoulder height with no attachments, cross the cables and pull outward by squeezing your rear delts.",
  },
  {
    name: "Reverse Pec Deck",
    muscle: "Shoulders",
    equipment: "Machine",
    instructions:
      "Sit facing the pec deck machine, grip the handles, and push them apart by squeezing your rear delts.",
  },
  {
    name: "Upright Row",
    muscle: "Shoulders",
    equipment: "Barbell",
    instructions:
      "Hold a barbell with a narrow grip, pull it up along your body to chin height leading with your elbows, then lower.",
  },
  {
    name: "Barbell Shrug",
    muscle: "Shoulders",
    equipment: "Barbell",
    instructions:
      "Hold a barbell with arms extended, shrug your shoulders straight up toward your ears, hold briefly, then lower.",
  },
  {
    name: "Dumbbell Shrug",
    muscle: "Shoulders",
    equipment: "Dumbbell",
    instructions:
      "Hold dumbbells at your sides, shrug your shoulders up toward your ears, squeeze at the top, then lower slowly.",
  },
  {
    name: "Lu Raise",
    muscle: "Shoulders",
    equipment: "Dumbbell",
    instructions:
      "Perform a lateral raise to shoulder height, then rotate the dumbbells overhead into a press position. Reverse the motion down.",
  },
  {
    name: "Plate Front Raise",
    muscle: "Shoulders",
    equipment: "Other",
    instructions:
      "Hold a weight plate with both hands at thigh level, raise it to shoulder height with straight arms, then lower.",
  },
  {
    name: "Behind-the-Neck Press",
    muscle: "Shoulders",
    equipment: "Barbell",
    instructions:
      "With a wide grip, lower the barbell behind your head to ear level, then press overhead. Requires good shoulder mobility.",
  },

  // ═══════════════════════════════════════
  // BICEPS (12)
  // ═══════════════════════════════════════
  {
    name: "Barbell Curl",
    muscle: "Biceps",
    equipment: "Barbell",
    instructions:
      "Stand with a barbell at arm's length, curl it up by flexing your elbows, squeeze at the top, then lower under control.",
  },
  {
    name: "EZ-Bar Curl",
    muscle: "Biceps",
    equipment: "Barbell",
    instructions:
      "Grip an EZ-bar on the angled portions, curl it up keeping elbows pinned to your sides, then lower slowly.",
  },
  {
    name: "Dumbbell Curl",
    muscle: "Biceps",
    equipment: "Dumbbell",
    instructions:
      "Stand holding dumbbells at your sides, curl them up while supinating your wrists, squeeze at the top, then lower.",
  },
  {
    name: "Hammer Curl",
    muscle: "Biceps",
    equipment: "Dumbbell",
    instructions:
      "Hold dumbbells with a neutral grip (palms facing each other), curl up keeping the grip neutral throughout the movement.",
  },
  {
    name: "Preacher Curl",
    muscle: "Biceps",
    equipment: "Barbell",
    instructions:
      "Sit at a preacher bench, rest your upper arms on the pad, curl the bar up, then lower slowly for a full stretch.",
  },
  {
    name: "Concentration Curl",
    muscle: "Biceps",
    equipment: "Dumbbell",
    instructions:
      "Sit on a bench, brace your elbow against your inner thigh, curl the dumbbell up focusing on peak contraction.",
  },
  {
    name: "Cable Curl",
    muscle: "Biceps",
    equipment: "Cable",
    instructions:
      "Stand facing a low cable with a straight bar, curl the bar up while keeping elbows stationary, then lower.",
  },
  {
    name: "Incline Dumbbell Curl",
    muscle: "Biceps",
    equipment: "Dumbbell",
    instructions:
      "Sit on an incline bench at 45 degrees, let dumbbells hang, curl them up with a supinated grip for a deep stretch.",
  },
  {
    name: "Spider Curl",
    muscle: "Biceps",
    equipment: "Dumbbell",
    instructions:
      "Lie face down on an incline bench, let your arms hang straight down, curl the dumbbells up squeezing at the top.",
  },
  {
    name: "Bayesian Curl",
    muscle: "Biceps",
    equipment: "Cable",
    instructions:
      "Stand facing away from a low cable, hold the handle behind you, curl it forward by flexing the bicep with arm extended behind.",
  },
  {
    name: "Cross-Body Hammer Curl",
    muscle: "Biceps",
    equipment: "Dumbbell",
    instructions:
      "Curl a dumbbell across your body toward the opposite shoulder with a neutral grip, targeting the brachialis.",
  },
  {
    name: "Cable Rope Hammer Curl",
    muscle: "Biceps",
    equipment: "Cable",
    instructions:
      "Attach a rope to a low cable, curl with a neutral grip splitting the rope ends apart at the top of the movement.",
  },

  // ═══════════════════════════════════════
  // TRICEPS (12)
  // ═══════════════════════════════════════
  {
    name: "Cable Tricep Pushdown",
    muscle: "Triceps",
    equipment: "Cable",
    instructions:
      "Stand at a high cable with a straight bar, push down by extending your elbows, squeeze at the bottom, then return.",
  },
  {
    name: "Rope Tricep Pushdown",
    muscle: "Triceps",
    equipment: "Cable",
    instructions:
      "Use a rope attachment on a high cable, push down and spread the rope apart at the bottom for peak contraction.",
  },
  {
    name: "Overhead Cable Extension",
    muscle: "Triceps",
    equipment: "Cable",
    instructions:
      "Face away from a high cable with a rope, extend your arms overhead by straightening your elbows, then lower behind your head.",
  },
  {
    name: "Dumbbell Overhead Extension",
    muscle: "Triceps",
    equipment: "Dumbbell",
    instructions:
      "Hold one dumbbell with both hands behind your head, extend it overhead by straightening your elbows, then lower.",
  },
  {
    name: "EZ-Bar Skull Crusher",
    muscle: "Triceps",
    equipment: "Barbell",
    instructions:
      "Lie on a bench holding an EZ-bar above your chest, lower it toward your forehead by bending elbows, then extend back up.",
  },
  {
    name: "Dumbbell Skull Crusher",
    muscle: "Triceps",
    equipment: "Dumbbell",
    instructions:
      "Lie on a bench holding dumbbells above your chest, lower them toward the sides of your head, then extend back up.",
  },
  {
    name: "Tricep Dip",
    muscle: "Triceps",
    equipment: "Bodyweight",
    instructions:
      "Support yourself on parallel bars with an upright torso, lower your body by bending elbows to 90 degrees, then press up.",
  },
  {
    name: "Close-Grip Bench Press",
    muscle: "Triceps",
    equipment: "Barbell",
    instructions:
      "Lie on a bench, grip the bar at shoulder width or narrower, lower to your chest, then press up focusing on tricep engagement.",
  },
  {
    name: "Tricep Kickback",
    muscle: "Triceps",
    equipment: "Dumbbell",
    instructions:
      "Hinge forward, keep upper arm parallel to the floor, extend the dumbbell back by straightening your elbow, then lower.",
  },
  {
    name: "Diamond Push-Up",
    muscle: "Triceps",
    equipment: "Bodyweight",
    instructions:
      "Place hands close together under your chest forming a diamond shape, lower your body, then push up focusing on triceps.",
  },
  {
    name: "Bench Dip",
    muscle: "Triceps",
    equipment: "Bodyweight",
    instructions:
      "Place hands on a bench behind you, lower your body by bending elbows to 90 degrees, then press back up.",
  },
  {
    name: "Single-Arm Cable Pushdown",
    muscle: "Triceps",
    equipment: "Cable",
    instructions:
      "Use a single handle on a high cable, push down one arm at a time for focused tricep isolation, then slowly return.",
  },

  // ═══════════════════════════════════════
  // QUADRICEPS (14)
  // ═══════════════════════════════════════
  {
    name: "Barbell Back Squat",
    muscle: "Quadriceps",
    equipment: "Barbell",
    instructions:
      "Place the bar on your upper back, squat down until thighs are parallel or below, then drive up through your heels.",
  },
  {
    name: "Barbell Front Squat",
    muscle: "Quadriceps",
    equipment: "Barbell",
    instructions:
      "Rest the bar on front delts with elbows high, squat down keeping your torso upright, then stand back up.",
  },
  {
    name: "Goblet Squat",
    muscle: "Quadriceps",
    equipment: "Dumbbell",
    instructions:
      "Hold a dumbbell vertically at chest level, squat down between your knees keeping your torso upright, then stand up.",
  },
  {
    name: "Leg Press",
    muscle: "Quadriceps",
    equipment: "Machine",
    instructions:
      "Sit in the leg press, place feet shoulder-width on the platform, lower the sled by bending knees, then press back up.",
  },
  {
    name: "Hack Squat",
    muscle: "Quadriceps",
    equipment: "Machine",
    instructions:
      "Position yourself in the hack squat machine, lower your body by bending the knees, then drive back up through the platform.",
  },
  {
    name: "Smith Machine Squat",
    muscle: "Quadriceps",
    equipment: "Machine",
    instructions:
      "Stand under the Smith machine bar, unrack it, squat down to parallel, then press up along the fixed bar path.",
  },
  {
    name: "Leg Extension",
    muscle: "Quadriceps",
    equipment: "Machine",
    instructions:
      "Sit in the leg extension machine, extend your legs by straightening your knees, squeeze at the top, then lower slowly.",
  },
  {
    name: "Walking Lunge",
    muscle: "Quadriceps",
    equipment: "Dumbbell",
    instructions:
      "Step forward into a lunge, lower your back knee toward the floor, then step through with the other leg and repeat.",
  },
  {
    name: "Reverse Lunge",
    muscle: "Quadriceps",
    equipment: "Dumbbell",
    instructions:
      "Step backward into a lunge, lower your back knee toward the floor, then push off the front foot to return to standing.",
  },
  {
    name: "Bulgarian Split Squat",
    muscle: "Quadriceps",
    equipment: "Dumbbell",
    instructions:
      "Place your rear foot on a bench behind you, lower your body by bending the front knee, then drive back up.",
  },
  {
    name: "Sissy Squat",
    muscle: "Quadriceps",
    equipment: "Bodyweight",
    instructions:
      "Hold onto a support, lean back while bending your knees and rising onto your toes, then return to standing.",
  },
  {
    name: "Step-Up",
    muscle: "Quadriceps",
    equipment: "Dumbbell",
    instructions:
      "Step onto an elevated platform with one foot, drive through the heel to stand up fully, then step back down.",
  },
  {
    name: "Pendulum Squat",
    muscle: "Quadriceps",
    equipment: "Machine",
    instructions:
      "Stand on the pendulum squat machine, lower your body following the arc motion, then press back up targeting quads.",
  },
  {
    name: "Belt Squat",
    muscle: "Quadriceps",
    equipment: "Machine",
    instructions:
      "Attach a belt to the weight stack, stand on platforms, squat down with minimal spinal load, then stand back up.",
  },

  // ═══════════════════════════════════════
  // HAMSTRINGS (10)
  // ═══════════════════════════════════════
  {
    name: "Romanian Deadlift",
    muscle: "Hamstrings",
    equipment: "Barbell",
    instructions:
      "Hold a barbell at hip level, hinge at the hips pushing them back while keeping legs nearly straight, then return to standing.",
  },
  {
    name: "Stiff-Leg Deadlift",
    muscle: "Hamstrings",
    equipment: "Barbell",
    instructions:
      "With legs kept straight, lower the barbell by hinging at the hips until you feel a deep hamstring stretch, then stand up.",
  },
  {
    name: "Lying Leg Curl",
    muscle: "Hamstrings",
    equipment: "Machine",
    instructions:
      "Lie face down on the leg curl machine, curl the pad toward your glutes by bending your knees, then lower slowly.",
  },
  {
    name: "Seated Leg Curl",
    muscle: "Hamstrings",
    equipment: "Machine",
    instructions:
      "Sit in the leg curl machine, curl the pad under the seat by bending your knees, squeeze, then return slowly.",
  },
  {
    name: "Standing Leg Curl",
    muscle: "Hamstrings",
    equipment: "Machine",
    instructions:
      "Stand at the machine, curl one leg at a time by bending your knee against the resistance, then lower with control.",
  },
  {
    name: "Good Morning",
    muscle: "Hamstrings",
    equipment: "Barbell",
    instructions:
      "Place a barbell on your upper back, hinge at the hips until your torso is nearly parallel to the floor, then stand up.",
  },
  {
    name: "Nordic Hamstring Curl",
    muscle: "Hamstrings",
    equipment: "Bodyweight",
    instructions:
      "Kneel with ankles secured, slowly lower your torso toward the ground using hamstring control, then pull yourself back up.",
  },
  {
    name: "Single-Leg Romanian Deadlift",
    muscle: "Hamstrings",
    equipment: "Dumbbell",
    instructions:
      "Stand on one leg, hinge forward letting the other leg extend behind you, lower the dumbbell, then return to upright.",
  },
  {
    name: "Dumbbell Romanian Deadlift",
    muscle: "Hamstrings",
    equipment: "Dumbbell",
    instructions:
      "Hold dumbbells in front of your thighs, hinge at the hips lowering them along your legs, then stand back up.",
  },
  {
    name: "Glute-Ham Raise",
    muscle: "Hamstrings",
    equipment: "Machine",
    instructions:
      "Position yourself on a GHD, lower your upper body by extending at the knees, then curl back up using your hamstrings.",
  },

  // ═══════════════════════════════════════
  // GLUTES (10)
  // ═══════════════════════════════════════
  {
    name: "Barbell Hip Thrust",
    muscle: "Glutes",
    equipment: "Barbell",
    instructions:
      "Sit with upper back against a bench, roll a barbell over your hips, drive hips up squeezing glutes at the top, then lower.",
  },
  {
    name: "Glute Bridge",
    muscle: "Glutes",
    equipment: "Bodyweight",
    instructions:
      "Lie on your back with knees bent and feet flat, drive your hips up by squeezing your glutes, then lower slowly.",
  },
  {
    name: "Cable Kickback",
    muscle: "Glutes",
    equipment: "Cable",
    instructions:
      "Attach an ankle strap to a low cable, kick your leg straight back squeezing your glute at the top, then return.",
  },
  {
    name: "Cable Pull-Through",
    muscle: "Glutes",
    equipment: "Cable",
    instructions:
      "Face away from a low cable, grab the rope between your legs, hinge at the hips and stand up squeezing your glutes.",
  },
  {
    name: "Sumo Squat",
    muscle: "Glutes",
    equipment: "Dumbbell",
    instructions:
      "Stand with a wide stance and toes pointed out, hold a dumbbell between your legs, squat down and stand back up.",
  },
  {
    name: "Hip Abduction Machine",
    muscle: "Glutes",
    equipment: "Machine",
    instructions:
      "Sit in the hip abduction machine, push the pads apart by spreading your knees outward, then return slowly.",
  },
  {
    name: "Banded Lateral Walk",
    muscle: "Glutes",
    equipment: "Band",
    instructions:
      "Place a resistance band around your ankles or above your knees, take lateral steps while maintaining tension in the band.",
  },
  {
    name: "Single-Leg Hip Thrust",
    muscle: "Glutes",
    equipment: "Bodyweight",
    instructions:
      "Set up like a hip thrust but extend one leg, drive up through the planted foot squeezing one glute, then lower.",
  },
  {
    name: "Frog Pump",
    muscle: "Glutes",
    equipment: "Bodyweight",
    instructions:
      "Lie on your back with soles of feet together and knees out, thrust hips up squeezing glutes hard, then lower.",
  },
  {
    name: "Kettlebell Swing",
    muscle: "Glutes",
    equipment: "Kettlebell",
    instructions:
      "Hinge at the hips, swing the kettlebell between your legs, then thrust hips forward driving the bell to chest height.",
  },

  // ═══════════════════════════════════════
  // CALVES (6)
  // ═══════════════════════════════════════
  {
    name: "Standing Calf Raise",
    muscle: "Calves",
    equipment: "Machine",
    instructions:
      "Stand on the calf raise machine with the balls of your feet on the edge, rise up on your toes, then lower slowly.",
  },
  {
    name: "Seated Calf Raise",
    muscle: "Calves",
    equipment: "Machine",
    instructions:
      "Sit at the calf raise machine with knees under the pad, press up on your toes squeezing the calves, then lower.",
  },
  {
    name: "Donkey Calf Raise",
    muscle: "Calves",
    equipment: "Machine",
    instructions:
      "Bend forward at the hips on the donkey calf raise machine, rise up on your toes, then lower for a full stretch.",
  },
  {
    name: "Leg Press Calf Raise",
    muscle: "Calves",
    equipment: "Machine",
    instructions:
      "Place just the balls of your feet on the leg press platform, push through your toes to extend your ankles, then lower.",
  },
  {
    name: "Single-Leg Calf Raise",
    muscle: "Calves",
    equipment: "Bodyweight",
    instructions:
      "Stand on one foot on an elevated surface, rise up on your toes, squeeze at the top, then lower with a full stretch.",
  },
  {
    name: "Smith Machine Calf Raise",
    muscle: "Calves",
    equipment: "Machine",
    instructions:
      "Stand under the Smith machine bar with balls of feet on a raised surface, rise up onto your toes, then lower.",
  },

  // ═══════════════════════════════════════
  // CORE (14)
  // ═══════════════════════════════════════
  {
    name: "Plank",
    muscle: "Core",
    equipment: "Bodyweight",
    instructions:
      "Hold a push-up position on your forearms, keep your body in a straight line from head to heels, and brace your core.",
  },
  {
    name: "Side Plank",
    muscle: "Core",
    equipment: "Bodyweight",
    instructions:
      "Lie on your side propped on one forearm, lift your hips to form a straight line, and hold while bracing your obliques.",
  },
  {
    name: "Ab Crunch",
    muscle: "Core",
    equipment: "Bodyweight",
    instructions:
      "Lie on your back with knees bent, curl your shoulders off the floor by contracting your abs, then lower.",
  },
  {
    name: "Bicycle Crunch",
    muscle: "Core",
    equipment: "Bodyweight",
    instructions:
      "Lie on your back, alternate bringing each elbow to the opposite knee in a pedaling motion while extending the other leg.",
  },
  {
    name: "Hanging Leg Raise",
    muscle: "Core",
    equipment: "Bodyweight",
    instructions:
      "Hang from a pull-up bar, raise your legs to parallel or higher by flexing at the hips, then lower with control.",
  },
  {
    name: "Lying Leg Raise",
    muscle: "Core",
    equipment: "Bodyweight",
    instructions:
      "Lie flat on your back, keep legs straight, raise them to 90 degrees, then lower slowly without touching the floor.",
  },
  {
    name: "Russian Twist",
    muscle: "Core",
    equipment: "Bodyweight",
    instructions:
      "Sit with knees bent and torso leaning back slightly, rotate your torso side to side, optionally holding a weight.",
  },
  {
    name: "Cable Woodchop",
    muscle: "Core",
    equipment: "Cable",
    instructions:
      "Set the cable high, grip the handle with both hands, pull it diagonally across your body to the opposite hip while rotating.",
  },
  {
    name: "Ab Wheel Rollout",
    muscle: "Core",
    equipment: "Other",
    instructions:
      "Kneel and grip an ab wheel, roll forward extending your body as far as possible, then contract your abs to roll back.",
  },
  {
    name: "Dead Bug",
    muscle: "Core",
    equipment: "Bodyweight",
    instructions:
      "Lie on your back with arms and legs raised, slowly extend opposite arm and leg while keeping your lower back pressed down.",
  },
  {
    name: "Pallof Press",
    muscle: "Core",
    equipment: "Cable",
    instructions:
      "Stand sideways to a cable at chest height, press the handle straight out in front of you resisting the rotational pull.",
  },
  {
    name: "Decline Sit-Up",
    muscle: "Core",
    equipment: "Bodyweight",
    instructions:
      "Lie on a decline bench with feet hooked, sit up by contracting your abs, then lower back down under control.",
  },
  {
    name: "Mountain Climber",
    muscle: "Core",
    equipment: "Bodyweight",
    instructions:
      "Start in a push-up position, rapidly alternate driving each knee toward your chest while keeping hips low.",
  },
  {
    name: "Dragon Flag",
    muscle: "Core",
    equipment: "Bodyweight",
    instructions:
      "Lie on a bench gripping behind your head, raise your entire body as one rigid unit, then lower slowly under control.",
  },

  // ═══════════════════════════════════════
  // TRAPS / FOREARMS (8)
  // ═══════════════════════════════════════
  {
    name: "Trap Bar Shrug",
    muscle: "Traps",
    equipment: "Barbell",
    instructions:
      "Stand inside a trap bar, grip the handles, shrug your shoulders straight up toward your ears, then lower slowly.",
  },
  {
    name: "Farmer Walk",
    muscle: "Forearms",
    equipment: "Dumbbell",
    instructions:
      "Hold heavy dumbbells at your sides, walk forward with a tall posture and engaged core for distance or time.",
  },
  {
    name: "Barbell Wrist Curl",
    muscle: "Forearms",
    equipment: "Barbell",
    instructions:
      "Sit with forearms resting on your thighs palms up, curl the barbell up by flexing your wrists, then lower.",
  },
  {
    name: "Reverse Wrist Curl",
    muscle: "Forearms",
    equipment: "Barbell",
    instructions:
      "Sit with forearms on your thighs palms down, extend the barbell up by raising the back of your hands, then lower.",
  },
  {
    name: "Reverse Barbell Curl",
    muscle: "Forearms",
    equipment: "Barbell",
    instructions:
      "Hold a barbell with an overhand grip, curl it up focusing on the brachioradialis and forearm extensors, then lower.",
  },
  {
    name: "Plate Pinch Hold",
    muscle: "Forearms",
    equipment: "Other",
    instructions:
      "Pinch two weight plates together smooth-side-out, hold them with your fingertips for as long as possible.",
  },
  {
    name: "Dead Hang",
    muscle: "Forearms",
    equipment: "Bodyweight",
    instructions:
      "Hang from a pull-up bar with an overhand grip, let your body relax, and hold the position for time to build grip strength.",
  },
  {
    name: "Towel Pull-Up",
    muscle: "Forearms",
    equipment: "Bodyweight",
    instructions:
      "Drape towels over a pull-up bar, grip the towel ends, and perform pull-ups to challenge your grip and forearms.",
  },

  // ═══════════════════════════════════════
  // FULL BODY (10)
  // ═══════════════════════════════════════
  {
    name: "Conventional Deadlift",
    muscle: "Full Body",
    equipment: "Barbell",
    instructions:
      "Stand with feet hip-width, grip the bar outside your knees, drive through your heels to stand up, then lower with a hip hinge.",
  },
  {
    name: "Sumo Deadlift",
    muscle: "Full Body",
    equipment: "Barbell",
    instructions:
      "Take a wide stance with toes pointed out, grip the bar between your legs, drive hips forward to stand, then lower.",
  },
  {
    name: "Power Clean",
    muscle: "Full Body",
    equipment: "Barbell",
    instructions:
      "Start with bar on the floor, explosively pull it up, catch it on your front delts in a front squat position, then stand.",
  },
  {
    name: "Hang Clean",
    muscle: "Full Body",
    equipment: "Barbell",
    instructions:
      "Start with the bar at hip level, dip and explosively pull it up, catch it on your front delts, then stand.",
  },
  {
    name: "Thruster",
    muscle: "Full Body",
    equipment: "Barbell",
    instructions:
      "Hold a barbell at shoulder level, perform a front squat, then explosively drive up and press the bar overhead in one motion.",
  },
  {
    name: "Burpee",
    muscle: "Full Body",
    equipment: "Bodyweight",
    instructions:
      "Drop to the floor into a push-up, perform the push-up, jump your feet forward, then explosively jump up with hands overhead.",
  },
  {
    name: "Turkish Get-Up",
    muscle: "Full Body",
    equipment: "Kettlebell",
    instructions:
      "Lie down holding a kettlebell overhead, stand up through a series of controlled movements while keeping the weight locked out.",
  },
  {
    name: "Man Maker",
    muscle: "Full Body",
    equipment: "Dumbbell",
    instructions:
      "Perform a push-up on dumbbells, row each dumbbell, jump to standing, curl and press them overhead. That is one rep.",
  },
  {
    name: "Clean and Press",
    muscle: "Full Body",
    equipment: "Barbell",
    instructions:
      "Clean the barbell from the floor to your shoulders, then press it overhead to full lockout before lowering back down.",
  },
  {
    name: "Dumbbell Snatch",
    muscle: "Full Body",
    equipment: "Dumbbell",
    instructions:
      "Start with a dumbbell between your feet, explosively pull it overhead in one motion while dropping into a partial squat.",
  },

  // ═══════════════════════════════════════
  // CARDIO (12)
  // ═══════════════════════════════════════
  {
    name: "Treadmill Run",
    muscle: "Cardio",
    equipment: "Machine",
    instructions:
      "Set the treadmill to your desired speed, maintain an upright posture with a natural arm swing, and run at a steady pace.",
  },
  {
    name: "Treadmill Walk (Incline)",
    muscle: "Cardio",
    equipment: "Machine",
    instructions:
      "Set the treadmill to a high incline and moderate speed, walk with a natural stride to elevate your heart rate.",
  },
  {
    name: "Stationary Bike",
    muscle: "Cardio",
    equipment: "Machine",
    instructions:
      "Adjust the seat height, pedal at a consistent cadence, and adjust resistance to maintain your target heart rate zone.",
  },
  {
    name: "Assault Bike",
    muscle: "Cardio",
    equipment: "Machine",
    instructions:
      "Pedal and push/pull the handles simultaneously, increasing effort by moving faster. Great for HIIT intervals.",
  },
  {
    name: "Rowing Machine",
    muscle: "Cardio",
    equipment: "Machine",
    instructions:
      "Push with your legs first, lean back slightly, then pull the handle to your lower chest. Reverse the sequence on the return.",
  },
  {
    name: "Elliptical",
    muscle: "Cardio",
    equipment: "Machine",
    instructions:
      "Step onto the elliptical, grip the handles, and stride in a smooth elliptical motion while maintaining good posture.",
  },
  {
    name: "Jump Rope",
    muscle: "Cardio",
    equipment: "Other",
    instructions:
      "Hold the rope handles at hip height, jump with both feet clearing the rope, using your wrists to spin it.",
  },
  {
    name: "Battle Ropes",
    muscle: "Cardio",
    equipment: "Other",
    instructions:
      "Hold the ends of heavy ropes, create waves by alternating arm slams up and down as fast as possible.",
  },
  {
    name: "Sled Push",
    muscle: "Cardio",
    equipment: "Other",
    instructions:
      "Load a sled, grip the handles low, lean in and drive forward with powerful leg strides for distance.",
  },
  {
    name: "Box Jump",
    muscle: "Cardio",
    equipment: "Other",
    instructions:
      "Stand in front of a plyo box, swing your arms and jump onto the box, land softly with bent knees, then step down.",
  },
  {
    name: "Stair Climber",
    muscle: "Cardio",
    equipment: "Machine",
    instructions:
      "Step onto the stair climber, climb at a steady pace while keeping an upright posture and not leaning on the handles.",
  },
  {
    name: "Sled Pull",
    muscle: "Cardio",
    equipment: "Other",
    instructions:
      "Attach a harness or rope to a loaded sled, walk or run backward pulling the sled toward you for distance.",
  },

  // ═══════════════════════════════════════
  // STRETCHING / MOBILITY (10)
  // ═══════════════════════════════════════
  {
    name: "Hip Flexor Stretch",
    muscle: "Stretching",
    equipment: "Bodyweight",
    instructions:
      "Kneel on one knee, push your hips forward while keeping your torso upright until you feel a stretch in the front of your hip.",
  },
  {
    name: "Hamstring Stretch",
    muscle: "Stretching",
    equipment: "Bodyweight",
    instructions:
      "Sit on the floor with one leg extended, reach toward your toes while keeping your back straight until you feel the stretch.",
  },
  {
    name: "Chest Doorway Stretch",
    muscle: "Stretching",
    equipment: "Bodyweight",
    instructions:
      "Place your forearm on a doorframe at shoulder height, step through the doorway until you feel a stretch in your chest.",
  },
  {
    name: "Lat Stretch",
    muscle: "Stretching",
    equipment: "Bodyweight",
    instructions:
      "Grab a pole or doorframe with one hand overhead, lean away from it until you feel a stretch along your side and lat.",
  },
  {
    name: "Quad Stretch",
    muscle: "Stretching",
    equipment: "Bodyweight",
    instructions:
      "Stand on one leg, grab your opposite ankle behind you, and pull your heel toward your glute until you feel a quad stretch.",
  },
  {
    name: "Calf Stretch",
    muscle: "Stretching",
    equipment: "Bodyweight",
    instructions:
      "Place one foot behind you with heel down, lean into a wall until you feel a stretch in the back of your lower leg.",
  },
  {
    name: "Shoulder Dislocate",
    muscle: "Stretching",
    equipment: "Other",
    instructions:
      "Hold a dowel or band with a wide grip, rotate it over your head and behind your back in a slow, controlled arc.",
  },
  {
    name: "Cat-Cow Stretch",
    muscle: "Stretching",
    equipment: "Bodyweight",
    instructions:
      "On hands and knees, alternate between arching your back up (cat) and dropping your belly down (cow) in a slow rhythm.",
  },
  {
    name: "90/90 Hip Stretch",
    muscle: "Stretching",
    equipment: "Bodyweight",
    instructions:
      "Sit with both legs bent at 90 degrees, one in front and one behind, lean forward over the front leg to stretch the hip.",
  },
  {
    name: "World's Greatest Stretch",
    muscle: "Stretching",
    equipment: "Bodyweight",
    instructions:
      "Lunge forward, place opposite hand on the floor, rotate the other arm to the ceiling, stretching hips, thoracic spine, and hamstrings.",
  },

  // ═══════════════════════════════════════
  // ADDITIONAL EXERCISES (to reach 200+)
  // ═══════════════════════════════════════

  // Additional Chest
  {
    name: "Floor Press",
    muscle: "Chest",
    equipment: "Barbell",
    instructions:
      "Lie on the floor with a barbell, press it up from a dead stop with elbows touching the floor between reps.",
  },
  {
    name: "Dumbbell Floor Press",
    muscle: "Chest",
    equipment: "Dumbbell",
    instructions:
      "Lie on the floor holding dumbbells, press them up from a dead stop, limiting range of motion at the bottom.",
  },

  // Additional Back
  {
    name: "Snatch-Grip Deadlift",
    muscle: "Back",
    equipment: "Barbell",
    instructions:
      "Perform a deadlift with a very wide grip, which increases upper back engagement and time under tension.",
  },
  {
    name: "Rack Pull",
    muscle: "Back",
    equipment: "Barbell",
    instructions:
      "Set the barbell on safety pins at knee height, pull it to lockout focusing on upper back and trap engagement.",
  },

  // Additional Shoulders
  {
    name: "Seated Dumbbell Lateral Raise",
    muscle: "Shoulders",
    equipment: "Dumbbell",
    instructions:
      "Sit on a bench, raise dumbbells to the sides until arms are parallel to the floor, eliminating momentum.",
  },
  {
    name: "Machine Lateral Raise",
    muscle: "Shoulders",
    equipment: "Machine",
    instructions:
      "Sit in the lateral raise machine, push the pads outward by raising your arms, then lower with control.",
  },

  // Additional Legs
  {
    name: "Kettlebell Goblet Squat",
    muscle: "Quadriceps",
    equipment: "Kettlebell",
    instructions:
      "Hold a kettlebell at your chest by the horns, squat down keeping your torso upright, then stand back up.",
  },
  {
    name: "Leg Press (Narrow Stance)",
    muscle: "Quadriceps",
    equipment: "Machine",
    instructions:
      "Place feet close together on the leg press platform to emphasize the outer quads, press up and lower slowly.",
  },
  {
    name: "Barbell Lunge",
    muscle: "Quadriceps",
    equipment: "Barbell",
    instructions:
      "Place a barbell on your upper back, step forward into a lunge, lower your back knee, then push back to standing.",
  },
  {
    name: "Lateral Lunge",
    muscle: "Quadriceps",
    equipment: "Dumbbell",
    instructions:
      "Step wide to one side, bend that knee while keeping the other leg straight, push off to return to center.",
  },

  // Additional Glutes
  {
    name: "Smith Machine Hip Thrust",
    muscle: "Glutes",
    equipment: "Machine",
    instructions:
      "Set up for hip thrusts using the Smith machine bar across your hips for easier loading and stability.",
  },
  {
    name: "Banded Glute Bridge",
    muscle: "Glutes",
    equipment: "Band",
    instructions:
      "Place a band above your knees, lie back and thrust hips up while pushing knees out against the band.",
  },

  // Additional Core
  {
    name: "Farmer Walk (Core)",
    muscle: "Core",
    equipment: "Dumbbell",
    instructions:
      "Hold heavy dumbbells at your sides and walk with an engaged core, focusing on anti-lateral flexion and stability.",
  },
  {
    name: "Suitcase Carry",
    muscle: "Core",
    equipment: "Dumbbell",
    instructions:
      "Hold a heavy dumbbell in one hand at your side, walk while keeping your torso perfectly upright and core braced.",
  },
  {
    name: "Hanging Knee Raise",
    muscle: "Core",
    equipment: "Bodyweight",
    instructions:
      "Hang from a bar, raise your knees toward your chest by flexing your abs, then lower under control.",
  },
  {
    name: "Cable Crunch",
    muscle: "Core",
    equipment: "Cable",
    instructions:
      "Kneel in front of a high cable with a rope attachment, crunch down by flexing your abs, bringing elbows toward knees.",
  },

  // Additional Full Body
  {
    name: "Trap Bar Deadlift",
    muscle: "Full Body",
    equipment: "Barbell",
    instructions:
      "Stand inside the trap bar, grip the handles, drive through your feet to stand up, then lower back down.",
  },
  {
    name: "Kettlebell Clean and Press",
    muscle: "Full Body",
    equipment: "Kettlebell",
    instructions:
      "Clean a kettlebell to the rack position, then press it overhead. Lower back to the rack and repeat.",
  },

  // Additional Arms
  {
    name: "Zottman Curl",
    muscle: "Biceps",
    equipment: "Dumbbell",
    instructions:
      "Curl dumbbells up with a supinated grip, rotate to a pronated grip at the top, then lower with palms down.",
  },
  {
    name: "Overhead Rope Extension",
    muscle: "Triceps",
    equipment: "Cable",
    instructions:
      "Face away from a high cable with a rope, start with hands behind your head, extend forward to full arm lockout.",
  },

  // Additional Cardio
  {
    name: "Kettlebell Snatch",
    muscle: "Cardio",
    equipment: "Kettlebell",
    instructions:
      "Swing a kettlebell between your legs then explosively pull it overhead in one fluid motion, locking out at the top.",
  },
  {
    name: "Bear Crawl",
    muscle: "Cardio",
    equipment: "Bodyweight",
    instructions:
      "Get on all fours with knees hovering off the ground, crawl forward by moving opposite hand and foot simultaneously.",
  },

  // Additional Stretching
  {
    name: "Pigeon Pose",
    muscle: "Stretching",
    equipment: "Bodyweight",
    instructions:
      "From a plank, bring one knee forward behind your wrist, extend the other leg back, and lower your hips to stretch the glute.",
  },
  {
    name: "Child's Pose",
    muscle: "Stretching",
    equipment: "Bodyweight",
    instructions:
      "Kneel and sit back on your heels, extend your arms forward on the floor, and relax into the stretch for your back and lats.",
  },
  {
    name: "Thoracic Spine Rotation",
    muscle: "Stretching",
    equipment: "Bodyweight",
    instructions:
      "On all fours, place one hand behind your head, rotate your upper body opening your elbow to the ceiling, then return.",
  },
  {
    name: "Banded Shoulder Stretch",
    muscle: "Stretching",
    equipment: "Band",
    instructions:
      "Hold a band overhead with both hands, slowly pull it apart and down behind your back to stretch the shoulders.",
  },
  {
    name: "Couch Stretch",
    muscle: "Stretching",
    equipment: "Bodyweight",
    instructions:
      "Place one knee on the ground with foot against a wall behind you, lunge the other foot forward to deeply stretch the hip flexor and quad.",
  },
  {
    name: "Foam Roll (IT Band)",
    muscle: "Stretching",
    equipment: "Other",
    instructions:
      "Lie on your side on a foam roller positioned under your outer thigh, roll from hip to knee to release tension.",
  },
  {
    name: "Foam Roll (Upper Back)",
    muscle: "Stretching",
    equipment: "Other",
    instructions:
      "Lie with a foam roller under your upper back, cross arms over chest, and roll from mid-back to upper back.",
  },
];

async function main() {
  console.log(`Seeding ${exercises.length} exercises...`);

  let created = 0;
  let updated = 0;

  for (const exercise of exercises) {
    const existing = await prisma.exercise.findFirst({
      where: { name: exercise.name, isCustom: false },
    });

    if (existing) {
      await prisma.exercise.update({
        where: { id: existing.id },
        data: {
          muscle: exercise.muscle,
          equipment: exercise.equipment,
          instructions: exercise.instructions,
        },
      });
      updated++;
    } else {
      await prisma.exercise.create({
        data: {
          name: exercise.name,
          muscle: exercise.muscle,
          equipment: exercise.equipment,
          instructions: exercise.instructions,
          isCustom: false,
          gifUrl: null,
          videoUrl: null,
        },
      });
      created++;
    }
  }

  console.log(`Seeding complete: ${created} created, ${updated} updated (${exercises.length} total).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
