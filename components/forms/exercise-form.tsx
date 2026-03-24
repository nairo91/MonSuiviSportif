"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CATEGORY_ORDER, ICON_OPTIONS } from "@/lib/constants";
import { Exercise } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ExerciseIcon } from "@/components/exercise-icon";

export function ExerciseForm({
  mode,
  exercise,
}: {
  mode: "create" | "edit";
  exercise?: Exercise;
}) {
  const router = useRouter();
  const addExercise = useAppStore((state) => state.addExercise);
  const updateExercise = useAppStore((state) => state.updateExercise);

  const [name, setName] = useState(exercise?.name ?? "");
  const [category, setCategory] = useState<Exercise["category"]>(exercise?.category ?? "Pectoraux");
  const [subcategory, setSubcategory] = useState(exercise?.subcategory ?? "");
  const [icon, setIcon] = useState<Exercise["icon"]>(exercise?.icon ?? "dumbbell");
  const [notes, setNotes] = useState(exercise?.notes ?? "");

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Ajoutez au moins un nom d'exercice.");
      return;
    }

    const payload = {
      name: name.trim(),
      category,
      subcategory: subcategory.trim(),
      icon,
      notes: notes.trim(),
    };

    if (mode === "create") {
      const exerciseId = addExercise(payload);
      toast.success("Exercice ajoute a votre bibliotheque.");
      router.push(`/exercises/${exerciseId}`);
      return;
    }

    if (!exercise) return;
    updateExercise(exercise.id, payload);
    toast.success("Exercice mis a jour.");
    router.push(`/exercises/${exercise.id}`);
  };

  return (
    <div className="space-y-5">
      <div className="glass-card p-5">
        <div className="flex items-center gap-4">
          <ExerciseIcon icon={icon} category={category} className="size-14 rounded-[20px]" />
          <div>
            <p className="text-sm text-muted-foreground">Apercu</p>
            <p className="font-display text-2xl font-semibold">{name || "Nouvel exercice"}</p>
            <p className="text-sm text-muted-foreground">{category}</p>
          </div>
        </div>
      </div>

      <div className="soft-card space-y-4 p-5">
        <div className="space-y-2">
          <Label htmlFor="exercise-name">Nom</Label>
          <Input
            id="exercise-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex: Front squat"
          />
        </div>

        <div className="space-y-2">
          <Label>Categorie musculaire</Label>
          <Select value={category} onValueChange={(value) => setCategory(value as Exercise["category"])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_ORDER.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="exercise-subcategory">Sous-categorie</Label>
          <Input
            id="exercise-subcategory"
            value={subcategory}
            onChange={(event) => setSubcategory(event.target.value)}
            placeholder="Ex: Force verticale"
          />
        </div>

        <div className="space-y-2">
          <Label>Icone</Label>
          <Select value={icon} onValueChange={(value) => setIcon(value as Exercise["icon"])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ICON_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="exercise-notes">Notes</Label>
          <Textarea
            id="exercise-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Consignes techniques, variantes preferees, rep range..."
          />
        </div>
      </div>

      <Button size="lg" className="w-full" onClick={handleSubmit}>
        {mode === "create" ? "Ajouter l'exercice" : "Enregistrer les modifications"}
      </Button>
    </div>
  );
}
