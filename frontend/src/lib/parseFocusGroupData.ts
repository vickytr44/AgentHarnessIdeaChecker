import { cleanContent } from "./cleanContent";
import type {
  ParsedFocusGroupEvaluation,
  ParsedTranscriptItem,
  ParsedFocusGroupAnalysis,
} from "@/types/delegation";

/**
 * Parses structured focus group analysis from markdown output.
 * Extracts: overall viability index, persona score breakdown table,
 * strategic synthesis sections, and round-by-round transcript quotes.
 */
export function parseFocusGroupData(raw?: string): ParsedFocusGroupAnalysis | null {
  if (!raw) return null;
  const cleaned = cleanContent(raw);

  const evaluations: ParsedFocusGroupEvaluation[] = [];
  const transcript: ParsedTranscriptItem[] = [];
  const consensusPoints: string[] = [];
  const polarizingPoints: string[] = [];
  const recommendedPivots: string[] = [];
  let executiveSummary = "";
  let overallScore: number | undefined = undefined;
  let viabilityStatus: string | undefined = undefined;

  // 1. Overall Viability Index & Status
  const overallMatch = cleaned.match(
    /Overall Viability Index:\s*\*\*(\d+(?:\.\d+)?)\s*\/\s*100\*\*\s*(?:—|-)\s*\*?([^*\n]+)\*?/i
  );
  if (overallMatch) {
    overallScore = parseFloat(overallMatch[1]);
    viabilityStatus = overallMatch[2].trim();
  }

  // 2. Parse Markdown Table for Persona Score Breakdown
  const lines = cleaned.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const parts = trimmed
        .split("|")
        .map((p) => p.trim())
        .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

      if (parts.length >= 4) {
        const first = parts[0].toLowerCase();
        if (
          first.includes("persona") ||
          first.includes("---") ||
          first.startsWith(":")
        ) {
          continue;
        }

        const name = parts[0].replace(/\*\*/g, "").trim();
        const role = parts[1] || "";
        const weightStr = parts[2] ? parts[2].replace("%", "").trim() : "";
        const weight = parseFloat(weightStr) || undefined;

        const scoreMatch = parts[3].match(/(\d+(?:\.\d+)?)/);
        const score = scoreMatch ? parseFloat(scoreMatch[1]) : 5.0;

        const weightedContribution =
          parts.length >= 5 ? parts[4].replace(/\*\*/g, "").trim() : undefined;
        const verdict =
          parts.length >= 6
            ? parts[5].replace(/^[""']|[""']$/g, "").trim()
            : "";

        if (name && scoreMatch) {
          evaluations.push({
            personaName: name,
            role,
            weightage: weight,
            score,
            weightedContribution,
            verdict,
          });
        }
      }
    }
  }

  // Fallback: Check for bullet items (e.g. • Alex: Score 8.0/10 - "Verdict")
  if (evaluations.length === 0) {
    const bulletRegex =
      /•\s*([^:]+?)(?:\s*\(([^)]+)\))?:\s*Score\s*(\d+(?:\.\d+)?)\/10\s*-\s*[""']?([^"\n]+)[""']?/gi;
    let bMatch;
    while ((bMatch = bulletRegex.exec(cleaned)) !== null) {
      const name = bMatch[1].trim();
      const role = bMatch[2] ? bMatch[2].trim() : "Participant";
      const score = parseFloat(bMatch[3]) || 5.0;
      const verdict = bMatch[4] ? bMatch[4].trim() : "";
      evaluations.push({
        personaName: name,
        role,
        score,
        verdict,
      });
    }
  }

  // 3. Extract Strategic Synthesis Sections
  const synthesisMatch = cleaned.match(
    /## Strategic Synthesis[^\n]*\n([\s\S]*?)(?=(?:---)|(?:### Focus Group Discussion Transcript)|$)/i
  );
  const synthText = synthesisMatch ? synthesisMatch[1] : cleaned;

  // Executive Assessment
  const execMatch = synthText.match(
    /(?:Executive Market Assessment|Executive Assessment|Executive Summary)[\s\S]*?:?\s*\n([\s\S]*?)(?=(?:\d+\.|\*|\n\n##|\n\n###|Consensus|Polarizing|$))/i
  );
  if (execMatch) {
    executiveSummary = execMatch[1].trim().replace(/^[-*•]\s*/, "");
  }

  // Consensus Points
  const consensusMatch = synthText.match(
    /(?:Consensus Points?|Points of Agreement)[\s\S]*?:?\s*\n([\s\S]*?)(?=(?:\d+\.|\n\n##|\n\n###|Polarizing|Core Conflicts|Pivots|$))/i
  );
  if (consensusMatch) {
    const cLines = consensusMatch[1].split("\n");
    for (const cl of cLines) {
      const cTrim = cl.trim().replace(/^[-*•\d.]\s*/, "").trim();
      if (cTrim && cTrim.length > 5) {
        consensusPoints.push(cTrim);
      }
    }
  }

  // Polarizing Points
  const polarMatch = synthText.match(
    /(?:Polarizing Points?|Core Conflicts?|Key Disagreements?)[\s\S]*?:?\s*\n([\s\S]*?)(?=(?:\d+\.|\n\n##|\n\n###|Product Pivots|Pivots|Recommendations|$))/i
  );
  if (polarMatch) {
    const pLines = polarMatch[1].split("\n");
    for (const pl of pLines) {
      const pTrim = pl.trim().replace(/^[-*•\d.]\s*/, "").trim();
      if (pTrim && pTrim.length > 5) {
        polarizingPoints.push(pTrim);
      }
    }
  }

  // Recommended Pivots
  const pivotMatch = synthText.match(
    /(?:Actionable Product Pivots?|Recommended Pivots?|Key Pivots?)[\s\S]*?:?\s*\n([\s\S]*?)(?=(?:\n\n##|\n\n###|---|$))/i
  );
  if (pivotMatch) {
    const pvLines = pivotMatch[1].split("\n");
    for (const pvl of pvLines) {
      const pvTrim = pvl.trim().replace(/^[-*•\d.]\s*/, "").trim();
      if (pvTrim && pvTrim.length > 5) {
        recommendedPivots.push(pvTrim);
      }
    }
  }

  // 4. Extract Transcript Quotes
  const transcriptRegex =
    />\s*\*\*([^(>]+?)(?:\s*\(([^)]+)\))?\*\*\s*(?:—|-)\s*\*?([^*\n]+)\*?\s*\n([\s\S]*?)(?=(?:>\s*\*\*)|(?:---)|(?:$))/g;
  let tMatch;
  while ((tMatch = transcriptRegex.exec(cleaned)) !== null) {
    const speaker = tMatch[1].trim();
    const role = tMatch[2] ? tMatch[2].trim() : "Participant";
    const roundTitle = tMatch[3] ? tMatch[3].trim() : "Deliberation";
    const quoteContent = tMatch[4]
      .split("\n")
      .map((l) => l.replace(/^>\s?/, "").trim())
      .filter(Boolean)
      .join(" ");

    if (speaker && quoteContent) {
      transcript.push({
        speaker,
        role,
        roundTitle,
        content: quoteContent,
      });
    }
  }

  if (evaluations.length === 0 && transcript.length === 0) {
    return null;
  }

  return {
    overallScore,
    viabilityStatus,
    executiveSummary,
    consensusPoints: consensusPoints.slice(0, 4),
    polarizingPoints: polarizingPoints.slice(0, 4),
    recommendedPivots: recommendedPivots.slice(0, 4),
    evaluations,
    transcript,
  };
}
