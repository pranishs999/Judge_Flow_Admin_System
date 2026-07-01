"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import type { Criterion } from "@/lib/database.types";

interface Props {
  projectId: string;
  eventId: string;
  criteria: Pick<Criterion, "id" | "name" | "description" | "min_marks" | "max_marks" | "sort_order">[];
  scoredCriteria: Set<string>;
}

export default function ScoringInterface({ projectId, eventId, criteria, scoredCriteria }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const criterion = criteria[currentIndex];
  const isScored = criterion ? scoredCriteria.has(criterion.id) : false;
  const isComplete = criteria.every((c) => scoredCriteria.has(c.id));
  const progress = criteria.length > 0 ? (scoredCriteria.size / criteria.length) * 100 : 0;

  async function submitScore() {
    if (!criterion || isScored) return;
    const value = marks[criterion.id];
    if (!value) {
      toast.error("Please enter a score");
      return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < criterion.min_marks || numValue > criterion.max_marks) {
      toast.error(`Score must be between ${criterion.min_marks} and ${criterion.max_marks}`);
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/scores/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: eventId,
        project_id: projectId,
        criterion_id: criterion.id,
        marks: numValue,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      toast.success("Score submitted");
      scoredCriteria.add(criterion.id);
      if (currentIndex < criteria.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    } else {
      toast.error(data.error ?? "Failed to submit score");
    }
    setSubmitting(false);
  }

  if (isComplete) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-lg font-medium text-green-600">All criteria scored!</p>
        <p className="mt-1 text-sm text-muted-foreground">This project has been fully evaluated.</p>
      </div>
    );
  }

  if (!criterion) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        No criteria defined for this event.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Progress</span>
          <span>{scoredCriteria.size} / {criteria.length}</span>
        </div>
        <Progress value={progress} />
      </div>

      <div className="rounded-lg border p-6">
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Criterion {currentIndex + 1} of {criteria.length}
          </p>
          <h2 className="mt-1 text-xl font-semibold">{criterion.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{criterion.description}</p>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Score range: {criterion.min_marks} – {criterion.max_marks}
            </p>
            <input
              type="number"
              step="0.01"
              min={criterion.min_marks}
              max={criterion.max_marks}
              value={marks[criterion.id] ?? ""}
              onChange={(e) => setMarks((m) => ({ ...m, [criterion.id]: e.target.value }))}
              disabled={isScored}
              className="mt-2 flex h-12 w-full rounded-md border border-input bg-transparent px-4 text-lg shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
              placeholder="Enter score..."
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
            >
              Previous
            </Button>
            {isScored ? (
              <Button variant="outline" disabled className="flex-1">
                Already Scored
              </Button>
            ) : (
              <Button onClick={submitScore} disabled={submitting} className="flex-1">
                {submitting ? "Submitting..." : "Submit Score"}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setCurrentIndex(Math.min(criteria.length - 1, currentIndex + 1))}
              disabled={currentIndex === criteria.length - 1}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
