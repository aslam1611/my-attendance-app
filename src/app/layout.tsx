
"use client";

import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, MessageSquare, Upload } from 'lucide-react';
import useLocalStorage from '@/hooks/use-local-storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import React, { useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const [welcomeText, setWelcomeText] = useLocalStorage("welcomeText", "Welcome");
  const [companyName, setCompanyName] = useLocalStorage("companyName", "UG Tech");
  const [records, setRecords] = useLocalStorage<any[]>("attendanceRecords", []);
  const [currency, setCurrency] = useLocalStorage("currency", "$");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleExportData = () => {
    try {
      const dataToExport = {
        attendanceRecords: records,
        welcomeText: welcomeText,
        companyName: companyName,
        currency: currency
      };
      const dataStr = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "attendai_backup.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: "Export Successful", description: "Your data has been exported." });
    } catch (error) {
      console.error("Export failed:", error);
      toast({ variant: "destructive", title: "Export Failed", description: "Could not export your data." });
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error("File is not readable");
        }
        const importedData = JSON.parse(text);

        if (Array.isArray(importedData.attendanceRecords) && importedData.welcomeText && importedData.companyName) {
          setRecords(importedData.attendanceRecords);
          setWelcomeText(importedData.welcomeText);
          setCompanyName(importedData.companyName);
          if (importedData.currency) {
            setCurrency(importedData.currency);
          }
          
          toast({ title: "Import Successful", description: "Data has been restored successfully." });
          // Force a reload to make sure the main page re-reads the new data from local storage
          window.location.reload();
          
        } else {
          throw new Error("Invalid backup file format.");
        }
      } catch (error) {
        console.error("Import failed:", error);
        toast({ variant: "destructive", title: "Import Failed", description: "The selected file is not a valid backup." });
      } finally {
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
      }
    };
    reader.readAsText(file);
  };


  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <title>AttendAI</title>
        <meta name="description" content="A feature-rich attendance management application that works offline." />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3F51B5" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col bg-background">
        <div className="flex-grow">
          <main>{children}</main>
        </div>
        <Toaster />
        <footer className="border-t border-border py-8 bg-card text-card-foreground w-full shrink-0">
            <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                
                {/* About AttendAI Section */}
                <Card className="flex flex-col">
                  <CardHeader>
                      <CardTitle className="text-xl">About AttendAI</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                      <p className="text-sm text-muted-foreground">
                        AttendAI simplifies attendance for all institutions with PDF reports, data backup, and cloud access.
                      </p>
                  </CardContent>
                  <div className="p-6 pt-0">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">Learn More</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-bold text-primary mb-4">AttendAI: Your Modern & Simple Attendance Register</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 text-muted-foreground">
                          <p>
                            AttendAI is a revolutionary web application that makes attendance management incredibly easy and effective for all types of institutions—whether it's a government office, a private company, a school, a college, or a factory.
                          </p>
                          <div className="space-y-3 pt-4">
                            <div>
                              <h4 className="font-semibold text-foreground">PDF Reports & Instant Printing</h4>
                              <p className="text-sm">Download or print professional reports for any employee or the entire institution with a single click.</p>
                            </div>
                            <div>
                              <h4 className="font-semibold text-foreground">Data Backup and Recovery</h4>
                              <p className="text-sm">Export your entire application data to a file for safekeeping and import it anytime to restore everything.</p>
                            </div>
                            <div>
                              <h4 className="font-semibold text-foreground">Cloud-Based System</h4>
                              <p className="text-sm">Access your up-to-date attendance data from anywhere in the world, on any device.</p>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </Card>

                {/* Customize Header Section */}
                <Card className="flex flex-col">
                    <CardHeader>
                      <CardTitle>Customize Header</CardTitle>
                      <CardDescription>Change the header text.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="welcome-text-input-footer">Welcome Text</Label>
                            <Input id="welcome-text-input-footer" value={welcomeText} onChange={(e) => setWelcomeText(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="company-name-input-footer">Company Name</Label>
                            <Input id="company-name-input-footer" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                        </div>
                    </CardContent>
                </Card>

                {/* Data Backup & Recovery Section */}
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle>Data Backup & Recovery</CardTitle>
                        <CardDescription>Save or restore all your application data.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col justify-center gap-4">
                         <Button onClick={handleExportData} className="w-full">
                            <Download className="mr-2 h-4 w-4" />
                            Export Data
                        </Button>
                        <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full">
                            <Upload className="mr-2 h-4 w-4" />
                            Import Data
                        </Button>
                        <input type="file" ref={fileInputRef} onChange={handleImportData} className="hidden" accept="application/json"/>
                    </CardContent>
                </Card>

                {/* Developer Info Section */}
                <Card className="flex flex-col text-center">
                    <CardHeader>
                      <CardTitle>Developer</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col items-center justify-center">
                        <p className="text-2xl stylish-text text-primary">Miyan Aslam</p>
                        <p className="text-sm text-muted-foreground mt-1">aslam1611@gmail.com</p>
                        <p className="text-xs text-muted-foreground mt-4">&copy; 2025 UG Tech. All rights reserved.</p>
                    </CardContent>
                     <div className="p-6 pt-0">
                        <a 
                          href="https://wa.me/923338001788?text=Hello!%20I'm%20interested%20in%20the%20AttendAI%20application."
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-block"
                        >
                            <Button className="w-full h-12 text-md bg-green-500 hover:bg-green-600 text-white font-bold shine-effect transition-transform duration-300 hover:scale-105">
                                <MessageSquare className="mr-2 h-5 w-5" />
                                Contact on WhatsApp
                            </Button>
                        </a>
                    </div>
                </Card>

            </div>
        </footer>
      </body>
    </html>
  );
}

    