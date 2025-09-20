'use client';

import React from 'react';
import type { Buyer, Invoice, Payment } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface PaymentReceiptProps {
  buyer: Buyer;
  invoice: Invoice;
  paymentHistory: Payment[];
  newPaymentAmount?: number;
}

export const PaymentReceipt = React.forwardRef<HTMLDivElement, PaymentReceiptProps>(
  ({ buyer, invoice, paymentHistory, newPaymentAmount }, ref) => {
    const totalPaid = (invoice.paidAmount || 0) + (newPaymentAmount || 0);
    const currentDue = invoice.subtotal - totalPaid;

    return (
      <div ref={ref}>
        <Card className="w-full">
          <CardContent className="p-8 bg-white text-black font-serif">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-primary">পেমেন্ট রশিদ (Payment Receipt)</h1>
              <h2 className="text-xl font-bold">মাহমুদ ইঞ্জিনিয়ারিং শপ</h2>
              <p className="text-xs">এখানে এঙ্গেল, পাতি, স্কয়ারবার, শিট সহ সর্বপ্রকার ওয়ার্কশপ এর মালামাল এবং গ্রাইভিং মেশিন, ওয়েলডিং মেশিন, ড্রিল মেশিন, হাই স্পীড কাটার ও যন্ত্রপাতি বিক্রয় করা হয়।</p>
              <p className="text-xs">E-mail: engmahmud.mmm@gmail.com</p>
            </div>
            <div className="flex justify-between border-b pb-2 mb-4">
              <span>ক্রঃ নং (Inv No): {String(invoice.id)}</span>
              <span>তারিখ (Date): {new Date().toLocaleDateString()}</span>
            </div>
            <div className="mb-4">
              <p>নাম (Name): {buyer.name}</p>
              <p>ঠিকানা (Address): {buyer.address}</p>
              <p>ফোন (Phone): {buyer.phone}</p>
            </div>
            
            <h3 className="font-bold mb-2">মূল চালান (Original Invoice)</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-black">বিবরণ (Item)</TableHead>
                  <TableHead className="text-black text-right">টাকা (Amount)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="text-black font-bold"> চালান মোট (Invoice Total)</TableCell>
                  <TableCell className="text-black text-right font-bold">৳ {invoice.subtotal.toFixed(2)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            
            <h3 className="font-bold mt-6 mb-2">লেনদেন ইতিহাস (Payment History)</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-black">তারিখ (Date)</TableHead>
                  <TableHead className="text-black text-right">জমা (Paid Amount)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentHistory.length > 0 ? paymentHistory.map(payment => (
                  <TableRow key={payment.id}>
                    <TableCell className="text-black">{new Date(payment.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-black text-right">৳ {payment.amount.toFixed(2)}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-gray-500 py-4">No payments recorded yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <div className="mt-6 flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span>মোট জমা (Total Paid):</span>
                  <span>৳ {totalPaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>বর্তমান বাকী (Current Due):</span>
                  <span>৳ {currentDue.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="mt-16 text-center text-xs">
              <p>This is a computer-generated receipt.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
);

PaymentReceipt.displayName = 'PaymentReceipt';

    