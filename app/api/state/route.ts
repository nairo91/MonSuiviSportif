import { NextResponse } from "next/server";
import { createEmptyAppData, normalizePersistedAppData } from "@/lib/default-data";
import { backendConfigured, loadAppState, saveAppState } from "@/lib/server/app-state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await loadAppState();
    return NextResponse.json({
      data,
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

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const normalized = normalizePersistedAppData(body);
    const data = await saveAppState(normalized);

    return NextResponse.json({
      data,
      backendConfigured: backendConfigured(),
    });
  } catch (error) {
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
