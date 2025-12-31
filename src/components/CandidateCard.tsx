import { useState } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import type { FlashcardCandidateViewItem } from "@/lib/store/generation-store";

const FRONT_MAX_LENGTH = 200;
const BACK_MAX_LENGTH = 500;

interface CandidateCardProps {
  candidate: FlashcardCandidateViewItem;
  onUpdate: (id: string, updates: { front: string; back: string }) => void;
  onRemove: (id: string) => void;
}

/**
 * Represents a single flashcard candidate with view and edit modes.
 * Supports editing front/back text and rejecting the candidate.
 */
export function CandidateCard({ candidate, onUpdate, onRemove }: CandidateCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editFront, setEditFront] = useState(candidate.front);
  const [editBack, setEditBack] = useState(candidate.back);

  const isEdited = candidate.source === "ai-edited";

  const handleEdit = () => {
    setEditFront(candidate.front);
    setEditBack(candidate.back);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditFront(candidate.front);
    setEditBack(candidate.back);
    setIsEditing(false);
  };

  const handleSave = () => {
    if (!isSaveValid) return;

    onUpdate(candidate.id, {
      front: editFront.trim(),
      back: editBack.trim(),
    });
    setIsEditing(false);
  };

  const handleReject = () => {
    onRemove(candidate.id);
  };

  const isSaveValid =
    editFront.trim().length > 0 &&
    editFront.trim().length <= FRONT_MAX_LENGTH &&
    editBack.trim().length > 0 &&
    editBack.trim().length <= BACK_MAX_LENGTH;

  return (
    <Card className="relative">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">Flashcard</h3>
          {isEdited && (
            <Badge variant="secondary" className="text-xs">
              Edited
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <Button variant="ghost" size="icon" onClick={handleEdit} aria-label="Edit flashcard">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReject}
                aria-label="Reject flashcard"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSave}
                disabled={!isSaveValid}
                aria-label="Save changes"
                className="text-green-600 hover:text-green-700 dark:text-green-400"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleCancel} aria-label="Cancel editing">
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isEditing ? (
          <>
            <div className="space-y-2">
              <div className="text-sm font-medium">Front</div>
              <p className="rounded-md bg-muted p-3 text-sm">{candidate.front}</p>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Back</div>
              <p className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">{candidate.back}</p>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor={`front-${candidate.id}`} className="text-sm font-medium">
                  Front
                </label>
                <span
                  className={`text-xs ${
                    editFront.trim().length > FRONT_MAX_LENGTH ? "text-destructive" : "text-muted-foreground"
                  }`}
                >
                  {editFront.trim().length} / {FRONT_MAX_LENGTH}
                </span>
              </div>
              <Textarea
                id={`front-${candidate.id}`}
                value={editFront}
                onChange={(e) => setEditFront(e.target.value)}
                className="min-h-[80px] resize-y"
                placeholder="Enter front side text..."
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor={`back-${candidate.id}`} className="text-sm font-medium">
                  Back
                </label>
                <span
                  className={`text-xs ${
                    editBack.trim().length > BACK_MAX_LENGTH ? "text-destructive" : "text-muted-foreground"
                  }`}
                >
                  {editBack.trim().length} / {BACK_MAX_LENGTH}
                </span>
              </div>
              <Textarea
                id={`back-${candidate.id}`}
                value={editBack}
                onChange={(e) => setEditBack(e.target.value)}
                className="min-h-[120px] resize-y"
                placeholder="Enter back side text..."
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
