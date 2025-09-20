// This file is now obsolete and can be removed.
// The functionality has been integrated into the Invoice page and the universal print system.
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import Link from "next/link";


export default function PosTerminalPage() {
    return (
        <div className="flex flex-col gap-6 items-center justify-center h-full">
            <Card className="w-full max-w-lg text-center">
                <CardHeader>
                    <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                        <AlertCircle className="w-8 h-8 text-amber-500" />
                        Page Obsolete
                    </CardTitle>
                    <CardDescription className="text-base">
                        This POS Terminal page is no longer in use.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="mb-4">
                        All printing functionality has been integrated directly into the <strong>Invoice Page</strong> and <strong>Buyer Purchases</strong> page. You can now create, save, and print invoices (both A4 and POS receipts) from a single location.
                    </p>
                    <p className="mb-6">
                        Please configure your printer in the <strong>Settings</strong> page and then head to the Invoice or Buyer Purchases page to print an invoice.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Button asChild>
                            <Link href="/dashboard/invoice">Go to Invoice Page</Link>
                        </Button>
                         <Button asChild variant="outline">
                            <Link href="/dashboard/settings">Go to Settings</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
