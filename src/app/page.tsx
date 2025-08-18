
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Link from "next/link";
import {
  AlertTriangle,
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  Download,
  FilePen,
  Loader2,
  Trash2,
  User,
  Users,
  XCircle,
  Upload,
  DollarSign,
  Euro,
  IndianRupee,
  BadgeCent,
} from "lucide-react";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import useLocalStorage from "@/hooks/use-local-storage";


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

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  date: z.date({
    required_error: "A date is required.",
  }),
  status: z.enum(["present", "absent", "late"]),
  arrival: z.string().optional(),
  departure: z.string().optional(),
  advanceCredit: z.coerce.number().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const defaultFormValues: Omit<FormValues, 'date'> & { date?: Date } = {
    name: "",
    status: "present",
    arrival: "",
    departure: "",
    advanceCredit: 0,
    notes: "",
};


const StatCard = ({ title, onClick, className, children }: { title: string; onClick?: () => void; className?: string; children?: React.ReactNode }) => {
    return (
        <div
            onClick={onClick}
            className={cn(
                "relative w-full h-28 rounded-lg flex items-center justify-center text-white font-bold cursor-pointer transition-all duration-300 ease-in-out shadow-lg hover:shadow-2xl hover:-translate-y-1 overflow-hidden",
                "shine-effect",
                className
            )}
        >
            <div className="z-10 text-2xl stylish-text-dark">{title}</div>
            {children}
        </div>
    );
}

