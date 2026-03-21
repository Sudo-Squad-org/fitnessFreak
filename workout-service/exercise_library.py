"""
Exercise library: stable IDs → name, muscle_group, how_to description.
Used by _build_weekly_plan() to generate structured exercise objects.
"""

EXERCISES = {
    # ── Lower Body ─────────────────────────────────────────────────────────────
    "ex_sq_01": {
        "name": "Barbell Back Squat",
        "muscle_group": "Quads, Glutes",
        "how_to": "Stand with bar on upper traps, feet shoulder-width apart. Descend until thighs are parallel to the floor, then drive through heels to stand.",
    },
    "ex_goblet_01": {
        "name": "Goblet Squat",
        "muscle_group": "Quads, Glutes",
        "how_to": "Hold a dumbbell vertically at chest height. Squat deep keeping elbows inside knees, then press through heels to stand.",
    },
    "ex_rdl_01": {
        "name": "Romanian Deadlift",
        "muscle_group": "Hamstrings, Glutes",
        "how_to": "Hold bar at hip height, hinge at hips pushing them back, lowering bar along shins until a hamstring stretch is felt, then return to standing.",
    },
    "ex_legpress_01": {
        "name": "Leg Press",
        "muscle_group": "Quads",
        "how_to": "Place feet shoulder-width on the platform, lower until knees reach 90 degrees, then press back without locking knees at the top.",
    },
    "ex_hipthrust_01": {
        "name": "Hip Thrust",
        "muscle_group": "Glutes",
        "how_to": "Rest upper back on a bench with bar across hips. Drive hips upward until body forms a straight line from knees to shoulders, squeezing glutes at the top.",
    },
    "ex_lunge_01": {
        "name": "Walking Lunge",
        "muscle_group": "Quads, Glutes",
        "how_to": "Step forward and lower your back knee toward the floor until both knees are at 90 degrees, then step the rear foot forward to repeat.",
    },
    "ex_legcurl_01": {
        "name": "Leg Curl",
        "muscle_group": "Hamstrings",
        "how_to": "Lie face down on the machine, hook ankles under the pad, and curl heels toward your glutes by contracting the hamstrings, then slowly lower.",
    },
    "ex_legext_01": {
        "name": "Leg Extension",
        "muscle_group": "Quads",
        "how_to": "Sit in the machine with shins behind the pad, straighten legs by contracting the quads, hold briefly, then slowly lower.",
    },
    "ex_calfrise_01": {
        "name": "Standing Calf Raise",
        "muscle_group": "Calves",
        "how_to": "Stand on the edge of a step with heels hanging off. Rise onto your toes as high as possible, hold for one second, then slowly lower below step level.",
    },
    "ex_stepup_01": {
        "name": "Step-Up",
        "muscle_group": "Quads, Glutes",
        "how_to": "Place one foot on a box, drive through that heel to step up, bring the trailing foot up, then step back down with control.",
    },
    "ex_splitsq_01": {
        "name": "Bulgarian Split Squat",
        "muscle_group": "Quads, Glutes",
        "how_to": "Rear foot elevated on a bench, lower your back knee toward the floor keeping your front shin vertical, then drive through the front heel to stand.",
    },
    # ── Push ───────────────────────────────────────────────────────────────────
    "ex_bench_01": {
        "name": "Barbell Bench Press",
        "muscle_group": "Chest, Triceps",
        "how_to": "Lie on bench, grip bar slightly wider than shoulders, lower to lower-chest under control, then press back to full arm extension.",
    },
    "ex_dbpress_01": {
        "name": "Dumbbell Chest Press",
        "muscle_group": "Chest, Triceps",
        "how_to": "Lie on bench holding dumbbells at chest level with palms forward. Press both up until arms are extended, then slowly lower with control.",
    },
    "ex_incdbpress_01": {
        "name": "Incline Dumbbell Press",
        "muscle_group": "Upper Chest",
        "how_to": "Set bench to 30–45 degrees. Press dumbbells from shoulder level upward, then lower slowly to chest height.",
    },
    "ex_ohpress_01": {
        "name": "Overhead Press",
        "muscle_group": "Shoulders, Triceps",
        "how_to": "Stand holding bar at shoulder height. Press straight up until arms are fully extended overhead, then lower with control back to shoulders.",
    },
    "ex_dbohpress_01": {
        "name": "Dumbbell Shoulder Press",
        "muscle_group": "Shoulders",
        "how_to": "Sit or stand with dumbbells at shoulder height, palms forward. Press upward until arms are extended, then lower slowly back to start.",
    },
    "ex_lateraise_01": {
        "name": "Lateral Raise",
        "muscle_group": "Shoulders",
        "how_to": "Hold dumbbells at sides, raise arms out laterally to shoulder height with a slight bend in the elbows, then lower slowly in 2–3 seconds.",
    },
    "ex_pushup_01": {
        "name": "Push-Up",
        "muscle_group": "Chest, Triceps",
        "how_to": "Start in a plank with hands just outside shoulder-width. Lower chest to just above the floor keeping a rigid body line, then push back up.",
    },
    "ex_dips_01": {
        "name": "Tricep Dips",
        "muscle_group": "Triceps, Chest",
        "how_to": "Grip parallel bars, lower body by bending elbows to about 90 degrees, then press back up to straight arms without locking out.",
    },
    "ex_tricpush_01": {
        "name": "Tricep Pushdown",
        "muscle_group": "Triceps",
        "how_to": "Attach a rope or bar to a high cable, pull down by extending the elbows fully, keeping upper arms pinned to your sides, then slowly return.",
    },
    "ex_cablefly_01": {
        "name": "Cable Fly",
        "muscle_group": "Chest",
        "how_to": "Set cables at shoulder height, take one handle in each hand, and bring them together in front of your chest with a slight elbow bend throughout.",
    },
    # ── Pull ───────────────────────────────────────────────────────────────────
    "ex_deadlift_01": {
        "name": "Conventional Deadlift",
        "muscle_group": "Back, Hamstrings",
        "how_to": "Stand with bar over mid-foot, grip just outside legs, brace core, then lift by extending hips and knees simultaneously until standing tall.",
    },
    "ex_pullup_01": {
        "name": "Pull-Up",
        "muscle_group": "Back, Biceps",
        "how_to": "Hang from bar with palms away, pull elbows toward hips to bring chin above bar, then lower slowly until arms are fully extended.",
    },
    "ex_latpull_01": {
        "name": "Lat Pulldown",
        "muscle_group": "Back",
        "how_to": "Grip bar wider than shoulder-width, lean back slightly, pull bar to upper chest by driving elbows down and back, then control the weight back up.",
    },
    "ex_dbrow_01": {
        "name": "Dumbbell Row",
        "muscle_group": "Back",
        "how_to": "Place one hand and knee on a bench for support, hold a dumbbell in the other hand, and pull it toward your hip by retracting the shoulder blade.",
    },
    "ex_bbrow_01": {
        "name": "Barbell Row",
        "muscle_group": "Back",
        "how_to": "Hinge forward to about 45 degrees, grip bar overhand, and pull it into your lower abdomen by driving elbows behind you, then lower with control.",
    },
    "ex_cablerow_01": {
        "name": "Seated Cable Row",
        "muscle_group": "Back",
        "how_to": "Sit with knees slightly bent, pull the handle to your lower abdomen by squeezing shoulder blades together, then extend arms fully in a controlled motion.",
    },
    "ex_facepull_01": {
        "name": "Face Pull",
        "muscle_group": "Rear Delts, Traps",
        "how_to": "Set cable at face height, pull the rope toward your face with elbows flaring out wide and hands ending beside your ears, then slowly return.",
    },
    "ex_bpcurl_01": {
        "name": "Barbell Curl",
        "muscle_group": "Biceps",
        "how_to": "Hold bar with underhand grip, keep upper arms pinned to sides, curl bar to shoulder height by contracting biceps, then lower in 2 seconds.",
    },
    "ex_hammcurl_01": {
        "name": "Hammer Curl",
        "muscle_group": "Biceps",
        "how_to": "Hold dumbbells with neutral grip (palms facing each other), curl upward without rotating the wrist, then lower slowly.",
    },
    # ── Core ───────────────────────────────────────────────────────────────────
    "ex_plank_01": {
        "name": "Plank",
        "muscle_group": "Core",
        "how_to": "Hold a push-up position resting on forearms, keeping hips level with a straight line from head to heels. Breathe steadily and avoid letting hips sag.",
    },
    "ex_deadbug_01": {
        "name": "Dead Bug",
        "muscle_group": "Core",
        "how_to": "Lie on your back, arms extended toward ceiling, hips at 90 degrees. Slowly lower opposite arm and leg toward the floor while pressing the lower back into the ground.",
    },
    "ex_biccrun_01": {
        "name": "Bicycle Crunch",
        "muscle_group": "Core",
        "how_to": "Lie on back, hands behind head, alternate bringing elbow to opposite knee while extending the other leg, rotating the torso with each rep.",
    },
    "ex_mtclimb_01": {
        "name": "Mountain Climbers",
        "muscle_group": "Core, Cardio",
        "how_to": "Start in a high plank, drive one knee toward the chest, then quickly switch legs in a running motion while keeping hips low and back flat.",
    },
    "ex_legraise_01": {
        "name": "Leg Raise",
        "muscle_group": "Core",
        "how_to": "Lie on your back with legs straight. Keeping lower back pressed into the floor, raise legs to 90 degrees, then lower them slowly without touching the ground.",
    },
    # ── Cardio ─────────────────────────────────────────────────────────────────
    "ex_brwalk_01": {
        "name": "Brisk Walk",
        "muscle_group": "Cardio",
        "how_to": "Walk at a pace where you feel slightly breathless but can still hold a conversation. Maintain an upright posture with arms swinging naturally.",
    },
    "ex_jjack_01": {
        "name": "Jumping Jacks",
        "muscle_group": "Cardio",
        "how_to": "Start standing, jump to spread feet wide while raising arms overhead, then jump back to start position. Keep a light, controlled bounce.",
    },
    "ex_jumpskip_01": {
        "name": "Jump Rope / Skip",
        "muscle_group": "Cardio, Calves",
        "how_to": "Jump lightly on the balls of your feet, turning the rope with wrists (not arms). Keep jumps small and land softly to protect your joints.",
    },
    "ex_glbridge_01": {
        "name": "Glute Bridge",
        "muscle_group": "Glutes, Core",
        "how_to": "Lie on your back, knees bent and feet flat. Drive hips upward by squeezing glutes until body forms a straight line from knees to shoulders, then lower.",
    },
}
