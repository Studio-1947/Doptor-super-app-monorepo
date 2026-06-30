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

interface ParsedFaculty {
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    department: string;
    designation: string;
    qualification: string;
    errors?: string[];
}

function parseCsv(text: string): string[][] {
    return text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => line.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')));
}

function validateFaculty(f: ParsedFaculty): string[] {
    const errors: string[] = [];
    if (!f.firstName) errors.push('First name is required');
    if (!f.lastName) errors.push('Last name is required');
    if (!f.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) errors.push('Invalid email format');
    if (!f.phone) errors.push('Phone is required');
    if (!f.department) errors.push('Department is required');
    if (!f.qualification) errors.push('Qualification is required');
    return errors;
}

export function BulkUploadDialog({ isOpen, onClose, onSuccess }: BulkUploadDialogProps) {
    const { user } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ParsedFaculty[]>([]);
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

            const parsed: ParsedFaculty[] = dataRows.map(cols => {
                const f: ParsedFaculty = {
                    employeeId: cols[0] || '',
                    firstName: cols[1] || '',
                    lastName: cols[2] || '',
                    email: cols[3] || '',
                    phone: cols[4] || '',
                    department: cols[5] || '',
                    designation: cols[6] || '',
                    qualification: cols[7] || '',
                };
                const errors = validateFaculty(f);
                return errors.length > 0 ? { ...f, errors } : f;
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
        const template = `Employee ID,First Name,Last Name,Email,Phone,Department,Designation,Qualification,Specialization,Experience (years),Join Date (YYYY-MM-DD),Subjects (semicolon separated)
EMP001,John,Doe,john.doe@school.edu,+91 98765 43210,Mathematics,Assistant Professor,M.Sc. Mathematics,Algebra,5,2019-07-01,Mathematics;Algebra
EMP002,Jane,Smith,jane.smith@school.edu,+91 98765 43211,Science,Associate Professor,Ph.D. Physics,Quantum Physics,8,2016-08-15,Physics;Chemistry`;

        const blob = new Blob([template], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'faculty_upload_template.csv';
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
            const rows = validFaculty.map(f => ({
                email: f.email,
                first_name: f.firstName,
                last_name: f.lastName,
                phone: f.phone || undefined,
                designation: f.designation || undefined,
                qualification: f.qualification || undefined,
            }));
            const results = await campusService.bulkCreateFaculty(user.organisation_id, rows);
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
            toast.error('Failed to import faculty');
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

    const validFaculty = parsedData.filter(f => !f.errors || f.errors.length === 0);
    const invalidFaculty = parsedData.filter(f => f.errors && f.errors.length > 0);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white max-w-4xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Bulk Upload Faculty</h3>
                        <p className="text-sm text-slate-500 mt-1">
                            {step === 'upload' && 'Upload a CSV file with faculty data'}
                            {step === 'preview' && 'Review and confirm faculty data'}
                            {step === 'success' && 'Faculty uploaded successfully'}
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
                                        Download the CSV template
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary-600 font-bold">2.</span>
                                        Fill in faculty data following the format
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary-600 font-bold">3.</span>
                                        Ensure all required fields are filled
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary-600 font-bold">4.</span>
                                        Upload the completed CSV file
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary-600 font-bold">5.</span>
                                        Review and confirm to import
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
                                    <p className="text-2xl font-bold text-emerald-700">{validFaculty.length}</p>
                                </Card>
                                <Card className="p-4 border-slate-200 border-red-200 bg-red-50">
                                    <p className="text-xs text-red-700 mb-1">Invalid</p>
                                    <p className="text-2xl font-bold text-red-700">{invalidFaculty.length}</p>
                                </Card>
                            </div>

                            {/* Error Alert */}
                            {invalidFaculty.length > 0 && (
                                <Card className="p-4 border-red-200 bg-red-50">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-red-900 mb-1">
                                                {invalidFaculty.length} record(s) have errors
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
                                                <th className="text-left py-3 px-4 font-semibold text-slate-700">Employee ID</th>
                                                <th className="text-left py-3 px-4 font-semibold text-slate-700">Name</th>
                                                <th className="text-left py-3 px-4 font-semibold text-slate-700">Department</th>
                                                <th className="text-left py-3 px-4 font-semibold text-slate-700">Errors</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {parsedData.map((faculty, idx) => (
                                                <tr key={idx} className={faculty.errors ? 'bg-red-50' : ''}>
                                                    <td className="py-3 px-4">
                                                        {faculty.errors ? (
                                                            <AlertCircle size={16} className="text-red-600" />
                                                        ) : (
                                                            <CheckCircle2 size={16} className="text-emerald-600" />
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 font-medium">{faculty.employeeId}</td>
                                                    <td className="py-3 px-4">{faculty.firstName} {faculty.lastName}</td>
                                                    <td className="py-3 px-4">{faculty.department}</td>
                                                    <td className="py-3 px-4">
                                                        {faculty.errors && (
                                                            <ul className="text-xs text-red-700 space-y-1">
                                                                {faculty.errors.map((error, i) => (
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
                            <h4 className="text-xl font-bold text-slate-900 mb-2">Upload Successful!</h4>
                            <p className="text-sm text-slate-600">
                                {importedCount} faculty member(s) have been imported successfully
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
                            disabled={step === 'upload' || validFaculty.length === 0 || uploading}
                            className="flex-1 px-4 py-2.5 bg-primary-600 text-white hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {uploading ? 'Importing...' : `Import ${validFaculty.length} Faculty`}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
