"use client";

import { Pencil } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { ExerciseForm } from "@/components/forms/exercise-form";
import { PageHeader } from "@/components/page-header";
import { useAppStore } from "@/lib/store";

export default function EditExercisePage() {
  const router = useRouter();
  const params = useParams<{ exerciseId: string }>();
  const exercise = useAppStore((state) =>
    state.exercises.find((item) => item.id === params.exerciseId),
  );

  if (!exercise) {
    return (
      <EmptyState
        icon={Pencil}
        title="Exercice introuvable"
        description="Impossible de modifier un exercice inexistant."
        actionLabel="Retour exercices"
        onAction={() => router.push("/exercises")}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Edit"
        title={`Modifier ${exercise.name}`}
        description="Ajustez la categorie, l'icone ou vos notes sans perdre l'historique."
      />
      <ExerciseForm mode="edit" exercise={exercise} />
    </div>
  );
}
