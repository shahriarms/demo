'use client';

import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserCheck } from 'lucide-react';
import type { Attendance, Employee } from '@/lib/types';
import { format } from 'date-fns';

interface DailyAttendanceReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendance: Attendance[];
  employees: Employee[];
}

export function DailyAttendanceReportDialog({ open, onOpenChange, attendance, employees }: DailyAttendanceReportDialogProps) {
    const presentEmployees = useMemo(() => {
        if (!attendance || !employees) return [];
        
        const presentEmployeeIds = new Set(
            attendance.filter(a => a.status === 'Present').map(a => a.employeeId)
        );
        
        return employees.filter(e => presentEmployeeIds.has(e.id));
    }, [attendance, employees]);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Today's Attendance Report</DialogTitle>
          <DialogDescription>
            A list of all employees marked as 'Present' today, {format(new Date(), 'PPP')}. 
            Total Present: <strong>{presentEmployees.length}</strong>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-72 rounded-md border">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead>Employee Name</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {presentEmployees.length > 0 ? (
                presentEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-green-600"/>
                        {employee.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{employee.role}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center">
                    No employees are marked as present today.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
