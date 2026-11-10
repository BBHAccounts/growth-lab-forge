import { useMemo, useState } from "react";
import { ArrowUpDown, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { bookProgressCSV, type BookParticipantProgress } from "@/lib/book-admin";

const columns = [["name", "Name"], ["email", "Email"], ["joined_at", "Joined"], ["last_active", "Last active"], ["steps_done", "Steps done"], ["current_chapter", "Current chapter"]] as const;
export function BookProgramProgress({ rows, error }: { rows: BookParticipantProgress[]; error: string | null }) {
  const [sort, setSort] = useState<{ key: typeof columns[number][0]; descending: boolean }>({ key: "joined_at", descending: false });
  const sorted = useMemo(() => [...rows].sort((a, b) => {
    const x = a[sort.key], y = b[sort.key];
    const result = x === y ? 0 : x === null ? 1 : y === null ? -1 : typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
    return sort.descending ? -result : result;
  }), [rows, sort]);
  const exportCSV = () => {
    const url = URL.createObjectURL(new Blob([bookProgressCSV(sorted)], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "book-programme-progress.csv"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const date = (value: string | null) => value ? new Date(value).toLocaleString("en-GB") : "Not yet";
  return <div className="space-y-4"><div className="flex justify-end"><Button variant="outline" onClick={exportCSV} disabled={Boolean(error) || !rows.length}><Download className="h-4 w-4 mr-2" />Export CSV</Button></div>{error ? <p role="alert" className="text-destructive">{error}</p> : <Card><CardHeader><CardTitle>Participant progress</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow>{columns.map(([key, label]) => <TableHead key={key} aria-sort={sort.key === key ? sort.descending ? "descending" : "ascending" : "none"}><Button variant="ghost" className="px-0 whitespace-nowrap" onClick={() => setSort({ key, descending: sort.key === key && !sort.descending })}>{label}<ArrowUpDown className="ml-2 h-3.5 w-3.5" /></Button></TableHead>)}</TableRow></TableHeader><TableBody>{sorted.map(row => <TableRow key={row.participant_id}><TableCell className="font-medium">{row.name || "Unnamed"}</TableCell><TableCell>{row.email || "Not provided"}</TableCell><TableCell className="whitespace-nowrap">{date(row.joined_at)}</TableCell><TableCell className="whitespace-nowrap">{date(row.last_active)}</TableCell><TableCell>{row.steps_done}</TableCell><TableCell>{row.current_chapter ?? "Complete"}</TableCell></TableRow>)}{!rows.length && <TableRow><TableCell colSpan={6}>No participants yet.</TableCell></TableRow>}</TableBody></Table></CardContent></Card>}</div>;
}