import { cleanContent } from "./cleanContent";
import type { ParsedPersona, ParsedPersonaAnalysis } from "@/types/delegation";

/**
 * Parses structured persona JSON and market analysis out of
 * persona generator results. Handles code-block-wrapped JSON,
 * bare JSON objects, and flexible field naming conventions.
 */
export function parsePersonaData(raw?: string): ParsedPersonaAnalysis | null {
  if (!raw) return null;
  const cleaned = cleanContent(raw);

  let jsonString: string | null = null;
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch) {
    jsonString = codeBlockMatch[1];
  } else {
    const braceMatch = cleaned.match(/\{[\s\S]*?"personas"[\s\S]*?\}/i);
    if (braceMatch) {
      jsonString = braceMatch[0];
    } else if (cleaned.trim().startsWith("{") && cleaned.trim().endsWith("}")) {
      jsonString = cleaned.trim();
    }
  }

  if (!jsonString) return null;

  try {
    const data = JSON.parse(jsonString);
    const rawPersonas = data.personas || data.Personas || data.PERSONAS;
    if (!Array.isArray(rawPersonas) || rawPersonas.length === 0) {
      return null;
    }

    const personas: ParsedPersona[] = rawPersonas.map((p: any, idx: number) => {
      let weight = p.weightage ?? p.Weightage ?? p.weight ?? p.Weight ?? 0;
      if (typeof weight === "string") {
        weight = parseFloat(weight.replace("%", "").trim()) || 0;
      }
      return {
        id: p.id || p.Id || `persona-${idx + 1}`,
        name: p.name || p.Name || `Persona ${idx + 1}`,
        role: p.role || p.Role || "Target Stakeholder",
        demographics: p.demographics || p.Demographics || "",
        goals: p.goals || p.Goals || "",
        painPoints: p.painPoints || p.PainPoints || p.pain_points || "",
        keyNeeds: p.keyNeeds || p.KeyNeeds || p.key_needs || "",
        weightage: weight,
        weightageRationale: p.weightageRationale || p.WeightageRationale || p.weightage_rationale || "",
      };
    });

    let summary = data.summary || data.Summary || "";
    if (!summary && codeBlockMatch && codeBlockMatch.index) {
      const preceding = cleaned.substring(0, codeBlockMatch.index).trim();
      summary = preceding.replace(/^#+\s*(Executive Summary|Target Market Analysis)\s*/i, "").trim();
    }

    return {
      idea: data.idea || data.Idea || "",
      summary,
      personas,
      totalWeightage:
        data.totalWeightage ||
        data.TotalWeightage ||
        personas.reduce((acc, p) => acc + (p.weightage || 0), 0),
      recommendation: data.recommendation || data.Recommendation || "",
    };
  } catch {
    return null;
  }
}