export default function AttendancePage() {
  const [records, setRecords] = useLocalStorage<AttendanceRecord[]>("attendanceRecords", []);
  const [view, setView] = useState<"current" | "all" | "employees" | "advances">("current");
  const [isMounted, setIsMounted] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { toast } = useToast();
  const [welcomeText] = useLocalStorage("welcomeText", "Welcome");
  const [companyName] = useLocalStorage("companyName", "UG Tech");
  const [currency, setCurrency] = useLocalStorage("currency", "$");


  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormValues,
  });

  const employeeNames = useMemo(() => [...new Set(records.map(r => r.name))].sort(), [records]);
  
  useEffect(() => {
    setIsMounted(true);
    form.setValue('date', new Date());
  }, [form]);
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    form.setValue('name', value);
    if (value.length > 0) {
      const filteredSuggestions = employeeNames.filter(name =>
        name.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filteredSuggestions);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };
  
  const handleSuggestionClick = (name: string) => {
    form.setValue('name', name);
    setSuggestions([]);
    setShowSuggestions(false);
  };
  
  const onSubmit = async (values: FormValues) => {
    const newRecordId = `${values.name}-${format(values.date, 'yyyy-MM-dd')}`;
    
    const existingRecordIndex = records.findIndex(r => r.id === newRecordId);

    if (existingRecordIndex !== -1) {
        const updatedRecords = [...records];
        const existingRecord = updatedRecords[existingRecordIndex];
        
        updatedRecords[existingRecordIndex] = {
            ...existingRecord,
            name: values.name,
            date: format(values.date, 'yyyy-MM-dd'),
            status: values.status,
            arrival: values.arrival || null,
            departure: values.departure || null,
            advanceCredit: values.advanceCredit || existingRecord.advanceCredit || 0,
            currencySymbol: values.advanceCredit ? currency : existingRecord.currencySymbol,
            notes: values.notes || "",
        };

        setRecords(updatedRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        toast({ title: "Record Updated", description: `Attendance for ${values.name} has been updated.` });

    } else {
        const newRecord: AttendanceRecord = {
          id: newRecordId,
          name: values.name,
          date: format(values.date, 'yyyy-MM-dd'),
          status: values.status,
          arrival: values.arrival || null,
          departure: values.departure || null,
          advanceCredit: values.advanceCredit || 0,
          currencySymbol: values.advanceCredit ? currency : undefined,
          notes: values.notes || "",
        };
        
        setRecords(prev => [...prev, newRecord].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        toast({ title: "Record Added", description: `Attendance for ${values.name} has been added.` });
    }
    
    setView("all");
    form.reset({ ...defaultFormValues, date: new Date() });
  };
  
  const handlePredict = async () => {
    const employeeName = form.getValues("name");
    if (!employeeName) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please enter an employee name to predict status." });
      return;
    }
    
    setIsPredicting(true);
    // Dummy prediction logic
    await new Promise(resolve => setTimeout(resolve, 1000));
    const statuses = ["present", "absent", "late"] as const;
    const predictedStatus = statuses[Math.floor(Math.random() * statuses.length)];
    form.setValue("status", predictedStatus);
    toast({
        title: "Prediction Successful",
        description: `Predicted status: ${predictedStatus}`
    });
    setIsPredicting(false);
  };
  
  const handleDelete = (id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
    toast({ title: "Record Deleted", description: "The attendance record has been removed." });
  };
  
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

  const displayedRecords = useMemo(() => {
    if (view === "all") {
      return records;
    }
    if (view === "current") {
      const currentMonth = format(new Date(), 'yyyy-MM');
      return records.filter(r => r.date.startsWith(currentMonth));
    }
    if (view === "advances") {
        return records.filter(r => r.advanceCredit && r.advanceCredit > 0);
    }
    return [];
  }, [records, view]);

  const employeesWithAdvanceInCurrentMonth = useMemo(() => {
    const currentMonth = format(new Date(), 'yyyy-MM');
    const employees = new Map<string, string>();
    records.forEach(r => {
        if (r.date.startsWith(currentMonth) && r.advanceCredit && r.advanceCredit > 0 && r.currencySymbol) {
            employees.set(r.name, r.currencySymbol);
        }
    });
    return employees;
  }, [records]);


  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-16 w-16 animate-spin" />
      </div>
    );
  }

  const CurrencyIcon = ({ symbol, ...props }: { symbol: string } & React.ComponentProps<typeof DollarSign>) => {
    switch (symbol) {
        case '$': return <DollarSign {...props} />;
        case '₨': return <BadgeCent {...props} />;
        case '₹': return <IndianRupee {...props} />;
        case '€': return <Euro {...props} />;
        default: return <DollarSign {...props} />;
    }
};

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
  
  const MainContent = () => {
    if (view === "employees") {
      return (
        <Card>
          <CardHeader>
            <CardTitle>All Employees</CardTitle>
            <CardDescription>Click on an employee to view their detailed record. A currency icon indicates an advance was taken this month.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {employeeNames.map(name => {
                  const advanceSymbol = employeesWithAdvanceInCurrentMonth.get(name);
                  return (
                    <Link key={name} href={`/employee/${encodeURIComponent(name)}`} passHref>
                      <Button variant="outline" className="w-full h-auto min-h-[70px] justify-start p-3 text-left flex items-center gap-3 whitespace-normal">
                        <User className="h-5 w-5 flex-shrink-0" />
                        <span className="font-semibold break-words flex-1 leading-tight">{name}</span>
                        {advanceSymbol && <CurrencyIcon symbol={advanceSymbol} className="h-5 w-5 text-green-600 flex-shrink-0" />}
                      </Button>
                    </Link>
                  )
              })}
            </div>
          </CardContent>
        </Card>
      )
    }

    const tableTitle = view === 'current' ? 'Current Month Attendance' 
                     : view === 'all' ? 'All Attendance Records'
                     : 'Advance Credit Records';

    return (
        <Card id="main-table-card">
          <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle>{tableTitle}</CardTitle>
                <Button variant="outline" size="sm" onClick={() => handleExportPDF('main-table-card', tableTitle)}><Download className="mr-2 h-4 w-4" /> Export to PDF</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-[400px] overflow-y-auto">
                <Table>
                    <TableHeader className="sticky top-0 bg-card">
                        <TableRow>
                        <TableHead>No.</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Arrival</TableHead>
                        <TableHead>Departure</TableHead>
                        <TableHead>Advance Credit</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {displayedRecords.length > 0 ? displayedRecords.map((record, index) => (
                        <TableRow key={record.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{format(new Date(record.date), "dd-MM-yyyy")}</TableCell>
                            <TableCell>
                                <Link href={`/employee/${encodeURIComponent(record.name)}`} passHref>
                                    <Button variant="link" className="p-0 h-auto">
                                        {record.name}
                                    </Button>
                                </Link>
                            </TableCell>
                            <TableCell><StatusBadge status={record.status} /></TableCell>
                            <TableCell>{record.arrival || '-'}</TableCell>
                            <TableCell>{record.departure || '-'}</TableCell>
                            <TableCell>{record.advanceCredit ? `${record.currencySymbol || ''} ${record.advanceCredit.toLocaleString()}` : '-'}</TableCell>
                            <TableCell className="max-w-[150px] truncate">{record.notes}</TableCell>
                            <TableCell className="text-right">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the attendance record.</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(record.id)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </TableCell>
                        </TableRow>
                        )) : <TableRow><TableCell colSpan={9} className="text-center">No records found.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </div>
          </CardContent>
        </Card>
    );
  }

  return (
    <div className="min-h-screen bg-background font-body pt-8">
      <main className="container mx-auto px-4 pb-8 flex flex-col gap-8">
        <header className="flex justify-between items-center w-full">
            <div>
                <h1 className="text-5xl font-bold text-gradient-gold stylish-text">{welcomeText}</h1>
                <h2 className="text-4xl font-bold text-gradient-gold stylish-text">{companyName}</h2>
            </div>
        </header>

        <p className="text-center text-muted-foreground -mt-6">AttendAI - Your AI-Powered Attendance Register</p>
          
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard title="Current Month" onClick={() => setView('current')} className="bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600">
                  <CalendarIcon className="absolute opacity-10 w-20 h-20 -right-2 -bottom-2" />
              </StatCard>
              <StatCard title="All Records" onClick={() => setView('all')} className="bg-gradient-to-br from-orange-400 via-red-500 to-rose-600">
                  <User className="absolute opacity-10 w-20 h-20 -right-2 -bottom-2" />
              </StatCard>
              <StatCard title="Employees" onClick={() => setView('employees')} className="bg-gradient-to-br from-purple-500 via-fuchsia-500 to-pink-500">
                  <Users className="absolute opacity-10 w-20 h-20 -right-2 -bottom-2" />
              </StatCard>
              <StatCard title="Advance Credit" onClick={() => setView('advances')} className="bg-gradient-to-br from-lime-400 via-green-500 to-emerald-600">
                  <DollarSign className="absolute opacity-10 w-20 h-20 -right-2 -bottom-2" />
              </StatCard>
        </div>

        <div className="space-y-8">
          <Card>
          <CardHeader>
              <CardTitle>Add New Employee or Attendance</CardTitle>
              <CardDescription>Fill out the form to add a new attendance record. You can also add an advance credit amount here.</CardDescription>
          </CardHeader>
          <CardContent>
              <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Employee Name</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <Input 
                                placeholder="Enter name" 
                                {...field} 
                                onChange={handleNameChange}
                                onFocus={handleNameChange}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                                autoComplete="off"
                                />
                                {showSuggestions && suggestions.length > 0 && (
                                    <ul className="absolute z-10 w-full bg-card border border-border rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                                        {suggestions.map(name => (
                                            <li 
                                                key={name}
                                                className="px-3 py-2 cursor-pointer hover:bg-accent"
                                                onMouseDown={() => handleSuggestionClick(name)}
                                            >
                                                {name}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="date" render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Date</FormLabel>
                            <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                    {field.value ? (format(field.value, "PPP")) : (<span>Pick a date</span>)}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus />
                            </PopoverContent>
                            </Popover>
                        <FormMessage />
                        </FormItem>
                    )} />
                     <FormField control={form.control} name="arrival" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Arrival Time</FormLabel>
                            <FormControl><Input type="time" {...field} value={field.value || ''} /></FormControl>
                        </FormItem>
                    )} />
                     <FormField control={form.control} name="departure" render={({ field }) => (
                          <FormItem>
                              <FormLabel>Departure Time</FormLabel>
                              <FormControl><Input type="time" {...field} value={field.value || ''}/></FormControl>
                          </FormItem>
                      )} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <FormField control={form.control} name="status" render={({ field }) => (
                          <FormItem>
                              <FormLabel>Status</FormLabel>
                              <div className="flex items-center gap-2">
                              <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                  <SelectTrigger>
                                      <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                  <SelectItem value="present">Present</SelectItem>
                                  <SelectItem value="absent">Absent</SelectItem>
                                  <SelectItem value="late">Late</SelectItem>
                                  </SelectContent>
                              </Select>
                              <Button type="button" variant="outline" size="icon" onClick={handlePredict} disabled={isPredicting}>
                                  {isPredicting ? <Loader2 className="h-4 w-4 animate-spin"/> : <AlertTriangle className="h-4 w-4"/>}
                              </Button>
                              </div>
                              <FormMessage />
                          </FormItem>
                      )} />
                       <FormField control={form.control} name="advanceCredit" render={({ field }) => (
                          <FormItem>
                              <FormLabel>Advance Credit ({currency})</FormLabel>
                              <FormControl><Input type="number" placeholder="e.g., 1000" {...field} onChange={event => field.onChange(event.target.value === '' ? undefined : +event.target.value)} value={field.value || ''} /></FormControl>
                          </FormItem>
                      )} />
                       <div className="space-y-2">
                            <Label htmlFor="currency-select-main">Currency</Label>
                             <Select value={currency} onValueChange={setCurrency}>
                                <SelectTrigger id="currency-select-main">
                                    <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="$">USD ($)</SelectItem>
                                    <SelectItem value="₨">PKR (₨)</SelectItem>
                                    <SelectItem value="₹">INR (₹)</SelectItem>
                                    <SelectItem value="€">EUR (€)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                      <FormField control={form.control} name="notes" render={({ field }) => (
                          <FormItem className="md:col-span-1">
                              <FormLabel>Notes</FormLabel>
                              <FormControl><Textarea placeholder="Optional notes" {...field} value={field.value || ''} /></FormControl>
                          </FormItem>
                      )} />
                  </div>
                  <Button type="submit" className="w-full h-12 text-lg relative overflow-hidden bg-gradient-to-br from-green-500 to-green-700 text-white font-bold shine-effect transition-transform duration-300 hover:scale-105">
                    <FilePen className="absolute opacity-20 w-16 h-16 -right-4 -bottom-4" />
                    <span className="z-10">Add / Update Record</span>
                  </Button>
              </form>
              </Form>
          </CardContent>
          </Card>
          
          <MainContent />
        </div>
      </main>
    </div>
  );
}

    