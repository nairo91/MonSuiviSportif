import { NextRequest, NextResponse } from "next/server";
import { createEmptyAppData, normalizePersistedAppData } from "@/lib/default-data";
import { getSessionCookieName, getUserIdFromSession } from "@/lib/server/auth";
import {
  AppStateConflictError,
  backendConfigured,
  loadAppState,
  saveAppState,
} from "@/lib/server/app-state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorizedResponse() {
  return NextResponse.json(
    {
      error: "Accès non autorisé.",
      backendConfigured: backendConfigured(),
    },
    { status: 401 },
  );
}

function getAuthenticatedUserId(request: NextRequest): string | null {
  return getUserIdFromSession(request.cookies.get(getSessionCookieName())?.value);
}

export async function GET(request: NextRequest) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) return unauthorizedResponse();

  try {
    const snapshot = await loadAppState(userId);
    return NextResponse.json({
      data: snapshot.data,
      revision: snapshot.revision,
      backendConfigured: backendConfigured(),
      userId,
    });
  } catch (error) {
    console.error("GET /api/state failed", error);
    return NextResponse.json(
      {
        error: "Impossible de charger les données serveur.",
        data: createEmptyAppData(),
        backendConfigured: backendConfigured(),
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const userId = getAuthenticatedUserId(request);
  if (!userId) return unauthorizedResponse();

  try {
    const body = await request.json();
    const revision = typeof body?.revision === "number" ? body.revision : null;

    if (revision === null) {
      return NextResponse.json(
        {
          error: "Révision serveur manquante.",
          backendConfigured: backendConfigured(),
        },
        { status: 400 },
      );
    }

    const normalized = normalizePersistedAppData(body?.data);
    const snapshot = await saveAppState(normalized, userId, revision);

    return NextResponse.json({
      data: snapshot.data,
      revision: snapshot.revision,
      backendConfigured: backendConfigured(),
    });
  } catch (error) {
    if (error instanceof AppStateConflictError) {
      return NextResponse.json(
        {
          error: "Une version plus récente existe déjà. Données serveur rechargées.",
          data: error.latest.data,
          revision: error.latest.revision,
          backendConfigured: backendConfigured(),
        },
        { status: 409 },
      );
    }

    console.error("PUT /api/state failed", error);
    return NextResponse.json(
      {
        error: "Impossible d'enregistrer les données serveur.",
        backendConfigured: backendConfigured(),
      },
      { status: 500 },
    );
  }
}
