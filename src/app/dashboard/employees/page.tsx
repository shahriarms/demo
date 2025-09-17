
'use client';

import { useState, useMemo } from 'react';
import { useAppData } from '@/hooks/use-app-data';
import type { Employee, AttendanceStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { PlusCircle, MoreHorizontal, Pencil, Trash2, CalendarIcon, Users, UserCheck, UserX, NotebookText, Loader2 } from 'lucide-react';
import { EmployeeDialog } from '@/components/employee-dialog';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/use-user';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslation } from '@/hooks/use-translation';


export default function EmployeesPage() {
    const { employees, markAttendance, getAttendanceForDate, deleteEmployee, isAppDataLoading } = useAppData();
    const { user } = useUser();
    const { t } = useTranslation();
    
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
    const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
    
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [searchTerm, setSearchTerm] = useState('');

    const dailyAttendance = useMemo(() => getAttendanceForDate(selectedDate), [getAttendanceForDate, selectedDate]);
    
    const filteredEmployees = useMemo(() => {
        return employees.filter(e => 
            e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.role.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [employees, searchTerm]);
    
    const handleAddNew = () => {
        setEmployeeToEdit(null);
        setDialogOpen(true);
    };

    const handleEdit = (employee: Employee) => {
        if (user?.role !== 'admin') {
            alert(t('admin_only_edit_employee_alert'));
            return;
        }
        setEmployeeToEdit(employee);
        setDialogOpen(true);
    };
    
    const handleDelete = (employee: Employee) => {
        if (user?.role !== 'admin') {
            alert(t('admin_only_delete_employee_alert'));
            return;
        }
        setEmployeeToDelete(employee);
    };

    const confirmDelete = () => {
        if (employeeToDelete) {
            deleteEmployee(employeeToDelete.id);
            setEmployeeToDelete(null);
        }
    };

    const handleAttendanceChange = (employeeId: string, status: AttendanceStatus) => {
        markAttendance(employeeId, selectedDate, status);
    };

    const getStatusForEmployee = (employeeId: string): AttendanceStatus => {
        return dailyAttendance.find(a => a.employeeId === employeeId)?.status || 'Absent';
    };
    
    const attendanceSummary = useMemo(() => {
        const present = dailyAttendance.filter(a => a.status === 'Present').length;
        const leave = dailyAttendance.filter(a => a.status === 'Leave').length;
        // Correctly calculate absent: total employees minus those present or on leave for that day
        const absent = employees.length - present - leave;
        return { present, absent, leave };
    }, [dailyAttendance, employees.length]);

    const getStatusColorClass = (status: AttendanceStatus) => {
        switch (status) {
            case 'Present':
                return 'bg-green-100 text-green-800 focus:ring-green-500 border-green-200';
            case 'Absent':
                return 'bg-red-100 text-red-800 focus:ring-red-500 border-red-200';
            case 'Leave':
                return 'bg-yellow-100 text-yellow-800 focus:ring-yellow-500 border-yellow-200';
            default:
                return '';
        }
    };

    if (isAppDataLoading) {
      return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-2xl font-semibold flex items-center gap-2"><Users className="w-6 h-6"/>{t('attendance_page_title')}</h1>
                <div className="flex gap-2">
                    <Button onClick={handleAddNew} disabled={user?.role !== 'admin'} className="w-full sm:w-auto">
                        <PlusCircle className="mr-2 h-4 w-4" /> {t('add_employee_button')}
                    </Button>
                </div>
            </div>

            {/* Attendance Section */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('daily_attendance_title')}</CardTitle>
                    <CardDescription>{t('daily_attendance_description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div>
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                    "w-full sm:w-[280px] justify-start text-left font-normal",
                                    !selectedDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {selectedDate ? format(selectedDate, "PPP") : <span>{t('pick_a_date')}</span>}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={(date) => setSelectedDate(date || new Date())}
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                        </div>
                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-sm w-full">
                            <div className="flex items-center gap-2 p-2 rounded-md bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300"><UserCheck className="w-5 h-5"/> {t('present_label')}: <span className="font-bold">{attendanceSummary.present}</span></div>
                            <div className="flex items-center gap-2 p-2 rounded-md bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300"><UserX className="w-5 h-5"/> {t('absent_label')}: <span className="font-bold">{attendanceSummary.absent}</span></div>
                            <div className="flex items-center gap-2 p-2 rounded-md bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300"><NotebookText className="w-5 h-5"/> {t('on_leave_label')}: <span className="font-bold">{attendanceSummary.leave}</span></div>
                        </div>
                    </div>

                     <div className="rounded-md border overflow-auto max-h-96">
                        <Table>
                             <TableHeader>
                                <TableRow>
                                    <TableHead>{t('employee_name_header')}</TableHead>
                                    <TableHead className="hidden sm:table-cell">{t('role_header')}</TableHead>
                                    <TableHead className="text-right">{t('attendance_status_header')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {employees.map(employee => {
                                    const status = getStatusForEmployee(employee.id);
                                    return (
                                        <TableRow key={employee.id}>
                                            <TableCell className="font-medium">
                                                {employee.name}
                                                <div className="text-muted-foreground text-xs sm:hidden">{employee.role}</div>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">{employee.role}</TableCell>
                                            <TableCell className="text-right">
                                                <Select
                                                    value={status}
                                                    onValueChange={(newStatus) => handleAttendanceChange(employee.id, newStatus as AttendanceStatus)}
                                                >
                                                    <SelectTrigger className={cn("w-32 ml-auto font-semibold", getStatusColorClass(status))}>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Present">{t('present_label')}</SelectItem>
                                                        <SelectItem value="Absent">{t('absent_label')}</SelectItem>
                                                        <SelectItem value="Leave">{t('on_leave_label')}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Employee List Table */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('employee_list_title')}</CardTitle>
                    <CardDescription>{t('employee_list_description')}</CardDescription>
                </CardHeader>
                 <CardContent className="space-y-4">
                    <Input 
                        placeholder={t('search_by_name_or_role_placeholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="rounded-md border overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('name_header')}</TableHead>
                                    <TableHead className="hidden md:table-cell">{t('role_header')}</TableHead>
                                    <TableHead className="hidden lg:table-cell">{t('phone_header')}</TableHead>
                                    <TableHead className="hidden lg:table-cell">{t('joining_date_header')}</TableHead>
                                    <TableHead className="text-right">{t('salary_header')}</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredEmployees.map(employee => (
                                    <TableRow key={employee.id}>
                                        <TableCell className="font-medium">
                                            {employee.name}
                                            <div className="text-muted-foreground text-xs md:hidden">{employee.role}</div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">{employee.role}</TableCell>
                                        <TableCell className="hidden lg:table-cell">{employee.phone}</TableCell>
                                        <TableCell className="hidden lg:table-cell">{format(new Date(employee.joiningDate), 'PP')}</TableCell>
                                        <TableCell className="text-right font-mono">${employee.salary.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEdit(employee)} disabled={user?.role !== 'admin'}><Pencil className="mr-2 h-4 w-4"/> {t('edit_button')}</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleDelete(employee)} disabled={user?.role !== 'admin'} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/> {t('delete_button')}</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            
            <EmployeeDialog 
                open={isDialogOpen} 
                onOpenChange={setDialogOpen}
                employee={employeeToEdit}
            />

            <AlertDialog open={!!employeeToDelete} onOpenChange={() => setEmployeeToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('are_you_sure_title')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('delete_employee_confirmation_description', { name: employeeToDelete?.name })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel_button')}</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">{t('delete_button')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

    