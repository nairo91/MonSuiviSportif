import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookieName, getUserIdFromSession } from "@/lib/server/auth";
import { isAdminEmail } from "@/lib/server/admin";
import { getUserById } from "@/lib/server/users";
import { uid } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const client = new Anthropic();

const PLAN_TOOL: Anthropic.Tool = {
  name: "create_training_plan",
  description: "Creates a structured multi-week progressive training plan based on user performance and goals.",
  input_schema: {
    type: "object" as const,
    required: ["coachSummary", "progressionStrategy", "workouts"],
    properties: {
      coachSummary: {
        type: "string",
        description: "Brief explanation of the strategy, what the user should expect, and key focuses.",
      },
      progressionStrategy: {
        type: "string",
        description: "How weights, volume, and intensity will progress week over week. Mention deload weeks if applicable.",
      },
      workouts: {
        type: "array",
        description: "All planned workout sessions across all weeks.",
        items: {
          type: "object",
          required: ["weekNumber", "sessionNumber", "label", "focusDescription", "exercises", "estimatedDurationMinutes"],
          properties: {
            weekNumber: { type: "integer", description: "Week number starting at 1." },
            sessionNumber: { type: "integer", description: "Session number within that week (1, 2, 3...)." },
            label: { type: "string", description: "Short session name, e.g. 'Push A', 'Leg Day', 'Upper Body'." },
            focusDescription: { type: "string", description: "One sentence describing the session focus and intent." },
            estimatedDurationMinutes: { type: "integer", description: "Estimated duration in minutes." },
            exercises: {
              type: "array",
              items: {
                type: "object",
                required: ["exerciseId", "exerciseName", "sets"],
                properties: {
                  exerciseId: { type: "string", description: "Must match exactly one of the exerciseId values provided in the user context." },
                  exerciseName: { type: "string", description: "Display name of the exercise." },
                  notes: { type: "string", description: "Optional cue or coaching tip for this exercise." },
                  sets: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["reps", "weight"],
                      properties: {
                        reps: { type: "integer", description: "Target reps." },
                        weight: { type: "number", description: "Suggested weight in the user's unit system." },
                        rpe: { type: "number", description: "Target RPE between 6 and 10." },
                        notes: { type: "string", description: "Optional note for this set." },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

interface UserStatInput {
  exerciseId: string;
  name: string;
  category: string;
  bestWeight: number;
  lastWeight: number;
  lastReps: number;
  totalSessions: number;
}

interface PlanRequestBody {
  goalDescription: string;
  durationWeeks: number;
  sessionsPerWeek: number;
  selectedExerciseIds: string[];
  userStats: UserStatInput[];
  units: string;
  profile: { name: string; trainingFocus: string; weeklyTarget: number };
}

export async function POST(request: NextRequest) {
  const userId = getUserIdFromSession(request.cookies.get(getSessionCookieName())?.value);
  if (!userId) {
    return NextResponse.json({ error: "Accès non autorisé." }, { status: 401 });
  }

  const user = await getUserById(userId);
  if (!isAdminEmail(user?.email)) {
    return NextResponse.json(
      { error: "La génération de plan IA est réservée aux administrateurs." },
      { status: 403 },
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY n'est pas configurée sur le serveur." },
      { status: 503 },
    );
  }

  let body: PlanRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const { goalDescription, durationWeeks, sessionsPerWeek, userStats, units, profile } = body;

  if (!goalDescription?.trim() || !durationWeeks || !sessionsPerWeek || !userStats?.length) {
    return NextResponse.json({ error: "Paramètres manquants." }, { status: 400 });
  }

  const statsText = userStats
    .map(
      (s) =>
        `  - ${s.name} (${s.category}) [id: ${s.exerciseId}]: record ${s.bestWeight}${units}, dernière séance ${s.lastWeight}${units} × ${s.lastReps} reps, ${s.totalSessions} séances au total`,
    )
    .join("\n");

  const userMessage = `**Profil athlète**: ${profile.name || "Utilisateur"}, focus: ${profile.trainingFocus || "Musculation générale"}
**Objectif**: ${goalDescription}
**Durée**: ${durationWeeks} semaines, ${sessionsPerWeek} séances/semaine
**Unité de poids**: ${units}

**Performances actuelles** (utilise exactement ces exerciseId dans le plan):
${statsText}

Génère un plan d'entraînement complet, progressif sur ${durationWeeks} semaines avec ${sessionsPerWeek} séances par semaine. Les poids suggérés doivent partir des performances actuelles et progresser graduellement.`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: [
        {
          type: "text",
          text: `Tu es un coach sportif expert en musculation et en périodisation. Tu crées des plans d'entraînement personnalisés, progressifs et réalistes.

Principes à respecter:
- Les poids de départ doivent être légèrement en dessous du record pour assurer la qualité d'exécution
- Progression linéaire ou ondulante selon le niveau (débutant = linéaire, avancé = ondulante)
- Intégrer une semaine de décharge (volume -30%, intensité maintenue) toutes les 4 semaines
- Respecter les groupes musculaires: ne pas solliciter le même groupe deux jours consécutifs
- Adapter le volume selon la capacité de récupération (${sessionsPerWeek} séances/semaine)
- Utiliser uniquement les exercices fournis par l'utilisateur (respecter les exerciseId exactement)`,
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: [PLAN_TOOL],
      tool_choice: { type: "tool", name: "create_training_plan" },
      messages: [{ role: "user", content: userMessage }],
    });

    const toolUseBlock = response.content.find((block): block is Anthropic.ToolUseBlock => block.type === "tool_use");

    if (!toolUseBlock) {
      return NextResponse.json({ error: "Le modèle n'a pas retourné de plan structuré." }, { status: 500 });
    }

    const planData = toolUseBlock.input as {
      coachSummary: string;
      progressionStrategy: string;
      workouts: Array<{
        weekNumber: number;
        sessionNumber: number;
        label: string;
        focusDescription: string;
        estimatedDurationMinutes: number;
        exercises: Array<{
          exerciseId: string;
          exerciseName: string;
          notes?: string;
          sets: Array<{ reps: number; weight: number; rpe?: number; notes?: string }>;
        }>;
      }>;
    };

    const plan = {
      id: uid("plan"),
      createdAt: new Date().toISOString(),
      goalDescription,
      durationWeeks,
      coachSummary: planData.coachSummary,
      progressionStrategy: planData.progressionStrategy,
      workouts: planData.workouts.map((w) => ({
        id: uid("pw"),
        weekNumber: w.weekNumber,
        sessionNumber: w.sessionNumber,
        label: w.label,
        focusDescription: w.focusDescription,
        estimatedDurationMinutes: w.estimatedDurationMinutes,
        exercises: w.exercises,
      })),
    };

    return NextResponse.json({ plan });
  } catch (error) {
    console.error("Claude API error", error);
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: `Erreur de l'API Claude: ${message}` }, { status: 500 });
  }
}
