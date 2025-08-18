
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { ArrowLeft, CheckCircle, Clock, Download, Loader2, User, XCircle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";


type AttendanceRecord = {
  id: string; 
  name: string;
  date: string;
  status: "present" | "absent" | "late";
  arrival: string | null;
  departure: string | null;
  notes: string;
  advanceCredit?: number;
  currencySymbol?: string;
};

type MonthlySummary = {
    present: number;
    absent: number;
    late: number;
    totalAdvance: number;
    advances: { amount: number, symbol: string }[];
}

type YearlySummary = {
    [month: string]: MonthlySummary;
}

type FullSummary = {
    [year: string]: YearlySummary;
}


const StatusBadge = ({ status }: { status: "present" | "absent" | "late" }) => {
    const statusConfig = {
      present: {
        className: "bg-green-100 text-green-800 border-green-200",
        icon: <CheckCircle className="h-3 w-3 mr-1" />,
      },
      absent: {
        className: "bg-red-100 text-red-800 border-red-200",
        icon: <XCircle className="h-3 w-3 mr-1" />,
      },
      late: {
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: <Clock className="h-3 w-3 mr-1" />,
      },
    };
    return (
      <Badge variant="outline" className={cn("capitalize", statusConfig[status].className)}>
        {statusConfig[status].icon}
        {status}
      </Badge>
    );
};

const getDayInitial = (dateString: string) => {
    try {
        const date = new Date(dateString);
        return format(date, 'E').charAt(0);
    } catch {
        return '-';
    }
}

const handleExportPDF = async (elementId: string, title: string) => {
    const input = document.getElementById(elementId);
    if (!input) {
      console.error(`Element with id "${elementId}" not found.`);
      return;
    }

    const tableContainers = input.querySelectorAll('.overflow-y-auto') as NodeListOf<HTMLElement>;
    const originalStyles = new Map<HTMLElement, { maxHeight: string; overflow: string }>();

    tableContainers.forEach(container => {
        originalStyles.set(container, {
            maxHeight: container.style.maxHeight,
            overflow: container.style.overflow,
        });
        container.style.maxHeight = 'none';
        container.style.overflow = 'visible';
    });

    try {
        const canvas = await html2canvas(input, {
            useCORS: true,
            scale: 2,
            backgroundColor: `hsl(${getComputedStyle(document.documentElement).getPropertyValue('--background').trim()})`,
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasAspectRatio = canvas.width / canvas.height;
        
        const margin = 10;
        let imgWidth = pdfWidth - 2 * margin;
        let imgHeight = imgWidth / canvasAspectRatio;

        if (imgHeight > pdfHeight - 2 * margin) {
            imgHeight = pdfHeight - 2 * margin;
            imgWidth = imgHeight * canvasAspectRatio;
        }

        const x = (pdfWidth - imgWidth) / 2;
        const y = margin;
        
        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
        pdf.save(`${title.replace(/\s+/g, '_').toLowerCase()}.pdf`);
    } catch (err) {
        console.error("PDF export failed:", err);
    } finally {
        tableContainers.forEach(container => {
            const styles = originalStyles.get(container);
            if (styles) {
                container.style.maxHeight = styles.maxHeight;
                container.style.overflow = styles.overflow;
            }
        });
    }
};

export default function EmployeeRecordPage() {
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [isMounted, setIsMounted] = useState(false);
    const params = useParams();

    const employeeName = useMemo(() => {
        const id = params.id;
        return typeof id === 'string' ? decodeURIComponent(id) : '';
    }, [params.id]);


    useEffect(() => {
        if (!employeeName) return;

        const allRecords = JSON.parse(localStorage.getItem("attendanceRecords") || "[]") as AttendanceRecord[];
        const employeeRecords = allRecords.filter(r => r.name === employeeName);
        setRecords(employeeRecords);
        setIsMounted(true);
    }, [employeeName]);


    const recordsByYearAndMonth = useMemo(() => {
        const grouped: {[key: string]: {[key: string]: AttendanceRecord[]}} = {};
        records.forEach(record => {
            try {
                const date = new Date(record.date);
                const year = format(date, 'yyyy');
                const month = format(date, 'MMMM');
                if (!grouped[year]) {
                    grouped[year] = {};
                }
                if (!grouped[year][month]) {
                    grouped[year][month] = [];
                }
                grouped[year][month].push(record);
            } catch (e) {
                console.error("Invalid date format for record:", record);
            }
        });

        for (const year in grouped) {
            for (const month in grouped[year]) {
                grouped[year][month].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            }
        }

        for (const year in grouped) {
            const sortedMonths = Object.entries(grouped[year]).sort(([monthA], [monthB]) => {
                const dateA = new Date(`01 ${monthA} 2000`);
                const dateB = new Date(`01 ${monthB} 2000`);
                return dateB.getTime() - dateA.getTime();
            });
            grouped[year] = Object.fromEntries(sortedMonths);
        }

        return Object.entries(grouped).sort(([yearA], [yearB]) => Number(yearB) - Number(yearA));
    }, [records]);
    
    const monthlySummaries = useMemo(() => {
        const summary: FullSummary = {};
        for(const [year, months] of recordsByYearAndMonth) {
            summary[year] = {};
            for (const [month, monthRecords] of Object.entries(months)) {
                
                const advances = monthRecords
                    .filter(r => r.advanceCredit && r.advanceCredit > 0)
                    .map(r => ({ amount: r.advanceCredit!, symbol: r.currencySymbol || '$' }));
                
                const totalAdvance = advances.reduce((acc, r) => acc + r.amount, 0);

                summary[year][month] = {
                    present: monthRecords.filter(r => r.status === 'present').length,
                    absent: monthRecords.filter(r => r.status === 'absent').length,
                    late: monthRecords.filter(r => r.status === 'late').length,
                    totalAdvance: totalAdvance,
                    advances: advances
                }
            }
        }
        return summary;
    }, [recordsByYearAndMonth]);


    if (!isMounted) {
        return (
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-16 w-16 animate-spin" />
          </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-background font-body p-4 sm:p-6 md:p-8">
             <header className="flex justify-between items-center mb-6">
                <Link href="/" passHref>
                    <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4"/> Back to Dashboard</Button>
                </Link>
                <h1 className="text-2xl md:text-4xl font-bold text-center">
                   <User className="inline-block w-8 h-8 md:w-10 md:h-10 mr-2" />
                   {employeeName}'s Record
                </h1>
                <Button variant="outline" size="sm" onClick={() => handleExportPDF('employee-full-record', `${employeeName} Full Attendance Record`)}>
                    <Download className="mr-2 h-4 w-4" /> Export Full Record
                </Button>
             </header>

            <main className="container mx-auto">
                {recordsByYearAndMonth.length > 0 ? (
                    <div id="employee-full-record">
                    {recordsByYearAndMonth.map(([year, months]) => (
                        <Card key={year} className="mb-8">
                            <CardHeader>
                                <CardTitle className="text-3xl font-bold">{year}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {Object.entries(months).map(([month, monthRecords]) => (
                                    <div key={month} id={`record-${year}-${month}`} className="mb-8 last:mb-0">
                                        <div className="flex justify-between items-center mb-3 mt-4 pb-2 border-b">
                                            <h2 className="text-2xl font-semibold">{month}</h2>
                                            <Button variant="outline" size="sm" onClick={() => handleExportPDF(`record-${year}-${month}`, `${employeeName} - ${month} ${year} Attendance`)}>
                                                <Download className="mr-2 h-4 w-4" /> Export PDF
                                            </Button>
                                        </div>
                                        {monthlySummaries[year] && monthlySummaries[year][month] &&
                                            <div className="flex gap-2 mb-4 flex-wrap">
                                                <Badge variant="outline" className="text-base bg-green-100 text-green-800 border-green-200">Present: {monthlySummaries[year][month].present}</Badge>
                                                <Badge variant="outline" className="text-base bg-red-100 text-red-800 border-red-200">Absent: {monthlySummaries[year][month].absent}</Badge>
                                                <Badge variant="outline" className="text-base bg-yellow-100 text-yellow-800 border-yellow-200">Late: {monthlySummaries[year][month].late}</Badge>
                                                {monthlySummaries[year][month].advances.length > 0 && 
                                                    monthlySummaries[year][month].advances.map((adv, i) => (
                                                         <Badge key={i} variant="outline" className="text-base bg-blue-100 text-blue-800 border-blue-200">
                                                            Advance: {adv.symbol} {adv.amount.toLocaleString()}
                                                         </Badge>
                                                    ))
                                                }
                                            </div>
                                        }
                                        <div className="max-h-[600px] overflow-y-auto">
                                        <Table>
                                            <TableHeader className="sticky top-0 bg-background">
                                                <TableRow>
                                                    <TableHead>No.</TableHead>
                                                    <TableHead>Day</TableHead>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Arrival</TableHead>
                                                    <TableHead>Departure</TableHead>
                                                    <TableHead>Advance Credit</TableHead>
                                                    <TableHead>Notes</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {monthRecords.map((record, index) => {
                                                    const day = getDayInitial(record.date);
                                                    return (
                                                        <TableRow key={record.id}>
                                                            <TableCell>{index + 1}</TableCell>
                                                            <TableCell className={cn(day === 'F' && 'text-red-500 font-bold')}>{day}</TableCell>
                                                            <TableCell>{format(new Date(record.date), "dd-MM-yyyy")}</TableCell>
                                                            <TableCell><StatusBadge status={record.status} /></TableCell>
                                                            <TableCell>{record.arrival || '-'}</TableCell>
                                                            <TableCell>{record.departure || '-'}</TableCell>
                                                            <TableCell>{record.advanceCredit ? `${record.currencySymbol || ''} ${record.advanceCredit.toLocaleString()}` : '-'}</TableCell>
                                                            <TableCell className="max-w-[150px] truncate">{record.notes}</TableCell>
                                                        </TableRow>
                                                    )
                                                })}
                                            </TableBody>
                                        </Table>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    ))}
                    </div>
                ) : (
                    <Card>
                        <CardContent>
                            <div className="text-center p-8">
                                <p className="text-muted-foreground">No attendance records found for {employeeName}.</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    );
}
