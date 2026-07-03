"use client";

import { useState, useRef } from 'react';
import { X, Upload, Download, AlertCircle, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import { Card } from '@doptor/shared';
import { toast } from 'sonner';
import { campusService } from '../../../services/campus.service';
import { useAuth } from '../../../contexts/AuthContext';

interface BulkUploadDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

interface ParsedStudent {
    rollNumber: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    email: string;
    phone: string;
    parentName: string;
    parentPhone: string;
    errors?: string[];
}

function parseCsv(text: string): string[][] {
    return text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => line.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')));
}

function validateStudent(s: ParsedStudent): string[] {
    const errors: string[] = [];
    if (!s.firstName) errors.push('First name is required');
    if (!s.lastName) errors.push('Last name is required');
    if (!s.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email)) errors.push('Invalid email format');
    if (!s.parentName) errors.push('Parent name is required');
    return errors;
}

export function BulkUploadDialog({ isOpen, onClose, onSuccess }: BulkUploadDialogProps) {
    const { user } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ParsedStudent[]>([]);
    const [uploading, setUploading] = useState(false);
    const [step, setStep] = useState<'upload' | 'preview' | 'success'>('upload');
    const [importedCount, setImportedCount] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;
        setFile(selectedFile);

        const reader = new FileReader();
        reader.onload = () => {
            const text = String(reader.result || '');
            const rows = parseCsv(text);
            const dataRows = rows.slice(1); // skip header

            const parsed: ParsedStudent[] = dataRows.map(cols => {
                const s: ParsedStudent = {
                    rollNumber: cols[0] || '',
                    firstName: cols[1] || '',
                    lastName: cols[2] || '',
                    dateOfBirth: cols[3] || '',
                    gender: cols[4] || '',
                    email: cols[5] || '',
                    phone: cols[6] || '',
                    parentName: cols[7] || '',
                    parentPhone: cols[8] || '',
                };
                const errors = validateStudent(s);
                return errors.length > 0 ? { ...s, errors } : s;
            });

            setParsedData(parsed);
            setStep('preview');
        };
        reader.onerror = () => {
            toast.error('Failed to read file');
        };
        reader.readAsText(selectedFile);
    };

    const handleDownloadTemplate = () => {
        const template = `Roll Number,First Name,Last Name,Date of Birth (YYYY-MM-DD),Gender (male/female/other),Email,Phone,Parent Name,Parent Phone
2024001,John,Doe,2010-01-15,male,john.doe@student.edu,+91 98765 43210,Jane Doe,+91 98765 43211
2024002,Jane,Smith,2010-03-22,female,jane.smith@student.edu,+91 98765 43212,John Smith,+91 98765 43213`;

        const blob = new Blob([template], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'student_upload_template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const handleImport = async () => {
        if (!user?.organisation_id) {
            toast.error('Missing organisation context');
            return;
        }
        setUploading(true);
        try {
            const rows = validStudents.map(s => ({
                email: s.email,
                first_name: s.firstName,
                last_name: s.lastName,
                rollNo: s.rollNumber || undefined,
                phone: s.phone || undefined,
                guardianName: s.parentName || undefined,
                guardianPhone: s.parentPhone || undefined,
            }));
            const results = await campusService.bulkCreateStudents(user.organisation_id, rows);
            const succeeded = results.filter(r => r.success).length;
            const failed = results.filter(r => !r.success);
            if (failed.length > 0) {
                toast.error(`${failed.length} record(s) failed to import`);
            }
            setImportedCount(succeeded);
            setStep('success');
            setTimeout(() => {
                onClose();
                if (onSuccess) onSuccess();
                resetDialog();
            }, 2000);
        } catch (error) {
            console.error('Bulk import failed', error);
            toast.error('Failed to import students');
        } finally {
            setUploading(false);
        }
    };

    const resetDialog = () => {
        setFile(null);
        setParsedData([]);
        setStep('upload');
        setImportedCount(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const validStudents = parsedData.filter(s => !s.errors || s.errors.length === 0);
    const invalidStudents = parsedData.filter(s => s.errors && s.errors.length > 0);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white max-w-4xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Bulk Upload Students</h3>
                        <p className="text-sm text-slate-500 mt-1">
                            {step === 'upload' && 'Upload a CSV file with student data'}
                            {step === 'preview' && 'Review and confirm student data'}
                            {step === 'success' && 'Students uploaded successfully'}
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            onClose();
                            resetDialog();
                        }}
                        className="p-1 hover:bg-slate-100 transition-colors"
                    >
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {step === 'upload' && (
                        <div className="space-y-6">
                            {/* Download Template */}
                            <Card className="p-6 border-slate-200 bg-blue-50 border-blue-100">
                                <div className="flex items-start gap-4">
                                    <FileSpreadsheet size={24} className="text-blue-600 shrink-0 mt-1" />
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-slate-900 mb-1">Download Template First</h4>
                                        <p className="text-sm text-slate-600 mb-3">
                                            Download our CSV template to ensure your data is formatted correctly
                                        </p>
                                        <button
                                            onClick={handleDownloadTemplate}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium"
                                        >
                                            <Download size={16} />
                                            Download Template
                                        </button>
                                    </div>
                                </div>
                            </Card>

                            {/* Upload Area */}
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-300 hover:border-primary-500 bg-slate-50 hover:bg-primary-50/50 p-12 text-center cursor-pointer transition-all"
                            >
                                <Upload size={48} className="mx-auto text-slate-400 mb-4" />
                                <p className="text-sm font-medium text-slate-900 mb-1">
                                    {file ? file.name : 'Click to upload or drag and drop'}
                                </p>
                                <p className="text-xs text-slate-500">CSV files only (max 5MB)</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </div>

                            {/* Instructions */}
                            <Card className="p-6 border-slate-200">
                                <h4 className="font-semibold text-slate-900 mb-3">Instructions</h4>
                                <ul className="space-y-2 text-sm text-slate-600">
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary-600 font-bold">1.</span>
                                        Download the CSV template using the button above
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary-600 font-bold">2.</span>
                                        Fill in student data following the format in the template
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary-600 font-bold">3.</span>
                                        Ensure all required fields are filled (marked with *)
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary-600 font-bold">4.</span>
                                        Upload the completed CSV file
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary-600 font-bold">5.</span>
                                        Review the preview and confirm to import
                                    </li>
                                </ul>
                            </Card>
                        </div>
                    )}

                    {step === 'preview' && (
                        <div className="space-y-6">
                            {/* Summary */}
                            <div className="grid grid-cols-3 gap-4">
                                <Card className="p-4 border-slate-200">
                                    <p className="text-xs text-slate-500 mb-1">Total Records</p>
                                    <p className="text-2xl font-bold text-slate-900">{parsedData.length}</p>
                                </Card>
                                <Card className="p-4 border-slate-200 border-emerald-200 bg-emerald-50">
                                    <p className="text-xs text-emerald-700 mb-1">Valid</p>
                                    <p className="text-2xl font-bold text-emerald-700">{validStudents.length}</p>
                                </Card>
                                <Card className="p-4 border-slate-200 border-red-200 bg-red-50">
                                    <p className="text-xs text-red-700 mb-1">Invalid</p>
                                    <p className="text-2xl font-bold text-red-700">{invalidStudents.length}</p>
                                </Card>
                            </div>

                            {/* Error Alert */}
                            {invalidStudents.length > 0 && (
                                <Card className="p-4 border-red-200 bg-red-50">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-red-900 mb-1">
                                                {invalidStudents.length} record(s) have errors
                                            </p>
                                            <p className="text-sm text-red-700">
                                                Invalid rows will be skipped. Fix the source CSV and re-upload if you need them included.
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {/* Preview Table */}
                            <Card className="border-slate-200 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                                                <th className="text-left py-3 px-4 font-semibold text-slate-700">Roll No</th>
                                                <th className="text-left py-3 px-4 font-semibold text-slate-700">Name</th>
                                                <th className="text-left py-3 px-4 font-semibold text-slate-700">DOB</th>
                                                <th className="text-left py-3 px-4 font-semibold text-slate-700">Parent</th>
                                                <th className="text-left py-3 px-4 font-semibold text-slate-700">Errors</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {parsedData.map((student, idx) => (
                                                <tr key={idx} className={student.errors ? 'bg-red-50' : ''}>
                                                    <td className="py-3 px-4">
                                                        {student.errors ? (
                                                            <AlertCircle size={16} className="text-red-600" />
                                                        ) : (
                                                            <CheckCircle2 size={16} className="text-emerald-600" />
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 font-medium">{student.rollNumber}</td>
                                                    <td className="py-3 px-4">{student.firstName} {student.lastName}</td>
                                                    <td className="py-3 px-4">{student.dateOfBirth}</td>
                                                    <td className="py-3 px-4">{student.parentName}</td>
                                                    <td className="py-3 px-4">
                                                        {student.errors && (
                                                            <ul className="text-xs text-red-700 space-y-1">
                                                                {student.errors.map((error, i) => (
                                                                    <li key={i}>• {error}</li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-16 h-16 bg-emerald-100 flex items-center justify-center mb-4">
                                <CheckCircle2 size={32} className="text-emerald-600" />
                            </div>
                            <h4 className="text-xl font-bold text-slate-900 mb-2">Invitations Sent!</h4>
                            <p className="text-sm text-slate-600">
                                {importedCount} student(s) have been invited successfully
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {step !== 'success' && (
                    <div className="p-6 border-t border-slate-200 flex gap-3">
                        <button
                            onClick={() => {
                                if (step === 'preview') {
                                    setStep('upload');
                                    setParsedData([]);
                                    setFile(null);
                                } else {
                                    onClose();
                                    resetDialog();
                                }
                            }}
                            className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors font-medium"
                        >
                            {step === 'preview' ? 'Back' : 'Cancel'}
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={step === 'upload' || validStudents.length === 0 || uploading}
                            className="flex-1 px-4 py-2.5 bg-primary-600 text-white hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {uploading ? 'Importing...' : `Import ${validStudents.length} Student(s)`}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
