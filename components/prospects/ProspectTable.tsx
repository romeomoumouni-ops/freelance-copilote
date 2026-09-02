"use client";

/* Saisie des prospects sous forme de tableau : une colonne par
   information, plus d'ambiguïté sur « qui est quoi ». L'e-mail est
   obligatoire (sans lui, aucun envoi possible) et le nom de
   l'entreprise aussi (il sert dans chaque mail). Collage depuis Excel
   ou Google Sheets pris en charge. */

import { IconPlus, IconTrash } from "@/components/icons";

export interface DraftRow {
  entreprise: string;
  email: string;
  activite: string;
  contact: string;
  site: string;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const emptyRow = (): DraftRow => ({ entreprise: "", email: "", activite: "", contact: "", site: "" });

export function isEmptyRow(r: DraftRow): boolean {
  return !r.entreprise.trim() && !r.email.trim() && !r.activite.trim() && !r.contact.trim() && !r.site.trim();
}

export function rowIsValid(r: DraftRow): boolean {
  return !!r.entreprise.trim() && EMAIL_RE.test(r.email.trim());
}

const COLS: { key: keyof DraftRow; label: string; placeholder: string; required?: boolean; width: string }[] = [
  { key: "entreprise", label: "Entreprise", placeholder: "Chez Marco", required: true, width: "w-[20%]" },
  { key: "email", label: "E-mail", placeholder: "contact@chezmarco.fr", required: true, width: "w-[24%]" },
  { key: "activite", label: "Son activité", placeholder: "Restaurant", width: "w-[20%]" },
  { key: "contact", label: "Contact", placeholder: "Marco", width: "w-[18%]" },
  { key: "site", label: "Site web", placeholder: "s'il en a un", width: "w-[18%]" },
];

/* Découpe une ligne collée : tabulation (tableur) sinon point-virgule. */
function splitLine(line: string): string[] {
  if (line.includes("\t")) return line.split("\t");
  if (line.includes(";")) return line.split(";");
  return [line];
}

export default function ProspectTable({
  rows,
  onChange,
}: {
  rows: DraftRow[];
  onChange: (rows: DraftRow[]) => void;
}) {
  function setCell(index: number, key: keyof DraftRow, value: string) {
    onChange(rows.map((r, i) => (i === index ? { ...r, [key]: value } : r)));
  }

  function addRow() {
    onChange([...rows, emptyRow()]);
  }

  function removeRow(index: number) {
    const next = rows.filter((_, i) => i !== index);
    onChange(next.length ? next : [emptyRow()]);
  }

  /* Collage d'un bloc entier depuis un tableur : on remplit la grille à
     partir de la cellule où on colle, en créant les lignes manquantes. */
  function handlePaste(e: React.ClipboardEvent, rowIndex: number, colIndex: number) {
    const text = e.clipboardData.getData("text");
    if (!text.includes("\n") && !text.includes("\t") && !text.includes(";")) return; // collage simple
    e.preventDefault();

    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    const next = [...rows];
    lines.forEach((line, li) => {
      const cells = splitLine(line).map((c) => c.trim());
      const target = rowIndex + li;
      while (next.length <= target) next.push(emptyRow());
      cells.forEach((cell, ci) => {
        const col = COLS[colIndex + ci];
        if (col) next[target] = { ...next[target], [col.key]: cell };
      });
    });
    onChange(next);
  }

  const remplies = rows.filter((r) => !isEmptyRow(r));
  const valides = remplies.filter(rowIsValid);
  const incompletes = remplies.length - valides.length;

  return (
    <div>
      <div className="overflow-x-auto rounded-2xl border border-line">
        <table className="w-full min-w-[780px] border-collapse">
          <thead>
            <tr className="bg-canvas">
              <th className="w-9 border-b border-line" />
              {COLS.map((c) => (
                <th
                  key={c.key}
                  className={`${c.width} border-b border-line px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-ink-mute`}
                >
                  {c.label}
                  {c.required && <span className="text-royal"> *</span>}
                </th>
              ))}
              <th className="w-10 border-b border-line" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const vide = isEmptyRow(row);
              return (
                <tr key={i} className="group">
                  <td className="border-b border-line/70 text-center text-[11px] font-semibold text-ink-mute">
                    {i + 1}
                  </td>
                  {COLS.map((c, ci) => {
                    const value = row[c.key];
                    const fautif =
                      !vide &&
                      c.required &&
                      (c.key === "email" ? !EMAIL_RE.test(value.trim()) : !value.trim());
                    return (
                      <td key={c.key} className="border-b border-line/70 p-0">
                        <input
                          value={value}
                          onChange={(e) => setCell(i, c.key, e.target.value)}
                          onPaste={(e) => handlePaste(e, i, ci)}
                          placeholder={c.placeholder}
                          spellCheck={false}
                          className={`h-11 w-full bg-transparent px-3 text-[13px] outline-none transition-colors placeholder:text-ink-mute/60 ${
                            fautif
                              ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-300"
                              : "text-ink focus:bg-primary-50/50"
                          }`}
                        />
                      </td>
                    );
                  })}
                  <td className="border-b border-line/70 text-center">
                    <button
                      onClick={() => removeRow(i)}
                      className="rounded-lg p-1.5 text-ink-mute/50 transition-colors hover:bg-red-50 hover:text-red-500"
                      aria-label={`Supprimer la ligne ${i + 1}`}
                    >
                      <IconTrash size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={addRow}
          className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3.5 py-2 text-[12.5px] font-bold text-ink-soft transition-colors hover:border-ink/20 hover:text-ink"
        >
          <IconPlus size={13} /> Ajouter une ligne
        </button>
        <p className="text-[12px] font-semibold text-ink-mute">
          {valides.length} prospect{valides.length > 1 ? "s" : ""} prêt{valides.length > 1 ? "s" : ""}
          {incompletes > 0 && (
            <span className="text-red-500">
              {" "}
              · {incompletes} ligne{incompletes > 1 ? "s" : ""} incomplète{incompletes > 1 ? "s" : ""}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
