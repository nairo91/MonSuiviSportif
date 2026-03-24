"use client";

import { ExerciseForm } from "@/components/forms/exercise-form";
import { PageHeader } from "@/components/page-header";

export default function NewExercisePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Custom Builder"
        title="Nouvel exercice"
        description="Ajoutez un mouvement personnalise avec categorie, icone et notes."
      />
      <ExerciseForm mode="create" />
    </div>
  );
}
