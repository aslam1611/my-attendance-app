
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

export const metadata: Metadata = {
  title: 'AttendAI',
  description: 'A feature-rich attendance management application that works offline.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col bg-background">
        <div className="flex-grow">
          <main>{children}</main>
        </div>
        <Toaster />
        <footer className="border-t border-border py-8 bg-card text-card-foreground w-full shrink-0">
            <div className="container mx-auto px-4 flex justify-between items-start flex-wrap gap-8">
                
                <div className="text-left max-w-md flex-1">
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="text-left text-primary hover:underline focus:outline-none">
                        <h3 className="text-2xl stylish-text text-primary mb-2">About AttendAI</h3>
                        <p className="text-sm text-muted-foreground">
                          The core purpose of AttendAI is to simplify and modernize the attendance system for all types of institutions by offering features like PDF reports, data backup, and cloud-based access. Click to learn more.
                        </p>
                      </button>
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

                <div className="flex flex-col items-end text-right">
                    <div className='p-4 rounded-lg bg-card shadow-inner w-full max-w-xs'>
                        <p>
                          <span className="text-lg stylish-text text-primary">Develop by:</span>
                          <span className="text-2xl stylish-text text-primary block">Miyan Aslam</span>
                        </p>
                        <a 
                          href="https://wa.me/923338001788?text=Hello!%20I'm%20interested%20in%20the%20AttendAI%20subscription."
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-block mt-3"
                        >
                            <Button className="w-full h-12 text-md bg-green-500 hover:bg-green-600 text-white font-bold shine-effect transition-transform duration-300 hover:scale-105">
                                <MessageSquare className="mr-2 h-5 w-5" />
                                Contact on WhatsApp
                            </Button>
                        </a>
                        <p className="text-xs mt-4 text-muted-foreground">&copy; 2025 UG Tech. All rights reserved.</p>
                        <p className="text-xs mt-2 text-muted-foreground">aslam1611@gmail.com</p>
                    </div>
                </div>
            </div>
        </footer>
      </body>
    </html>
  );
}
