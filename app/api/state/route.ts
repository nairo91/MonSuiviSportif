import { NextRequest, NextResponse } from "next/server";
import { createEmptyAppData, normalizePersistedAppData } from "@/lib/default-data";
import { authConfigured, getSessionCookieName, validateSessionCookie } from "@/lib/server/auth";
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
      error: "Acces non autorise.",
      backendConfigured: backendConfigured(),
    },
    { status: 401 },
  );
}

function misconfiguredResponse() {
  return NextResponse.json(
    {
      error: "APP_ACCESS_CODE doit etre configure cote serveur.",
      backendConfigured: backendConfigured(),
    },
    { status: 503 },
  );
}

function isAuthorized(request: NextRequest) {
  return validateSessionCookie(request.cookies.get(getSessionCookieName())?.value);
}

export async function GET(request: NextRequest) {
  if (!authConfigured()) {
    return misconfiguredResponse();
  }

  if (!isAuthorized(request)) {
    return unauthorizedResponse();
  }

  try {
    const snapshot = await loadAppState();
    return NextResponse.json({
      data: snapshot.data,
      revision: snapshot.revision,
      backendConfigured: backendConfigured(),
    });
  } catch (error) {
    console.error("GET /api/state failed", error);
    return NextResponse.json(
      {
        error: "Impossible de charger les donnees serveur.",
        data: createEmptyAppData(),
        backendConfigured: backendConfigured(),
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  if (!authConfigured()) {
    return misconfiguredResponse();
  }

  if (!isAuthorized(request)) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const revision = typeof body?.revision === "number" ? body.revision : null;

    if (revision === null) {
      return NextResponse.json(
        {
          error: "Revision serveur manquante.",
          backendConfigured: backendConfigured(),
        },
        { status: 400 },
      );
    }

    const normalized = normalizePersistedAppData(body?.data);
    const snapshot = await saveAppState(normalized, revision);

    return NextResponse.json({
      data: snapshot.data,
      revision: snapshot.revision,
      backendConfigured: backendConfigured(),
    });
  } catch (error) {
    if (error instanceof AppStateConflictError) {
      return NextResponse.json(
        {
          error: "Une version plus recente existe deja. Donnees serveur rechargees.",
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
        error: "Impossible d'enregistrer les donnees serveur.",
        backendConfigured: backendConfigured(),
      },
      { status: 500 },
    );
  }
}
