
'use client';

import { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import type { Employee, Attendance, AttendanceStatus } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { isSameDay } from 'date-fns';
import { useAppData } from './use-app-data';

interface EmployeeContextType {
  employees: Employee[];
  attendance: Attendance[];
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (employeeId: string, updatedData: Omit<Employee, 'id'>) => void;
  deleteEmployee: (employeeId: string) => void;
  markAttendance: (employeeId: string, date: Date, status: AttendanceStatus) => void;
  getAttendanceForDate: (date: Date) => Attendance[];
  getAttendanceSummaryForDate: (date: Date) => { present: number; absent: number; leave: number; total: number };
  isLoading: boolean;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

const useEmployeesData = (): EmployeeContextType => {
  const { employees, setEmployees, attendance, setAttendance, isAppDataLoading } = useAppData();
  const { toast } = useToast();

  const addEmployee = useCallback((employeeData: Omit<Employee, 'id'>) => {
    const newEmployee: Employee = { ...employeeData, id: `emp-${Date.now()}` };
    setEmployees(prev => [newEmployee, ...prev]);
    toast({ title: "Employee Added", description: `${newEmployee.name} has been added.` });
  }, [toast, setEmployees]);

  const updateEmployee = useCallback((employeeId: string, updatedData: Omit<Employee, 'id'>) => {
    setEmployees(prev => prev.map(e => (e.id === employeeId ? { id: employeeId, ...updatedData } : e)));
    toast({ title: "Employee Updated", description: "The employee details have been updated." });
  }, [toast, setEmployees]);
    
  const deleteEmployee = useCallback((employeeId: string) => {
    setEmployees(prev => prev.filter(e => e.id !== employeeId));
    toast({ title: "Employee Deleted", description: "The employee record has been removed." });
  }, [toast, setEmployees]);

  const markAttendance = useCallback((employeeId: string, date: Date, status: AttendanceStatus) => {
    setAttendance(prev => {
        const todayAttendance = prev.filter(a => isSameDay(new Date(a.date), date));
        const existingRecord = todayAttendance.find(a => a.employeeId === employeeId);

        if (existingRecord) {
            return prev.map(a => a.id === existingRecord.id ? { ...a, status } : a);
        } else {
            const newRecord: Attendance = {
                id: `att-${Date.now()}`,
                employeeId,
                date: date.toISOString(),
                status,
            };
            return [...prev, newRecord];
        }
    });
  }, [setAttendance]);

  const getAttendanceForDate = useCallback((date: Date) => {
    return attendance.filter(a => isSameDay(new Date(a.date), date));
  }, [attendance]);
  
  const getAttendanceSummaryForDate = useCallback((date: Date) => {
    const dailyRecords = getAttendanceForDate(date);
    const present = dailyRecords.filter(a => a.status === 'Present').length;
    const leave = dailyRecords.filter(a => a.status === 'Leave').length;
    const absent = employees.length - present - leave;
    return { present, absent, leave, total: employees.length };
  }, [getAttendanceForDate, employees.length]);

  return useMemo(() => ({
      employees,
      attendance,
      addEmployee,
      updateEmployee,
      deleteEmployee,
      markAttendance,
      getAttendanceForDate,
      getAttendanceSummaryForDate,
      isLoading: isAppDataLoading
  }), [employees, attendance, addEmployee, updateEmployee, deleteEmployee, markAttendance, getAttendanceForDate, getAttendanceSummaryForDate, isAppDataLoading]);
}

export function useEmployees() {
  return useEmployeesData();
}
